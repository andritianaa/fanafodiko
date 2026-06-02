import { NavLink, Outlet, useParams, useLocation, Link } from 'react-router-dom';
import { useBackofficePharmacy } from '@/features/pharmacy/api/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  StorefrontIcon,
  PencilSimpleIcon,
  ClockIcon,
  CalendarIcon,
  CameraIcon,
  UsersThreeIcon,
  CaretLeftIcon,
  ShieldIcon,
} from '@phosphor-icons/react';
import type { Pharmacy } from '@ext/schemas';

export type BackofficePharmacyContext = {
  pharmacy: Pharmacy;
};

export default function BackofficePharmacyLayout() {
  const { id = '' } = useParams();
  const { data: pharmacy, isLoading } = useBackofficePharmacy(id);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10 text-muted-foreground">
        Pharmacie introuvable.
      </div>
    );
  }

  const isActive = (segment: string) =>
    location.pathname.endsWith(`/${segment}`);

  const navItems = [
    { segment: 'overview', label: "Vue d'ensemble", icon: StorefrontIcon },
    { segment: 'info', label: 'Infos', icon: PencilSimpleIcon },
    { segment: 'hours', label: 'Horaires', icon: ClockIcon },
    { segment: 'calendar', label: 'Calendrier', icon: CalendarIcon },
    { segment: 'images', label: 'Images', icon: CameraIcon },
    { segment: 'staff', label: 'Staff', icon: UsersThreeIcon },
  ];

  const outletContext: BackofficePharmacyContext = { pharmacy };

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="p-3 gap-2">
          <Link
            to="/backoffice"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CaretLeftIcon size={14} />
            <span className="truncate">Retour</span>
          </Link>
          <div className="px-1">
            <p className="font-semibold text-sm truncate leading-tight">{pharmacy.name}</p>
            <p className="text-xs text-muted-foreground truncate">{pharmacy.city}</p>
            <Badge
              variant="outline"
              className="mt-1 text-xs gap-1 text-orange-600 border-orange-300"
            >
              <ShieldIcon size={10} weight="fill" />
              Admin
            </Badge>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map(({ segment, label, icon: Icon }) => (
                <SidebarMenuItem key={segment}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(segment)}
                    tooltip={label}
                  >
                    <NavLink to={segment}>
                      <Icon size={16} />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ShieldIcon size={14} weight="fill" className="text-orange-600 shrink-0" />
            <p className="text-sm font-medium truncate">{pharmacy.name}</p>
          </div>
        </header>
        <div className="p-4 md:p-6">
          <Outlet context={outletContext} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
