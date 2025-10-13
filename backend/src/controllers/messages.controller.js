import admin from '../config/firebase.js';
import { db } from '../config/firebase.js';
import { messageSchema } from '../models/message.model.js';
import { deleteS3Object } from '../services/s3.service.js';

export const createMessage = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const uid = req.user.uid;
    const { content, type, fileRef, fileMetadata, tags } = req.body;

    // Validate
    const validated = messageSchema.parse({
      content,
      type,
      fileRef,
      fileMetadata,
      tags
    });

    const messageRef = db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc(channelId)
      .collection('messages')
      .doc();

    const messageData = {
      id: messageRef.id,
      content: validated.content,
      type: validated.type,
      fileRef: validated.fileRef || null,
      fileMetadata: validated.fileMetadata || null,
      tags: validated.tags || [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      deviceInfo: {
        userAgent: req.headers['user-agent'] || 'unknown',
        platform: req.headers['x-platform'] || 'web'
      }
    };

    await messageRef.set(messageData);

    // Increment channel message count
    const channelRef = db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc(channelId);

    await channelRef.update({
      messageCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({ message: messageData });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const uid = req.user.uid;
    const { limit = 50, cursor } = req.query;

    let query = db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc(channelId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    // Pagination cursor
    if (cursor) {
      const cursorDoc = await db
        .collection('users')
        .doc(uid)
        .collection('channels')
        .doc(channelId)
        .collection('messages')
        .doc(cursor)
        .get();

      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const messages = snapshot.docs.map(doc => doc.data());
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    res.json({
      messages,
      nextCursor: lastDoc ? lastDoc.id : null,
      hasMore: snapshot.docs.length === parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { channelId, messageId } = req.params;
    const uid = req.user.uid;

    const messageRef = db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc(channelId)
      .collection('messages')
      .doc(messageId);

    const messageDoc = await messageRef.get();

    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const messageData = messageDoc.data();

    // Delete associated S3 file if exists
    if (messageData.fileRef) {
      try {
        await deleteS3Object(messageData.fileRef);
      } catch (error) {
        console.error('Failed to delete S3 object:', error);
        // Continue with message deletion even if S3 deletion fails
      }
    }

    await messageRef.delete();

    // Decrement channel message count
    const channelRef = db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc(channelId);

    await channelRef.update({
      messageCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const togglePinMessage = async (req, res, next) => {
  try {
    const { channelId, messageId } = req.params;
    const uid = req.user.uid;

    const messageRef = db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc(channelId)
      .collection('messages')
      .doc(messageId);

    const messageDoc = await messageRef.get();

    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const currentPinned = messageDoc.data().isPinned || false;
    await messageRef.update({ isPinned: !currentPinned });

    res.json({
      message: 'Pin status updated',
      isPinned: !currentPinned
    });
  } catch (error) {
    next(error);
  }
};
