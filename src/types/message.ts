export interface MessageActivity {
  id: string;
  name: string;
  activityType: string;
  date: string;
  distance: number;
  duration: number;
  avgPace?: number | null;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

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
  // Actividad compartida
  activityId?: string | null;
  activity?: MessageActivity | null;
  // Adjuntos
  attachmentUrl?: string | null;
  attachmentType?: 'image' | 'file' | null;
  attachmentName?: string | null;
  // Reacciones
  reactions?: MessageReaction[];
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
