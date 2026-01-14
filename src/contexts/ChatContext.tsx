import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { socketService } from '@/services/socket.service';
import { messageService } from '@/services/message.service';
import type { Message, ConversationListItem } from '@/types/message';

interface ChatContextType {
  conversations: ConversationListItem[];
  unreadTotal: number;
  isConnected: boolean;
  loadConversations: () => Promise<void>;
  sendMessage: (receiverId: string, content: string) => void;
  onNewMessage: (handler: (message: Message) => void) => () => void;
  onTyping: (handler: (data: { oderId: string; isTyping: boolean }) => void) => () => void;
  sendTyping: (receiverId: string, isTyping: boolean) => void;
  markAsRead: (senderId: string, messageIds: string[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
      
      const checkConnection = setInterval(() => {
        setIsConnected(socketService.isConnected());
      }, 1000);

      return () => {
        clearInterval(checkConnection);
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const { conversations: convs } = await messageService.getConversations();
      setConversations(convs);
      setUnreadTotal(convs.reduce((sum, c) => sum + c.unreadCount, 0));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);

  // Listen for new messages to update conversations
  useEffect(() => {
    const unsubscribe = socketService.onMessage((message) => {
      // Update conversations list
      setConversations(prev => {
        const existingIndex = prev.findIndex(
          c => c.oderId === message.senderId || c.oderId === message.receiverId
        );
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          const conv = updated[existingIndex];
          updated[existingIndex] = {
            ...conv,
            lastMessage: {
              content: message.content,
              sentAt: message.sentAt,
              isFromMe: message.senderId !== conv.oderId,
            },
            unreadCount: message.senderId === conv.oderId 
              ? conv.unreadCount + 1 
              : conv.unreadCount,
          };
          // Move to top
          const [moved] = updated.splice(existingIndex, 1);
          updated.unshift(moved);
          return updated;
        }
        
        return prev;
      });

      // Update unread count
      setUnreadTotal(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    socketService.sendMessage(receiverId, content);
  }, []);

  const onNewMessage = useCallback((handler: (message: Message) => void) => {
    return socketService.onMessage(handler);
  }, []);

  const onTyping = useCallback((handler: (data: { oderId: string; isTyping: boolean }) => void) => {
    return socketService.onTyping(handler);
  }, []);

  const sendTyping = useCallback((receiverId: string, isTyping: boolean) => {
    socketService.sendTyping(receiverId, isTyping);
  }, []);

  const markAsRead = useCallback((senderId: string, messageIds: string[]) => {
    socketService.markAsRead(senderId, messageIds);
    // Update local state
    setConversations(prev => 
      prev.map(c => c.oderId === senderId ? { ...c, unreadCount: 0 } : c)
    );
    setUnreadTotal(prev => Math.max(0, prev - messageIds.length));
  }, []);

  return (
    <ChatContext.Provider value={{
      conversations,
      unreadTotal,
      isConnected,
      loadConversations,
      sendMessage,
      onNewMessage,
      onTyping,
      sendTyping,
      markAsRead,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
