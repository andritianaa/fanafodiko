import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { ForgotPasswordForm } from "@/features/auth/components"

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-none bg-background/60 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Mot de passe oublié</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un code de réinitialisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Se souvenir de son mot de passe ? <Link to="/login" className="text-primary hover:underline font-medium">Se connecter</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
