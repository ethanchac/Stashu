import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useMessages = (channelId, initialLimit = 30) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!user || !channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasMore(true);
    lastDocRef.current = null;

    // Create Firestore query
    const messagesRef = collection(
      db,
      'users',
      user.uid,
      'channels',
      channelId,
      'messages'
    );

    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(initialLimit)
    );

    // Subscribe to realtime updates
    unsubscribeRef.current = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Store the last document for pagination
        if (snapshot.docs.length > 0) {
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        }

        // Check if there are more messages
        setHasMore(snapshot.docs.length === initialLimit);

        // Reverse to show oldest first in UI
        setMessages(messagesData.reverse());
        setLoading(false);
      },
      (err) => {
        console.error('Messages listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user, channelId, initialLimit]);

  const loadMore = useCallback(async () => {
    if (!user || !channelId || !hasMore || loadingMore || !lastDocRef.current) {
      return;
    }

    setLoadingMore(true);

    try {
      const messagesRef = collection(
        db,
        'users',
        user.uid,
        'channels',
        channelId,
        'messages'
      );

      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDocRef.current),
        limit(initialLimit)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Update last document reference
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];

      // Check if there are more messages
      setHasMore(snapshot.docs.length === initialLimit);

      // Prepend older messages (they're already in reverse order)
      setMessages(prev => [...newMessages.reverse(), ...prev]);
      setLoadingMore(false);
    } catch (err) {
      console.error('Failed to load more messages:', err);
      setError(err.message);
      setLoadingMore(false);
    }
  }, [user, channelId, hasMore, loadingMore, initialLimit]);

  return { messages, loading, loadingMore, error, hasMore, loadMore };
};
