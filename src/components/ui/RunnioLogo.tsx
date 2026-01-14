import { cn } from '@/lib/utils';

interface RunnioLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function RunnioLogo({ 
  className, 
  size = 'md', 
  showText = false,
  textClassName 
}: RunnioLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(sizes[size], "flex-shrink-0")}>
        <svg viewBox="0 0 512 512" className="w-full h-full">
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#F7931E', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          
          {/* Fondo redondeado */}
          <rect x="20" y="20" width="472" height="472" rx="100" ry="100" fill="url(#bgGradient)"/>
          
          {/* Figura de corredor estilizada */}
          <g transform="translate(256, 256)">
            {/* Cabeza */}
            <circle cx="30" cy="-95" r="35" fill="white"/>
            
            {/* Cuerpo dinámico */}
            <path d="M 25 -55 Q 0 0 -30 50 L -15 55 Q 10 10 30 -45 Z" fill="white"/>
            
            {/* Brazo trasero */}
            <path d="M 15 -45 Q -40 -20 -70 -60 L -60 -75 Q -30 -40 20 -55 Z" fill="white"/>
            
            {/* Brazo delantero */}
            <path d="M 30 -45 Q 80 -80 95 -50 L 85 -35 Q 70 -55 25 -35 Z" fill="white"/>
            
            {/* Pierna trasera */}
            <path d="M -35 50 Q -90 90 -110 70 L -100 55 Q -75 70 -20 45 Z" fill="white"/>
            
            {/* Pierna delantera */}
            <path d="M -15 55 Q 50 100 90 130 L 100 115 Q 55 85 -5 45 Z" fill="white"/>
          </g>
          
          {/* Líneas de velocidad */}
          <g stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.7">
            <line x1="80" y1="200" x2="140" y2="200"/>
            <line x1="60" y1="240" x2="130" y2="240"/>
            <line x1="80" y1="280" x2="150" y2="280"/>
          </g>
        </svg>
      </div>
      {showText && (
        <div>
          <h1 className={cn("font-display text-2xl leading-none", textClassName)}>
            RUNN<span className="text-primary">.IO</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Running Coach Platform</p>
        </div>
      )}
    </div>
  );
}

export function RunnioLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("w-full h-full", className)}>
      <defs>
        <linearGradient id="bgGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F7931E', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      <rect x="20" y="20" width="472" height="472" rx="100" ry="100" fill="url(#bgGradientIcon)"/>
      
      <g transform="translate(256, 256)">
        <circle cx="30" cy="-95" r="35" fill="white"/>
        <path d="M 25 -55 Q 0 0 -30 50 L -15 55 Q 10 10 30 -45 Z" fill="white"/>
        <path d="M 15 -45 Q -40 -20 -70 -60 L -60 -75 Q -30 -40 20 -55 Z" fill="white"/>
        <path d="M 30 -45 Q 80 -80 95 -50 L 85 -35 Q 70 -55 25 -35 Z" fill="white"/>
        <path d="M -35 50 Q -90 90 -110 70 L -100 55 Q -75 70 -20 45 Z" fill="white"/>
        <path d="M -15 55 Q 50 100 90 130 L 100 115 Q 55 85 -5 45 Z" fill="white"/>
      </g>
      
      <g stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.7">
        <line x1="80" y1="200" x2="140" y2="200"/>
        <line x1="60" y1="240" x2="130" y2="240"/>
        <line x1="80" y1="280" x2="150" y2="280"/>
      </g>
    </svg>
  );
}
