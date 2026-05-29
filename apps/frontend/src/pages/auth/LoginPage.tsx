import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { LoginForm } from "@/features/auth/components"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <img src="/logo.png" alt="Fanafodiko" className="w-16 h-16 rounded-2xl mb-2 shadow-md" />
          <CardTitle>Bon retour</CardTitle>
          <CardDescription>Entrez votre email pour vous connecter à votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            <Link to="/forgot-password" title="Mot de passe oublié ?" className="hover:underline">Mot de passe oublié ?</Link>
          </div>
          <div className="text-sm text-center text-gray-500">
            Pas encore de compte ? <Link to="/register" className="underline">S'inscrire</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
