import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Users, TrendingUp, Clock, Star } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import Footer from "@/components/Footer";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to LeadMirror Premium!",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Subscribe to Premium</CardTitle>
        <CardDescription>
          Complete your payment to unlock unlimited analyses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? "Processing..." : "Subscribe for €15/month"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Subscribe() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [remainingSpots, setRemainingSpots] = useState(50);

  // Handle payment cancellation return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'cancelled') {
      toast({
        title: "Paiement annulé",
        description: "Vous pouvez réessayer quand vous le souhaitez.",
        variant: "destructive",
      });
      
      // Clean URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Simuler le décompte des places restantes
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSpots(prev => Math.max(1, prev - Math.floor(Math.random() * 2)));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [user, userLoading, toast]);

  useEffect(() => {
    if (!user) return;

    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/create-subscription")
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Non autorisé",
            description: "Vous êtes déconnecté. Reconnexion en cours...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/auth";
          }, 500);
          return;
        }
        
        toast({
          title: "Erreur",
          description: "Échec de l'initialisation du paiement. Veuillez réessayer.",
          variant: "destructive",
        });
      });
  }, [user, toast]);

  // Lifetime offer purchase mutation
  const lifetimePurchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-lifetime-payment", { amount: 99 });
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLifetimePurchase = () => {
    lifetimePurchaseMutation.mutate();
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen bg-background">
      {/* Header d'urgence avec offre exclusive */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-center py-3">
        <div className="flex items-center justify-center gap-4 text-sm font-semibold">
          <span>🚀 OFFRE EXCLUSIVE DE LANCEMENT</span>
          <span>•</span>
          <span>Plus que {remainingSpots} places disponibles</span>
          <span>•</span>
          <span className="animate-pulse">99€ au lieu de 180€/an</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Mettre à niveau votre compte</h1>
          <p className="text-muted-foreground text-lg">
            Choisissez l'option qui vous convient le mieux
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Offre Exclusive Lifetime - 99€ */}
          <Card className="border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-2 text-sm font-bold">
              🔥 OFFRE LIMITÉE
            </div>
            <CardHeader className="text-center pb-4">
              <div className="mb-4">
                <Badge className="bg-red-600 text-white text-lg px-4 py-2 mb-4">
                  🚀 LANCEMENT EXCLUSIF - {remainingSpots} PLACES SEULEMENT
                </Badge>
              </div>
              <CardTitle className="text-2xl text-orange-800 dark:text-orange-200">Accès à Vie</CardTitle>
              <div className="text-center">
                <span className="text-5xl font-bold text-red-600">99€</span>
                <p className="text-sm text-muted-foreground mt-2">Paiement unique • Plus jamais d'abonnement</p>
                <p className="text-lg font-semibold text-green-600 mt-2">
                  Économisez 81€ dès la 1ère année !
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-red-600 font-bold mb-2">
                  <Users className="w-5 h-5" />
                  <span>Places limitées : {remainingSpots}/50</span>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Cette offre ne reviendra jamais une fois épuisée
                </p>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span><strong>Analyses ILLIMITÉES</strong> à vie</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Toutes les fonctionnalités Premium</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Mises à jour gratuites à vie</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Support prioritaire</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Aucune limite de temps</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                onClick={handleLifetimePurchase}
                disabled={lifetimePurchaseMutation.isPending}
              >
                {lifetimePurchaseMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Préparation...
                  </div>
                ) : (
                  <>🚀 RÉSERVER MA PLACE À VIE - 99€</>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Paiement sécurisé • Garantie 30 jours satisfait ou remboursé
              </p>
            </CardContent>
          </Card>

          {/* Abonnement Mensuel Standard */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Abonnement Mensuel</CardTitle>
              <div className="text-center">
                <span className="text-4xl font-bold">15€</span>
                <p className="text-sm text-muted-foreground mt-2">par mois • 180€ sur 1 an</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Analyses illimitées</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Toutes les fonctionnalités Premium</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Support standard</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Annulation à tout moment</span>
                </li>
              </ul>
              
              <div className="mt-8">
                {!clientSecret ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SubscribeForm />
                  </Elements>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section de comparaison */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-8">
            <CardContent className="p-0">
              <h3 className="text-2xl font-bold mb-6">Pourquoi choisir l'accès à vie ?</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Économies Massives</h4>
                  <p className="text-sm text-muted-foreground">
                    Payez une fois, économisez des centaines d'euros
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Aucune Limite</h4>
                  <p className="text-sm text-muted-foreground">
                    Votre accès ne expire jamais
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Priorité Exclusive</h4>
                  <p className="text-sm text-muted-foreground">
                    Support prioritaire et nouvelles fonctionnalités en avant-première
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
