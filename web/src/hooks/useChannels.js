import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useChannels = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setChannels([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create Firestore query
    const channelsRef = collection(db, 'users', user.uid, 'channels');
    const q = query(channelsRef, orderBy('createdAt', 'desc'));

    // Subscribe to realtime updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const channelsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setChannels(channelsData);
        setLoading(false);
      },
      (err) => {
        console.error('Channels listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  return { channels, loading, error };
};
