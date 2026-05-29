import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { RegisterForm } from "@/features/auth/components"

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center justify-center">
          <CardTitle>Créer un compte sur Fanafodiko</CardTitle>
          <CardDescription>Entrez vos informations pour créer un compte</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            Vous avez déjà un compte ? <Link to="/login" className="underline">Se connecter</Link>
          </div>
          <div className="text-xs text-center text-gray-400 pt-1">
            <Link to="/cgu" className="hover:underline">Conditions Générales d'Utilisation</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
