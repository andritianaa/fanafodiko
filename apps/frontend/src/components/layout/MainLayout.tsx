import { Link, Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout } from "@/features/auth/api/fetchers"
import { useMe } from "@/features/auth/api/hooks"
import { useHouseholdMembers } from "@/features/household/api/hooks"
import { NotificationBell } from "@/features/notification/components/NotificationBell"
import { CheckFatIcon, LayoutIcon, PillIcon, UsersIcon } from "@phosphor-icons/react"

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem("token")
  const { data: user } = useMe()
  const { data: members } = useHouseholdMembers()

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
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Utilisateur</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || "Chargement..."}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
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
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <nav className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl shadow-slate-200/50 px-2 py-2 flex items-center justify-between">
            <Link 
              to="/dashboard" 
              className={`flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${
                  location.pathname === '/dashboard' 
                  ? 'bg-primary text-primary-foreground shadow-md transform' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <LayoutIcon size={24} weight={location.pathname === '/dashboard' ? "fill" : "regular"} />
            </Link>
            
            <Link 
              to="/schedule" 
              className={`flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${
                  location.pathname === '/schedule' 
                  ? 'bg-primary text-primary-foreground shadow-md transform' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <CheckFatIcon size={24} weight={location.pathname === '/schedule' ? "fill" : "regular"} />
            </Link>

            <Link 
              to="/medications" 
              className={`flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${
                  location.pathname === '/medications' 
                  ? 'bg-primary text-primary-foreground shadow-md transform' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <PillIcon size={24} weight={location.pathname === '/medications' ? "fill" : "regular"} />
            </Link>

            <Link 
              to="/household" 
              className={`flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${
                  location.pathname === '/household' 
                  ? 'bg-primary text-primary-foreground shadow-md transform' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              <UsersIcon size={24} weight={location.pathname === '/household' ? "fill" : "regular"} />
            </Link>
        </nav>
      </div>
    </div>
  )
}
