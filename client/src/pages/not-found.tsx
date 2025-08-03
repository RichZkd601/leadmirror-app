import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function NotFound() {
  const { isAuthenticated } = useAuth();
  
  const handleGoHome = () => {
    window.location.href = isAuthenticated ? '/dashboard' : '/';
  };
  
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Page introuvable
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleGoHome}
              variant="default"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              {isAuthenticated ? 'Tableau de bord' : 'Accueil'}
            </Button>
            
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
