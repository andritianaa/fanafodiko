import { Link, Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout } from "@/features/auth/api/fetchers"
import { useMe } from "@/features/auth/api/hooks"
import { useHouseholdMembers } from "@/features/household/api/hooks"
import { useMyPharmacies } from "@/features/myPharmacy/api/hooks"
import { NotificationBell } from "@/features/notification/components/NotificationBell"
import { PharmacySearchNotifications } from "@/features/medSearch/components/PharmacySearchNotifications"
import { PharmacySearchAlert } from "@/features/medSearch/components/PharmacySearchAlert"
import { CheckFatIcon, HospitalIcon, LayoutIcon, MapPinIcon, MagnifyingGlassIcon, PillIcon, ShieldIcon, UsersIcon } from "@phosphor-icons/react"
import { useFontSize } from "@/contexts/FontSizeContext"

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = localStorage.getItem("auth")
  const { data: user } = useMe()
  const { data: members } = useHouseholdMembers()
  const { data: myPharmacies } = useMyPharmacies()
  const { iconSize } = useFontSize()
  const managesPharmacy = (myPharmacies?.length ?? 0) > 0

  const activeProfileId = members?.[0]?.id || ""

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/50 text-foreground">
      <header className="border-b bg-white fixed w-full z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold">
              Fanafodiko
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link to="/dashboard" className="transition-colors hover:text-primary">
                Tableau de bord
              </Link>
              <Link to="/schedule" className="transition-colors hover:text-primary">
                Planning
              </Link>
              <Link to="/medications" className="transition-colors hover:text-primary">
                Médicaments
              </Link>
              <Link to="/household" className="transition-colors hover:text-primary">
                Foyer
              </Link>
              <Link to="/map" className="transition-colors hover:text-primary">
                Carte
              </Link>
              <Link to="/med-search" className="transition-colors hover:text-primary">
                Recherche médicament
              </Link>
              {managesPharmacy && (
                <Link to="/my-pharmacy" className="transition-colors hover:text-primary">
                  Ma pharmacie
                </Link>
              )}
              {(user?.role === "admin" || user?.role === "support") && (
                <Link
                  to="/backoffice"
                  className="flex items-center gap-1 transition-colors hover:text-primary text-orange-600"
                >
                  <ShieldIcon size={14} weight="fill" />
                  Backoffice
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {auth && activeProfileId && (
              <NotificationBell profileId={activeProfileId} />
            )}
            {auth && managesPharmacy && myPharmacies?.[0]?.id && (
              <PharmacySearchNotifications pharmacyId={myPharmacies![0].id} />
            )}
            {auth ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt="User" />
                      <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    Paramètres
                  </DropdownMenuItem>
                  {managesPharmacy && (
                    <DropdownMenuItem onClick={() => navigate("/my-pharmacy")}>
                      Ma pharmacie
                    </DropdownMenuItem>
                  )}
                  {(user?.role === "admin" || user?.role === "support") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/backoffice")}
                        className="text-orange-600 focus:text-orange-700"
                      >
                        Backoffice
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700">
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Inscription</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className={
        // Routes plein-écran : pas de container ni de padding horizontal/bas
        // La carte et autres pages full-viewport gèrent elles-mêmes leur layout
        ['/map'].some(r => location.pathname.startsWith(r))
          ? 'flex-1 flex flex-col pt-16 overflow-hidden'
          : 'flex-1 container mx-auto p-4 pt-16 pb-32'
      }>
        <Outlet />
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <nav className="bg-white border-t border-gray-200 shadow-lg px-2 py-1 flex items-center justify-around">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname === '/dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <LayoutIcon size={iconSize} weight={location.pathname === '/dashboard' ? "fill" : "regular"} />
            </Link>

            <Link
              to="/schedule"
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname === '/schedule'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <CheckFatIcon size={iconSize} weight={location.pathname === '/schedule' ? "fill" : "regular"} />
            </Link>

            <Link
              to="/medications"
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname === '/medications'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <PillIcon size={iconSize} weight={location.pathname === '/medications' ? "fill" : "regular"} />
            </Link>

            <Link
              to="/household"
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname === '/household'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <UsersIcon size={iconSize} weight={location.pathname === '/household' ? "fill" : "regular"} />
            </Link>

            <Link
              to="/map"
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname === '/map'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <MapPinIcon size={iconSize} weight={location.pathname === '/map' ? "fill" : "regular"} />
            </Link>

            <Link
              to="/med-search"
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname.startsWith('/med-search')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <MagnifyingGlassIcon size={iconSize} weight={location.pathname.startsWith('/med-search') ? "fill" : "regular"} />
            </Link>

            {/* Accès rapide "Ma pharmacie" pour les membres,mobile */}
            {managesPharmacy && (
              <Link
                to="/my-pharmacy"
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname.startsWith('/my-pharmacy')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-slate-100'
                }`}
              >
                <HospitalIcon size={iconSize} weight={location.pathname.startsWith('/my-pharmacy') ? "fill" : "regular"} />
              </Link>
            )}
        </nav>
      </div>

      {/* Alerte plein-écran pour les membres de pharmacie */}
      {auth && managesPharmacy && myPharmacies?.[0]?.id && (
        <PharmacySearchAlert pharmacyId={myPharmacies![0].id} />
      )}
    </div>
  )
}
