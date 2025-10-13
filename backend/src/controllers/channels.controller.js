import { db } from '../config/firebase.js';
import { channelSchema, updateChannelSchema } from '../models/channel.model.js';

export const createChannel = async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;
    const uid = req.user.uid;

    // Validate input
    const validated = channelSchema.parse({ name, color, icon });

    const channelRef = db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc();

    const channelData = {
      id: channelRef.id,
      name: validated.name,
      color: validated.color,
      icon: validated.icon,
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await channelRef.set(channelData);

    res.status(201).json({ channel: channelData });
  } catch (error) {
    next(error);
  }
};

export const getChannels = async (req, res, next) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .orderBy('createdAt', 'desc')
      .get();

    const channels = snapshot.docs.map(doc => doc.data());

    res.json({ channels });
  } catch (error) {
    next(error);
  }
};

export const getChannelById = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const uid = req.user.uid;

    const channelDoc = await db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc(channelId)
      .get();

    if (!channelDoc.exists) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ channel: channelDoc.data() });
  } catch (error) {
    next(error);
  }
};

export const updateChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const uid = req.user.uid;

    // Validate input
    const validated = updateChannelSchema.parse(req.body);

    const channelRef = db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc(channelId);

    const channelDoc = await channelRef.get();

    if (!channelDoc.exists) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const updateData = {
      ...validated,
      updatedAt: new Date().toISOString()
    };

    await channelRef.update(updateData);

    const updatedChannel = {
      ...channelDoc.data(),
      ...updateData
    };

    res.json({ channel: updatedChannel });
  } catch (error) {
    next(error);
  }
};

export const deleteChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const uid = req.user.uid;

    const channelRef = db
      .collection('users')
      .doc(uid)
      .collection('channels')
      .doc(channelId);

    const channelDoc = await channelRef.get();

    if (!channelDoc.exists) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Delete all messages in the channel (batch operation)
    const messagesSnapshot = await channelRef.collection('messages').get();
    const batch = db.batch();

    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    batch.delete(channelRef);
    await batch.commit();

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    next(error);
  }
};
