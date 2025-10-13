import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useMessages = (channelId, messageLimit = 50) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

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
      limit(messageLimit)
    );

    // Subscribe to realtime updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

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
    return () => unsubscribe();
  }, [user, channelId, messageLimit]);

  return { messages, loading, error };
};
