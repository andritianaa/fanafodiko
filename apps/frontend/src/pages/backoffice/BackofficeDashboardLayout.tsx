import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  ShieldIcon,
  HospitalIcon,
  TrayIcon,
  UsersIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { usePharmacyRequests } from '@/features/pharmacyRequest/api/hooks';
import { useBackofficePharmacies } from '@/features/pharmacy/api/hooks';
import { useBackofficeUsers } from '@/features/backoffice/api/hooks';
import { useBugReports } from '@/features/bugReport/api/hooks';

export default function BackofficeDashboardLayout() {
  const location = useLocation();
  const { data: requestsData } = usePharmacyRequests();
  const { data: pharmaciesData } = useBackofficePharmacies();
  const { data: usersData } = useBackofficeUsers();
  const { data: bugReportsData } = useBugReports('open');

  const pendingCount = requestsData?.requests.filter((r) => r.status === 'pending').length ?? 0;
  const pharmacyCount = pharmaciesData?.total ?? 0;
  const userCount = usersData?.total ?? 0;
  const openBugCount = bugReportsData?.total ?? 0;

  const isActive = (segment: string) =>
    location.pathname.startsWith(`/backoffice/${segment}`);

  const navItems = [
    {
      segment: 'pharmacies',
      label: 'Pharmacies',
      icon: HospitalIcon,
      badge: pharmacyCount > 0 ? String(pharmacyCount) : undefined,
      badgeVariant: 'secondary' as const,
    },
    {
      segment: 'requests',
      label: 'Demandes',
      icon: TrayIcon,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
      badgeVariant: 'destructive' as const,
    },
    {
      segment: 'users',
      label: 'Utilisateurs',
      icon: UsersIcon,
      badge: userCount > 0 ? String(userCount) : undefined,
      badgeVariant: 'secondary' as const,
    },
    {
      segment: 'bug-reports',
      label: 'Signalements',
      icon: WarningCircleIcon,
      badge: openBugCount > 0 ? String(openBugCount) : undefined,
      badgeVariant: 'destructive' as const,
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="p-3 gap-2">
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 shrink-0">
              <ShieldIcon size={16} weight="fill" className="text-orange-600" />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-sm">Backoffice</span>
              <span className="truncate text-xs text-muted-foreground">Administration</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map(({ segment, label, icon: Icon, badge, badgeVariant }) => (
                <SidebarMenuItem key={segment}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(segment)}
                    tooltip={label}
                  >
                    <NavLink to={`/backoffice/${segment}`} className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2">
                        <Icon size={16} />
                        <span>{label}</span>
                      </span>
                      {badge && (
                        <Badge variant={badgeVariant} className="ml-auto text-[10px] px-1.5 py-0 h-4">
                          {badge}
                        </Badge>
                      )}
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
          <div className="flex items-center gap-2">
            <ShieldIcon size={14} weight="fill" className="text-orange-600" />
            <span className="text-sm font-medium">Backoffice</span>
          </div>
        </header>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
