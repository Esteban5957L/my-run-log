export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: string;
  readAt: string | null;
  sender?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  receiver?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export interface Conversation {
  oderId: string;
  odername: string;
  oderAvatar: string | null;
  lastMessage: Message | null;
  unreadCount: number;
}

export interface ConversationListItem {
  oderId: string;
  odername: string;
  oderAvatar: string | null;
  lastMessage: {
    content: string;
    sentAt: string;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
}
