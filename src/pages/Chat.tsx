import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Check, 
  CheckCheck,
  Loader2,
  Circle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { messageService } from '@/services/message.service';
import { athleteService } from '@/services/athlete.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/message';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  } else {
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
    });
  }
}

function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  // First, sort messages by sentAt to ensure chronological order
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );

  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = '';

  sortedMessages.forEach(message => {
    const messageDate = new Date(message.sentAt).toDateString();
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groups.push({ date: message.sentAt, messages: [message] });
    } else {
      groups[groups.length - 1].messages.push(message);
    }
  });

  return groups;
}

export default function Chat() {
  const { oderId } = useParams<{ oderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onNewMessage, sendMessage, sendTyping, markAsRead, isConnected, onTyping } = useChat();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [oderUser, setOderUser] = useState<{ id: string; name: string; avatar?: string | null } | null>(null);
  const [isOderTyping, setIsOderTyping] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load other user info and messages
  useEffect(() => {
    if (!oderId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load other user info
        if (user?.role === 'COACH') {
          const data = await athleteService.getAthleteDetail(oderId);
          setOderUser({
            id: data.athlete.id,
            name: data.athlete.name,
            avatar: data.athlete.avatar,
          });
        } else {
          // Athlete viewing coach - get from auth context or API
          if (user?.coach) {
            setOderUser({
              id: user.coach.id,
              name: user.coach.name,
              avatar: user.coach.avatar,
            });
          }
        }

        // Load messages
        const { messages: msgs, hasMore: more } = await messageService.getMessages(oderId);
        setMessages(msgs); // API already returns in chronological order (oldest first)
        setHasMore(more);

        // Mark as read
        const unreadIds = msgs
          .filter(m => m.senderId === oderId && !m.readAt)
          .map(m => m.id);
        if (unreadIds.length > 0) {
          markAsRead(oderId, unreadIds);
          await messageService.markAsRead(oderId);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar la conversación',
        });
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [oderId, user, markAsRead, toast, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!oderId) return;

    const unsubscribe = onNewMessage((message) => {
      if (message.senderId === oderId || message.receiverId === oderId) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        
        // Mark as read if from other user
        if (message.senderId === oderId) {
          markAsRead(oderId, [message.id]);
          messageService.markAsRead(oderId);
        }
      }
    });

    return unsubscribe;
  }, [oderId, onNewMessage, markAsRead]);

  // Listen for typing indicator
  useEffect(() => {
    if (!oderId) return;

    const unsubscribe = onTyping((data) => {
      if (data.oderId === oderId) {
        setIsOderTyping(data.isTyping);
      }
    });

    return unsubscribe;
  }, [oderId, onTyping]);

  const handleSend = async () => {
    if (!newMessage.trim() || !oderId || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      // Send via API for persistence (this is the source of truth)
      const { message } = await messageService.sendMessage(oderId, content);
      
      // Add to local state
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      
      // Also notify via socket for real-time
      sendMessage(oderId, content);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
      });
      setNewMessage(content); // Restore message
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (oderId) {
      sendTyping(oderId, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(oderId, false);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={oderUser?.avatar || undefined} />
              <AvatarFallback className="bg-gradient-trail text-primary-foreground">
                {oderUser?.name ? getInitials(oderUser.name) : '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-display text-lg">{oderUser?.name || 'Chat'}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isConnected ? (
                  <>
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    {isOderTyping ? 'Escribiendo...' : 'En línea'}
                  </>
                ) : (
                  <>
                    <Circle className="w-2 h-2 fill-muted-foreground text-muted-foreground" />
                    Desconectado
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="container mx-auto max-w-2xl space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">Sin mensajes</h3>
              <p className="text-muted-foreground">
                Envía el primer mensaje para iniciar la conversación
              </p>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full">
                    {formatDate(group.date)}
                  </span>
                </div>

                {/* Messages for this date */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {group.messages.map((message, index) => {
                      const isFromMe = message.senderId === user?.id;
                      const showAvatar = !isFromMe && (
                        index === 0 || 
                        group.messages[index - 1]?.senderId !== message.senderId
                      );

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex items-end gap-2 ${isFromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isFromMe && (
                            <div className="w-8">
                              {showAvatar && (
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={oderUser?.avatar || undefined} />
                                  <AvatarFallback className="bg-gradient-trail text-primary-foreground text-xs">
                                    {oderUser?.name ? getInitials(oderUser.name) : '??'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          )}
                          
                          <div
                            className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                              isFromMe
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted text-foreground rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <div className={`flex items-center gap-1 mt-1 ${isFromMe ? 'justify-end' : ''}`}>
                              <span className={`text-[10px] ${isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatTime(message.sentAt)}
                              </span>
                              {isFromMe && (
                                message.readAt ? (
                                  <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                                ) : (
                                  <Check className="w-3 h-3 text-primary-foreground/70" />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isOderTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={oderUser?.avatar || undefined} />
                <AvatarFallback className="bg-gradient-trail text-primary-foreground text-xs">
                  {oderUser?.name ? getInitials(oderUser.name) : '??'}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <Input
              ref={inputRef}
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isSending}
            />
            <Button
              variant="hero"
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
