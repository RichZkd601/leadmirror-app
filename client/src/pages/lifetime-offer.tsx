import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Clock, Users, Zap, Star, TrendingUp } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Link } from "wouter";

export default function LifetimeOffer() {
  const [remainingSpots, setRemainingSpots] = useState(50);
  const [timeLeft, setTimeLeft] = useState({ hours: 47, minutes: 23, seconds: 45 });
  const { toast } = useToast();

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
    }, 30000); // Diminue toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Timer de l'offre
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-lifetime-payment", { amount: 99 });
      return res.json();
    },
    onSuccess: (data) => {
      // Rediriger vers Stripe Checkout
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

  const handlePurchase = () => {
    purchaseMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Navigation */}
      <nav className="absolute top-4 left-4 z-50">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">L</span>
          </div>
          <span className="font-semibold">LeadMirror</span>
        </Link>
      </nav>

      {/* En-tête d'urgence */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-center py-3">
        <div className="flex items-center justify-center gap-4 text-sm font-semibold">
          <Clock className="h-4 w-4" />
          <span>Offre limitée :</span>
          <span className="font-mono">
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <Users className="h-4 w-4" />
          <span>Plus que {remainingSpots} places</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Titre principal */}
        <div className="text-center mb-12">
          <Badge className="bg-yellow-500 text-black text-lg px-4 py-2 mb-6">
            🚀 OFFRE DE LANCEMENT EXCLUSIVE
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Accès à Vie à <span className="text-yellow-400">LeadMirror</span>
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Rejoignez les 50 premiers utilisateurs et bénéficiez d'un accès illimité à la plateforme 
            d'analyse de conversations commerciales la plus avancée au monde.
          </p>
        </div>

        {/* Bannière exclusive - 50 places seulement */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-2xl p-8 text-center mb-8 shadow-2xl">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="bg-white/20 rounded-full px-4 py-2">
                <span className="text-white font-bold text-lg">🔥 PLACES LIMITÉES</span>
              </div>
              <div className="bg-white/20 rounded-full px-4 py-2">
                <span className="text-white font-bold text-lg">Plus que {remainingSpots}/50</span>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">OFFRE DE LANCEMENT EXCLUSIVE</h2>
            <p className="text-xl text-white/90">Seulement 50 personnes obtiendront l'accès à vie pour 99€</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Prix normal */}
            <Card className="bg-white/5 border-white/20 relative">
              <CardHeader>
                <CardTitle className="text-center text-white">Abonnement Mensuel</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-400 line-through">€15/mois</span>
                  <p className="text-sm text-gray-400 mt-2">€180 sur 1 an</p>
                </div>
              </CardHeader>
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="text-gray-400">Après l'offre</Badge>
              </div>
            </Card>

            {/* Offre à vie */}
            <Card className="bg-gradient-to-b from-green-600 to-green-700 border-green-400 relative scale-105 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-center text-white">Accès à Vie - 50 Places</CardTitle>
                <div className="text-center">
                  <span className="text-5xl font-bold text-white">99€</span>
                  <p className="text-sm text-green-100 mt-2">Paiement unique • Économisez €81 dès la 1ère année</p>
                </div>
              </CardHeader>
              <div className="absolute top-4 right-4">
                <Badge className="bg-yellow-500 text-black animate-pulse">PLACES LIMITÉES</Badge>
              </div>
            </Card>
          </div>
        </div>

        {/* Fonctionnalités incluses */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Tout ce que vous obtenez à vie</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="h-8 w-8 text-yellow-400" />,
                title: "Analyses IA Illimitées",
                description: "Analysez autant de conversations que vous voulez avec notre IA révolutionnaire"
              },
              {
                icon: <TrendingUp className="h-8 w-8 text-green-400" />,
                title: "Analytics Avancés",
                description: "Tableaux de bord complets, métriques de performance et insights prédictifs"
              },
              {
                icon: <Star className="h-8 w-8 text-blue-400" />,
                title: "Toutes les Fonctionnalités Premium",
                description: "Intégrations CRM, export PDF, analyses psychologiques avancées"
              },
              {
                icon: <CheckCircle className="h-8 w-8 text-purple-400" />,
                title: "Mises à Jour Gratuites",
                description: "Toutes les nouvelles fonctionnalités ajoutées automatiquement"
              },
              {
                icon: <Users className="h-8 w-8 text-orange-400" />,
                title: "Support Prioritaire",
                description: "Assistance dédiée et accès prioritaire au support technique"
              },
              {
                icon: <Clock className="h-8 w-8 text-red-400" />,
                title: "Aucune Limite de Temps",
                description: "Votre accès ne expire jamais, utilisez LeadMirror aussi longtemps que vous voulez"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-white/5 border-white/20 text-center p-6">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-blue-200">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Principal */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Réservez votre place maintenant</h3>
            <p className="text-blue-200 mb-6 text-lg">
              Seulement <strong className="text-yellow-400">{remainingSpots} places restantes</strong> sur les 50 disponibles. 
              Après épuisement, retour au prix normal de <strong className="text-red-300">180€/an</strong>.
            </p>
            
            <div className="mb-8">
              <div className="bg-gradient-to-r from-red-500/30 to-orange-500/30 border-2 border-red-500/50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 text-red-200 mb-3">
                  <Users className="h-6 w-6" />
                  <span className="font-bold text-xl">Places limitées : {remainingSpots}/50</span>
                </div>
                <div className="text-white text-lg">
                  <strong>Économisez 81€ dès la première année</strong>
                  <br />
                  <span className="text-red-200">99€ à vie vs 180€/an en abonnement</span>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-16 py-8 text-2xl shadow-2xl w-full md:w-auto transform hover:scale-105 transition-all duration-300"
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>🚀 RÉSERVER MA PLACE À VIE - 99€</>
              )}
            </Button>
            
            <p className="text-sm text-blue-300 mt-6">
              Paiement sécurisé via Stripe • Garantie satisfait ou remboursé 30 jours
              <br />
              <strong className="text-yellow-300">Cette offre ne reviendra jamais une fois les 50 places vendues</strong>
            </p>
          </div>
        </div>

        {/* Témoignages */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Ce que disent nos early adopters</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: "Marie L.",
                role: "Directrice Commerciale",
                text: "LeadMirror a transformé notre approche client. +40% de taux de conversion en 2 mois !"
              },
              {
                name: "Thomas R.", 
                role: "Coach en Vente",
                text: "L'analyse psychologique est bluffante. Mes clients ferment leurs deals 2x plus vite."
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-white/5 border-white/20 p-6">
                <p className="text-blue-100 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-blue-300">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}