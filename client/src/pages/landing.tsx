import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlipHorizontal2, Brain, MessageSquare, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FlipHorizontal2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">LeadMirror</h1>
            </div>
            
            <nav className="flex items-center space-x-4" role="navigation" aria-label="Navigation principale">
              <a href="/security" className="text-sm font-medium hover:underline underline-offset-4" aria-label="Sécurité et conformité RGPD">
                Sécurité RGPD
              </a>
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/api/login'}
                aria-label="Se connecter à LeadMirror"
              >
                Se connecter
              </Button>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                aria-label="Commencer votre essai gratuit"
              >
                Commencer
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" role="main">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Transformez vos conversations
            <span className="text-primary block">commerciales avec l'IA</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            <strong>LeadMirror</strong> analyse instantanément vos conversations commerciales avec une IA révolutionnaire. 
            Profiling psychologique DISC, prédictions d'objections, messages de relance parfaits. 
            Ne perdez plus jamais une vente à cause d'un mauvais suivi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="text-lg px-8 py-3"
            >
              Essai gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3"
              onClick={() => {
                // Scroll to features section
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Alimenté par une analyse IA avancée
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Obtenez des insights profonds sur l'état d'esprit de vos prospects et recevez des conseils stratégiques pour chaque situation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Brain className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Analyse du niveau d'intérêt</CardTitle>
                <CardDescription>
                  Comprenez instantanément si votre prospect est chaud, tiède ou froid avec une justification détaillée.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Détection des objections</CardTitle>
                <CardDescription>
                  Identifiez les objections cachées et les préoccupations avant qu'elles ne deviennent des obstacles.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Suivi stratégique</CardTitle>
                <CardDescription>
                  Obtenez des messages de relance parfaitement adaptés qui répondent aux préoccupations et objections spécifiques.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Tarification simple et transparente
            </h3>
            <p className="text-lg text-muted-foreground">
              Commencez gratuitement, passez au premium quand vous avez besoin de plus de puissance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Gratuit</CardTitle>
                <div className="text-3xl font-bold">€0</div>
                <CardDescription>par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>3 analyses par mois</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Insights IA basiques</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Génération de messages de relance</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Commencer gratuitement
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-primary">
              <CardHeader className="text-center">
                <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium mb-2">
                  Plus populaire
                </div>
                <CardTitle className="text-xl">Premium</CardTitle>
                <div className="text-3xl font-bold text-primary">€12</div>
                <CardDescription>par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Analyses illimitées</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Insights IA avancés</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Historique complet des analyses</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Suivi des performances</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Support prioritaire</span>
                  </li>
                </ul>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Passer au Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Prêt à transformer votre processus de vente ?
          </h3>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Rejoignez des milliers de commerciaux qui concluent déjà plus de ventes avec LeadMirror.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = '/api/login'}
            className="text-lg px-8 py-3"
          >
            Commencez votre essai gratuit dès maintenant
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <FlipHorizontal2 className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">LeadMirror</span>
              </div>
              <p className="text-sm text-muted-foreground">
                L'IA révolutionnaire pour analyser vos conversations commerciales et multiplier vos conversions.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Produit</h4>
              <nav className="space-y-2">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Fonctionnalités
                </a>
                <a href="/analytics" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </a>
                <a href="/integrations" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Intégrations CRM
                </a>
                <a href="/api/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Essai gratuit
                </a>
              </nav>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Entreprise</h4>
              <nav className="space-y-2">
                <a href="/security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sécurité & RGPD
                </a>
                <a href="mailto:contact@leadmirror.com" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
                <a href="mailto:support@leadmirror.com" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </a>
              </nav>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Légal</h4>
              <nav className="space-y-2">
                <a href="/security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Confidentialité
                </a>
                <a href="/security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Conditions d'utilisation
                </a>
                <a href="/security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Mentions légales
                </a>
              </nav>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border pt-8">
            <div className="text-center space-y-3">
              <div className="text-sm font-medium text-foreground">
                LeadMirror © 2025 — Tous droits réservés
              </div>
              <div className="text-sm text-muted-foreground">
                Solution conçue pour les professionnels de la vente | IA de nouvelle génération (GPT-4o + Whisper) | Respect des normes RGPD
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
