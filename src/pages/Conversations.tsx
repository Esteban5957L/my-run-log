import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MessageSquare, 
  Search,
  Circle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { athleteService } from '@/services/athlete.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Athlete } from '@/types/athlete';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function Conversations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, unreadTotal, isConnected, loadConversations } = useChat();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadConversations();
        
        // Load athletes for coach to show all potential conversations
        if (user?.role === 'COACH') {
          const { athletes: athleteList } = await athleteService.getMyAthletes();
          setAthletes(athleteList);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.role, loadConversations]);

  // Merge athletes with conversations for coach
  const conversationList = user?.role === 'COACH'
    ? athletes.map(athlete => {
        const conv = conversations.find(c => c.oderId === athlete.id);
        return {
          id: athlete.id,
          name: athlete.name,
          avatar: athlete.avatar,
          lastMessage: conv?.lastMessage || null,
          unreadCount: conv?.unreadCount || 0,
        };
      })
    : conversations.map(c => ({
        id: c.oderId,
        name: c.odername,
        avatar: c.oderAvatar,
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCount,
      }));

  // Sort: unread first, then by last message time
  const sortedList = [...conversationList].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime();
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return 0;
  });

  const filteredList = sortedList.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const basePath = user?.role === 'COACH' ? '/coach' : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(basePath || '/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display text-xl">MENSAJES</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isConnected ? (
                  <>
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    Conectado
                  </>
                ) : (
                  <>
                    <Circle className="w-2 h-2 fill-muted-foreground text-muted-foreground" />
                    Desconectado
                  </>
                )}
              </div>
            </div>
            {unreadTotal > 0 && (
              <Badge variant="default" className="bg-primary">
                {unreadTotal} sin leer
              </Badge>
            )}
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Conversations List */}
      <main className="container mx-auto px-4 py-4">
        {filteredList.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-xl text-foreground mb-2">
              {searchQuery ? 'Sin resultados' : 'Sin conversaciones'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'No se encontraron conversaciones con ese nombre'
                : user?.role === 'COACH'
                  ? 'Invita atletas para poder chatear con ellos'
                  : 'Aún no tienes mensajes de tu entrenador'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredList.map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link to={`${basePath}/chat/${conv.id}`}>
                  <div className={`flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-muted/50 ${
                    conv.unreadCount > 0 ? 'bg-primary/5' : ''
                  }`}>
                    <div className="relative">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={conv.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-trail text-primary-foreground">
                          {getInitials(conv.name)}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground font-medium">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-display text-lg truncate ${
                          conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground'
                        }`}>
                          {conv.name}
                        </h3>
                        {conv.lastMessage && (
                          <span className={`text-xs ${
                            conv.unreadCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'
                          }`}>
                            {formatTimeAgo(conv.lastMessage.sentAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage ? (
                        <p className={`text-sm truncate ${
                          conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}>
                          {conv.lastMessage.isFromMe && <span className="text-muted-foreground">Tú: </span>}
                          {conv.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Sin mensajes aún
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
