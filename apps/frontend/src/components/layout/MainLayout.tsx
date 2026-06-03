import { useState } from "react";
import { BugReportDialog } from "@/features/bugReport/components/BugReportDialog";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { logout } from "@/features/auth/api/fetchers";
import { useMe } from "@/features/auth/api/hooks";
import { useHouseholdMembers } from "@/features/household/api/hooks";
import { useMyPharmacies } from "@/features/myPharmacy/api/hooks";
import { NotificationBell } from "@/features/notification/components/NotificationBell";
import { PharmacySearchAlert } from "@/features/medSearch/components/PharmacySearchAlert";
import {
  CheckFatIcon,
  HospitalIcon,
  LayoutIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PillIcon,
  ShieldIcon,
  UsersIcon,
  GearIcon,
  DotsThreeIcon,
  SignOutIcon,
  WarningCircleIcon,
  UserIcon,
  QuestionIcon,
} from "@phosphor-icons/react";
import { useFontSize } from "@/contexts/FontSizeContext";
import { cn } from "@/lib/utils";

// ── Nav items desktop ─────────────────────────────────────────────────────────

const primaryNav = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/schedule", label: "Planning" },
  { to: "/medications", label: "Médicaments" },
  { to: "/map", label: "Carte" },
  { to: "/med-search", label: "Recherche" },
];

// ── Mobile bottom nav items ───────────────────────────────────────────────────

const mobileNav = [
  { to: "/dashboard", label: "Accueil", Icon: LayoutIcon },
  { to: "/schedule", label: "Planning", Icon: CheckFatIcon },
  { to: "/med-search", label: "Recherche", Icon: MagnifyingGlassIcon },
  { to: "/map", label: "Carte", Icon: MapPinIcon },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = localStorage.getItem("auth");
  const { data: user } = useMe();
  const { data: members } = useHouseholdMembers();
  const { data: myPharmacies } = useMyPharmacies();
  const { iconSize } = useFontSize();

  const [moreOpen, setMoreOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);

  const managesPharmacy = (myPharmacies?.length ?? 0) > 0;
  const managedPharmacies = (myPharmacies ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const activeProfileId = members?.[0]?.id || "";
  const isAdmin = user?.role === "admin" || user?.role === "support";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isFullscreen = ["/map"].some((r) => location.pathname.startsWith(r));

  // Clé d'animation : stable pour les sous-pages d'une même pharmacie (pas de re-animation
  // quand on navigue entre overview / info / hours / …), normale partout ailleurs.
  const myPharmacySubMatch = location.pathname.match(
    /^\/my-pharmacy\/([^/]+)\//,
  );
  const animationKey = myPharmacySubMatch
    ? `my-pharmacy-${myPharmacySubMatch[1]}`
    : location.key;

  return (
    <div className="min-h-screen flex flex-col bg-muted/50 text-foreground">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="border-b bg-background fixed w-full z-50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo + nom */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.png"
              alt="Fanafodiko"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="font-bold text-lg">Fanafodiko</span>
          </Link>

          {/* Nav principale desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryNav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
            {managesPharmacy && (
              <NavLink
                to="/my-pharmacy"
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )
                }
              >
                <HospitalIcon size={14} />
                Ma pharmacie
              </NavLink>
            )}
          </nav>

          {/* Droite : actions */}
          <div className="flex items-center gap-2">
            {/* Cloche notifications */}
            {auth && activeProfileId && (
              <NotificationBell profileId={activeProfileId} />
            )}

            {/* Backoffice badge */}
            {isAdmin && (
              <Link
                to="/backoffice"
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-xs font-semibold"
              >
                <ShieldIcon size={13} weight="fill" />
                Admin
              </Link>
            )}

            {/* Avatar dropdown */}
            {auth ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <UserIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/account")}
                    className="gap-2"
                  >
                    <GearIcon size={14} /> Mon compte
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/household")}
                    className="gap-2"
                  >
                    <UsersIcon size={14} /> Foyer
                  </DropdownMenuItem>
                  {managesPharmacy && (
                    <DropdownMenuItem
                      onClick={() => navigate("/my-pharmacy")}
                      className="gap-2"
                    >
                      <HospitalIcon size={14} /> Ma pharmacie
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/backoffice")}
                        className="gap-2 text-orange-600 focus:text-orange-700 focus:bg-orange-50"
                      >
                        <ShieldIcon size={14} weight="fill" /> Backoffice
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/help")}
                    className="gap-2"
                  >
                    <QuestionIcon size={14} weight="fill" /> Aide & FAQ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setBugReportOpen(true)}
                    className="gap-2 text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                  >
                    <WarningCircleIcon size={14} weight="fill" /> Signaler un
                    problème
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                  >
                    <SignOutIcon size={14} /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Inscription</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Contenu principal ────────────────────────────────────────────────── */}
      <main
        className={
          isFullscreen
            ? "flex-1 flex flex-col pt-16 overflow-hidden"
            : "flex-1 container mx-auto p-4 pt-24 pb-28 md:pb-8"
        }
      >
        <div
          key={animationKey}
          className={
            isFullscreen
              ? "flex-1 flex flex-col overflow-hidden animate-page-enter-fade"
              : "animate-page-enter"
          }
        >
          <Outlet />
        </div>
      </main>

      {/* ── Bottom nav mobile ─────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <nav className="bg-background border-t shadow-lg px-2 py-1 flex items-center justify-around safe-bottom">
          {mobileNav.map(({ to, label, Icon }) => {
            const isActive =
              location.pathname === to ||
              (to !== "/dashboard" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]",
                  to === "/med-search"
                    ? isActive
                      ? "bg-primary text-primary-foreground scale-105"
                      : "bg-primary/10 text-primary"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon size={iconSize} weight={isActive ? "fill" : "regular"} />
                <span className="text-[10px] mt-0.5 font-medium leading-none">
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Bouton "Plus" */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]",
              moreOpen
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <DotsThreeIcon
              size={iconSize}
              weight={moreOpen ? "fill" : "regular"}
            />
            <span className="text-[10px] mt-0.5 font-medium leading-none">
              Plus
            </span>
          </button>
        </nav>
      </div>

      {/* ── Sheet "Plus" mobile ──────────────────────────────────────────────── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-sm text-muted-foreground font-medium">
              Plus de fonctionnalités
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 pb-4">
            {[
              { to: "/medications", label: "Médicaments", Icon: PillIcon },
              { to: "/household", label: "Foyer", Icon: UsersIcon },
              { to: "/account", label: "Mon compte", Icon: GearIcon },
              ...(managesPharmacy
                ? [
                    {
                      to: "/my-pharmacy",
                      label: "Ma pharmacie",
                      Icon: HospitalIcon,
                    },
                  ]
                : []),
              ...(isAdmin
                ? [{ to: "/backoffice", label: "Backoffice", Icon: ShieldIcon }]
                : []),
            ].map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border bg-background hover:bg-muted transition-colors",
                  to === "/backoffice" && "border-orange-200 bg-orange-50",
                  location.pathname.startsWith(to) &&
                    "border-primary/40 bg-primary/5",
                )}
              >
                <Icon
                  size={24}
                  weight="duotone"
                  className={cn(
                    "text-muted-foreground",
                    to === "/backoffice" && "text-orange-600",
                    location.pathname.startsWith(to) && "text-primary",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium text-center leading-tight",
                    to === "/backoffice" && "text-orange-700",
                  )}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>

          {/* Aide & FAQ */}
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              navigate("/help");
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-foreground text-sm font-medium hover:bg-muted transition-colors mt-1"
          >
            <QuestionIcon size={16} weight="fill" />
            Aide & FAQ
          </button>

          {/* Signaler un problème */}
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              setBugReportOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-amber-600 text-sm font-medium hover:bg-amber-50 transition-colors mt-1"
          >
            <WarningCircleIcon size={16} weight="fill" />
            Signaler un problème
          </button>

          {/* Déconnexion */}
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-600 text-sm font-medium hover:bg-red-50 transition-colors mt-1"
          >
            <SignOutIcon size={16} />
            Déconnexion
          </button>
        </SheetContent>
      </Sheet>

      {/* ── Dialog signalement ──────────────────────────────────────────────── */}
      <BugReportDialog open={bugReportOpen} onOpenChange={setBugReportOpen} />

      {/* ── Alerte pharmacie (staff) ─────────────────────────────────────────── */}
      {auth && managesPharmacy && (
        <PharmacySearchAlert pharmacies={managedPharmacies} />
      )}
    </div>
  );
}
