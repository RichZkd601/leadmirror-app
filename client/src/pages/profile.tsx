import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  Crown, 
  CreditCard, 
  Settings, 
  Shield, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Mail,
  Edit3
} from "lucide-react";
import { Link } from "wouter";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isPremium: boolean;
  monthlyAnalysesUsed: number;
  subscriptionStatus: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
}

export default function Profile() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
  });

  // Fetch user profile data
  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string }) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/subscription/cancel");
    },
    onSuccess: () => {
      toast({
        title: "Abonnement annulé",
        description: "Votre abonnement sera annulé à la fin de la période de facturation.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible d'annuler l'abonnement.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
              <p className="text-muted-foreground mb-4">
                Vous devez être connecté pour accéder à votre profil.
              </p>
              <Button onClick={() => window.location.href = "/api/login"}>
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEditProfile = () => {
    setEditData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editData);
  };

  const handleSubscribe = () => {
    window.location.href = "/subscribe";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold">Mon profil</h1>
            </div>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = "/api/logout"}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-2xl">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.email
                    }
                  </CardTitle>
                  {user.isPremium && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      <Crown className="w-4 h-4 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProfile}
                disabled={updateProfileMutation.isPending}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Abonnement et facturation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Statut de l'abonnement
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {user.isPremium ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-700">Premium actif</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-orange-700">Plan gratuit</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Analyses utilisées ce mois
                  </Label>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">
                      {user.monthlyAnalysesUsed || 0}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {user.isPremium ? "/ illimité" : "/ 3"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {user.isPremium ? (
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      Plan Premium
                    </h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• Analyses illimitées</li>
                      <li>• IA avancée avec insights profonds</li>
                      <li>• Intégrations CRM</li>
                      <li>• Analytics détaillées</li>
                      <li>• Support prioritaire</li>
                    </ul>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Passer au Premium</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Débloquez toutes les fonctionnalités avancées pour seulement 12€/mois.
                    </p>
                    <Button onClick={handleSubscribe} className="w-full">
                      <Crown className="w-4 h-4 mr-2" />
                      Passer au Premium
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {user.isPremium && (
              <Separator />
            )}

            {user.isPremium && (
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Gérer l'abonnement</h4>
                  <p className="text-sm text-muted-foreground">
                    Annuler ou modifier votre abonnement
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Annuler l'abonnement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Annuler l'abonnement Premium</DialogTitle>
                      <DialogDescription>
                        Êtes-vous sûr de vouloir annuler votre abonnement Premium ? 
                        Vous continuerez d'avoir accès aux fonctionnalités jusqu'à la fin 
                        de votre période de facturation actuelle.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2 mt-4">
                      <DialogTrigger asChild>
                        <Button variant="outline">Annuler</Button>
                      </DialogTrigger>
                      <Button
                        variant="destructive"
                        onClick={() => cancelSubscriptionMutation.mutate()}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        Confirmer l'annulation
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Paramètres du compte</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Compte créé</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Sécurité et confidentialité</h4>
                <p className="text-sm text-muted-foreground">
                  Voir nos politiques de sécurité et confidentialité
                </p>
              </div>
              <Link href="/security">
                <Button variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Voir les détails
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>
              Mettez à jour vos informations personnelles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={editData.firstName}
                onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                placeholder="Votre prénom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={editData.lastName}
                onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                placeholder="Votre nom"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={updateProfileMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}