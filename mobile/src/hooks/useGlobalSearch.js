import { useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useGlobalSearch = () => {
  const { user } = useAuth();
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const searchAllChannels = useCallback(async (searchTerm, pinnedOnly = false) => {
    if (!user) {
      setSearchResults([]);
      return;
    }

    // If no search term and not filtering by pinned, return empty
    if (!searchTerm.trim() && !pinnedOnly) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      // Get all channels
      const channelsRef = collection(db, 'users', user.uid, 'channels');
      const channelsSnapshot = await getDocs(channelsRef);

      const allResults = [];

      // Search through each channel's messages
      for (const channelDoc of channelsSnapshot.docs) {
        const channelData = channelDoc.data();
        const messagesRef = collection(
          db,
          'users',
          user.uid,
          'channels',
          channelDoc.id,
          'messages'
        );

        const messagesQuery = query(
          messagesRef,
          orderBy('createdAt', 'desc'),
          limit(100) // Limit per channel for performance
        );

        const messagesSnapshot = await getDocs(messagesQuery);

        // Filter messages that match the search term and/or pinned status
        messagesSnapshot.docs.forEach(doc => {
          const messageData = doc.data();
          const matchesSearch = !searchTerm.trim() ||
            messageData.content?.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesPinned = !pinnedOnly || messageData.isPinned;

          if (matchesSearch && matchesPinned) {
            allResults.push({
              id: doc.id,
              ...messageData,
              channelId: channelDoc.id,
              channelName: channelData.name
            });
          }
        });
      }

      // Sort by date (newest first)
      allResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setSearchResults(allResults);
      setSearching(false);
    } catch (error) {
      console.error('Global search error:', error);
      setSearching(false);
    }
  }, [user]);

  return { searchAllChannels, searching, searchResults };
};
