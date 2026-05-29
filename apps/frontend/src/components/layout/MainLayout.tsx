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
import { NotificationBell } from "@/features/notification/components/NotificationBell"
import { CheckFatIcon, LayoutIcon, PillIcon, UsersIcon } from "@phosphor-icons/react"
import { useFontSize } from "@/contexts/FontSizeContext"

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem("token")
  const { data: user } = useMe()
  const { data: members } = useHouseholdMembers()
  const { iconSize } = useFontSize()

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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {token && activeProfileId && (
              <NotificationBell profileId={activeProfileId} />
            )}
            {token ? (
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
                    Mon compte
                  </DropdownMenuItem>
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
      <main className="flex-1 container mx-auto p-4 pt-16 pb-32">
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
        </nav>
      </div>
    </div>
  )
}
