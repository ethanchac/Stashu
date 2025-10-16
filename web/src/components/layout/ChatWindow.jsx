import { useEffect, useRef, useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import MessageItem from '../messages/MessageItem';
import MessageInput from '../messages/MessageInput';

export default function ChatWindow({ channelId }) {
  const { messages, loading, loadingMore, hasMore, loadMore } = useMessages(channelId);
  const { searchAllChannels, searching, searchResults } = useGlobalSearch();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageRefs = useRef({});
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const previousScrollHeight = useRef(0);
  const previousMessageCount = useRef(0);
  const isUserScrollingUp = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const debounceTimer = useRef(null);
  const [showSearchScope, setShowSearchScope] = useState(false);
  const [searchScope, setSearchScope] = useState('current'); // 'current' or 'all'
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const searchInputRef = useRef(null);
  const searchScopeRef = useRef(null);
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Debounce search query (500ms delay)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);

      // Trigger global search if scope is 'all'
      if (searchScope === 'all') {
        searchAllChannels(searchQuery, showPinnedOnly);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, searchScope, showPinnedOnly, searchAllChannels]);

  // Filter messages based on search query, scope, and pinned status
  let filteredMessages = searchScope === 'all'
    ? searchResults
    : debouncedSearchQuery.trim()
    ? messages.filter(message =>
        message.content?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    : messages;

  // Apply pinned filter if :pinned is active
  if (showPinnedOnly) {
    filteredMessages = filteredMessages.filter(msg => msg.isPinned);
  }

  // Close search scope dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchScopeRef.current && !searchScopeRef.current.contains(event.target)) {
        setShowSearchScope(false);
        // Collapse search if empty and clicking outside
        if (!searchQuery && searchExpanded) {
          setSearchExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery, searchExpanded]);

  // Track if user is scrolling up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      isUserScrollingUp.current = !isAtBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (loading) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    // Initial load - always scroll to bottom
    if (isInitialLoad && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      setIsInitialLoad(false);
      previousMessageCount.current = messages.length;
      return;
    }

    // New messages added - scroll to bottom if user was already at bottom
    if (messages.length > previousMessageCount.current && !isUserScrollingUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    previousMessageCount.current = messages.length;
  }, [messages, loading, isInitialLoad]);

  // Handle scroll event to load more messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if user scrolled to top (within 100px)
      if (container.scrollTop < 100 && hasMore && !loadingMore) {
        // Store current scroll height before loading more
        previousScrollHeight.current = container.scrollHeight;
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loadMore]);

  // Maintain scroll position after loading more messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !loadingMore) return;

    const maintainScroll = () => {
      if (previousScrollHeight.current > 0) {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - previousScrollHeight.current;
        container.scrollTop += scrollDiff;
        previousScrollHeight.current = 0;
      }
    };

    // Use a small timeout to ensure DOM has updated
    const timer = setTimeout(maintainScroll, 100);
    return () => clearTimeout(timer);
  }, [messages, loadingMore]);

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
    setShowPinnedPanel(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-discord-muted">Loading messages...</div>
      </div>
    );
  }

  const pinnedMessages = filteredMessages.filter(msg => msg.isPinned);

  return (
    <div className="flex flex-col h-full relative">
      {/* Top Bar with Search and Pin Icon */}
      <div className="bg-discord-dark border-b border-discord-gray px-4 py-2 flex items-center justify-between gap-3">
        {/* Search Bar */}
        <div className={`relative transition-all duration-300 ease-in-out ${searchExpanded ? 'flex-1' : 'w-10'}`} ref={searchScopeRef}>
          <div className="relative">
            {/* Magnifying glass icon button - visible when collapsed */}
            {!searchExpanded && (
              <button
                onClick={() => {
                  setSearchExpanded(true);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="p-2 rounded-lg text-discord-muted hover:text-discord-text hover:bg-discord-gray transition-colors"
                title="Search messages"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {/* Search input - visible when expanded */}
            {searchExpanded && (
              <>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (!searchQuery) {
                      setShowSearchScope(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Remove tags when backspace is pressed and input is empty
                    if (e.key === 'Backspace' && !searchQuery) {
                      // Remove :pinned first, then :all
                      if (showPinnedOnly) {
                        setShowPinnedOnly(false);
                      } else if (searchScope === 'all') {
                        setSearchScope('current');
                      }
                    }
                  }}
                  placeholder="Search messages..."
                  className={`w-full bg-discord-darker border border-discord-gray rounded-lg py-2 text-discord-text placeholder-discord-muted focus:outline-none focus:ring-2 focus:ring-discord-accent focus:border-transparent transition-all ${
                    searchScope === 'all' && showPinnedOnly ? 'pl-32 pr-10' :
                    searchScope === 'all' || showPinnedOnly ? 'pl-16 pr-10' :
                    'pl-10 pr-10'
                  }`}
                />

                {/* Search scope tags */}
                {(searchScope === 'all' || showPinnedOnly) && (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {searchScope === 'all' && (
                      <button
                        onClick={() => setSearchScope('current')}
                        className="hover:opacity-80 transition-opacity"
                        title="Click to remove :all filter"
                      >
                        <span className="bg-discord-accent text-white text-xs px-2 py-0.5 rounded font-medium cursor-pointer">
                          :all
                        </span>
                      </button>
                    )}
                    {showPinnedOnly && (
                      <button
                        onClick={() => setShowPinnedOnly(false)}
                        className="hover:opacity-80 transition-opacity"
                        title="Click to remove :pinned filter"
                      >
                        <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded font-medium cursor-pointer">
                          :pinned
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Search icon */}
                {searchScope !== 'all' && !showPinnedOnly && (
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-discord-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}

                {/* Close/Clear button */}
                <button
                  onClick={() => {
                    if (searchQuery) {
                      setSearchQuery('');
                      setSearchScope('current');
                      setShowPinnedOnly(false);
                    } else {
                      setSearchExpanded(false);
                    }
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-discord-muted hover:text-discord-text transition-colors"
                  title={searchQuery ? "Clear search" : "Close search"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Search Scope Dropdown */}
          {showSearchScope && !searchQuery && searchExpanded && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-discord-dark border border-discord-gray rounded-lg shadow-xl z-50 overflow-hidden">
              {searchScope !== 'all' && (
                <button
                  onClick={() => {
                    setSearchScope('all');
                    setShowSearchScope(false);
                    searchInputRef.current?.focus();
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-discord-dark transition-colors flex items-center justify-between"
                >
                  <span className="bg-discord-accent text-white text-sm px-2.5 py-1 rounded font-medium">:all</span>
                  <span className="text-discord-muted text-sm">Search across all channels</span>
                </button>
              )}
              {!showPinnedOnly && (
                <button
                  onClick={() => {
                    setShowPinnedOnly(true);
                    setShowSearchScope(false);
                    searchInputRef.current?.focus();
                  }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-discord-dark transition-colors flex items-center justify-between ${
                    searchScope !== 'all' ? 'border-t border-discord-gray' : ''
                  }`}
                >
                  <span className="bg-yellow-500 text-white text-sm px-2.5 py-1 rounded font-medium">:pinned</span>
                  <span className="text-discord-muted text-sm">Show only pinned messages</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pin Icon Button */}
        <button
          onClick={() => setShowPinnedPanel(!showPinnedPanel)}
          className={`p-2 rounded-lg transition-colors relative flex-shrink-0 ${
            pinnedMessages.length > 0
              ? 'text-discord-accent hover:bg-discord-accent/10'
              : 'text-discord-muted hover:bg-discord-dark'
          }`}
          title={`${pinnedMessages.length} pinned message${pinnedMessages.length !== 1 ? 's' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {pinnedMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-discord-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pinnedMessages.length}
            </span>
          )}
        </button>
      </div>

      {/* Pinned Messages Popup Panel */}
      {showPinnedPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowPinnedPanel(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-discord-dark border border-discord-gray rounded-lg shadow-2xl z-40 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-discord-gray flex items-center justify-between">
              <h3 className="text-discord-text font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-discord-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Pinned Messages
              </h3>
              <button
                onClick={() => setShowPinnedPanel(false)}
                className="text-discord-muted hover:text-discord-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
              {pinnedMessages.length === 0 ? (
                <div className="text-center py-8 text-discord-muted">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <p>No pinned messages yet</p>
                  <p className="text-sm mt-1">Right-click a message to pin it</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pinnedMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => scrollToMessage(message.id)}
                      className="p-4 bg-discord-dark rounded-lg border border-discord-gray hover:border-discord-accent cursor-pointer transition-colors"
                    >
                      <p className="text-sm text-discord-muted mb-2">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                      <p className="text-discord-text">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-discord-muted text-lg mb-2">
                No messages yet
              </p>
              <p className="text-discord-muted text-sm">
                Send your first message to get started
              </p>
            </div>
          </div>
        ) : filteredMessages.length === 0 && debouncedSearchQuery ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-discord-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-discord-muted text-lg mb-2">
                No messages found
              </p>
              <p className="text-discord-muted text-sm">
                Try a different search term
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Show search results count */}
            {debouncedSearchQuery && (
              <div className="flex items-center justify-center py-2">
                <div className="bg-discord-dark px-4 py-2 rounded-lg border border-discord-gray flex items-center gap-3">
                  {searching && (
                    <svg className="animate-spin h-4 w-4 text-discord-accent" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span className="text-discord-text text-sm">
                    {searchScope === 'all' && (
                      <span className="bg-discord-accent text-white text-xs px-2 py-0.5 rounded font-medium mr-2">
                        :all
                      </span>
                    )}
                    Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                    {searchScope === 'all' && ' across all channels'}
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchScope('current');
                    }}
                    className="text-discord-accent hover:text-discord-text text-sm"
                  >
                    Clear search
                  </button>
                </div>
              </div>
            )}

            {/* Loading More Indicator */}
            {loadingMore && !debouncedSearchQuery && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-discord-muted">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Loading older messages...</span>
                </div>
              </div>
            )}

            {/* Show "No more messages" when reached the end */}
            {!hasMore && !debouncedSearchQuery && messages.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <div className="text-discord-muted text-sm">
                  No more messages
                </div>
              </div>
            )}

            {filteredMessages.map((message) => (
              <div
                key={message.id}
                ref={(el) => (messageRefs.current[message.id] = el)}
              >
                {/* Show channel name for global search results */}
                {searchScope === 'all' && message.channelName && (
                  <div className="flex items-center gap-2 mb-2 text-sm">
                    <svg className="w-4 h-4 text-discord-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="text-discord-muted font-medium">{message.channelName}</span>
                  </div>
                )}
                <MessageItem message={message} channelId={message.channelId || channelId} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput channelId={channelId} />
    </div>
  );
}
