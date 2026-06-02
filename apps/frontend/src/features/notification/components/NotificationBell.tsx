import { BellIcon, CheckCircleIcon, XCircleIcon, PillIcon } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnreadNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/hooks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatDate } from '@/lib/utils';

interface NotificationBellProps {
  profileId: string;
}

export const NotificationBell = ({ profileId }: NotificationBellProps) => {
  const { data: countData } = useUnreadNotificationCount(profileId);
  const { data: notifications } = useUnreadNotifications(profileId);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const unreadCount = countData?.unreadCount || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="size-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-1 bg-red-500 hover:bg-red-600 border-2 border-background rounded-full "
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] p-0 rounded-2xl overflow-hidden shadow-2xl border-primary/5">
        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent"
              onClick={() => markAllRead(profileId)}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                <BellIcon className="size-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Aucune nouvelle notification</p>
            </div>
          ) : (
            <div className="grid gap-1 p-1">
              {notifications?.map((notification) => {
                const isSearchResponse = notification.type === 'search_response';
                return (
                  <button
                    type="button"
                    key={notification.id}
                    className={cn(
                      "group flex flex-col gap-1 p-4 rounded-xl transition-all cursor-pointer text-left",
                      notification.read ? "bg-background" : "bg-primary/5 hover:bg-primary/10"
                    )}
                    onClick={() => !notification.read && markRead(notification.id)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isSearchResponse ? (
                          notification.hasStock
                            ? <CheckCircleIcon size={14} weight="fill" className="text-green-600 shrink-0" />
                            : <XCircleIcon size={14} weight="fill" className="text-red-500 shrink-0" />
                        ) : (
                          <PillIcon size={14} weight="duotone" className="text-primary shrink-0" />
                        )}
                        <h4 className="font-bold text-sm leading-tight truncate">
                          {notification.medicationName}
                        </h4>
                      </div>
                      {!notification.read && (
                        <div className="size-2 rounded-full bg-primary mt-1 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-[22px]">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/60 uppercase font-medium mt-1 pl-[22px]">
                      {formatDate(notification.createdAt)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 bg-muted/10 border-t border-border/50">
          <Button variant="ghost" size="sm" className="w-full text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground">
            Voir tout l'historique
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

