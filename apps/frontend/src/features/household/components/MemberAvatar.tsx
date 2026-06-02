import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MemberAvatarProps {
  fullName: string;
  avatarUrl?: string;
  /** Taille via className Tailwind (ex: "size-8", "size-10", "size-16") */
  className?: string;
}

/**
 * Avatar d'un membre du foyer.
 * Priorité : image uploadée → avatar dicebear généré depuis le nom → initiales.
 */
export function MemberAvatar({ fullName, avatarUrl, className }: MemberAvatarProps) {
  const dicebear = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(fullName)}`;
  const initials = fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={cn('shrink-0', className)}>
      {/* Image uploadée */}
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={fullName}
          onError={(e) => {
            // Si l'image uploadée échoue → afficher dicebear
            (e.currentTarget as HTMLImageElement).src = dicebear;
          }}
        />
      )}
      {/* Dicebear comme fallback visuel quand pas d'image uploadée */}
      {!avatarUrl && <AvatarImage src={dicebear} alt={fullName} />}
      {/* Initiales en dernier recours (si dicebear inaccessible) */}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
