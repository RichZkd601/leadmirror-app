import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, FileText, Users, Database, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";

export default function Security() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold">Sécurité & Conformité</h1>
            </div>
            <a href="/" className="text-primary hover:text-primary/80">
              ← Retour au tableau de bord
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Votre sécurité est notre priorité
          </h2>
          <p className="text-muted-foreground">
            LeadMirror respecte les plus hauts standards de sécurité et de protection des données.
          </p>
        </div>

        <div className="space-y-6">
          {/* RGPD Compliance */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Conformité RGPD</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Certifié</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800 dark:text-green-200">Vos droits</h4>
                  <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                    <li>• Droit d'accès à vos données</li>
                    <li>• Droit de rectification</li>
                    <li>• Droit à l'effacement</li>
                    <li>• Droit à la portabilité</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800 dark:text-green-200">Notre engagement</h4>
                  <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                    <li>• Données stockées en Europe</li>
                    <li>• Chiffrement de bout en bout</li>
                    <li>• Anonymisation des analyses</li>
                    <li>• Suppression automatique sur demande</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Protection des données</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <Lock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-1">Chiffrement AES-256</h4>
                  <p className="text-xs text-muted-foreground">Toutes vos données sont chiffrées en transit et au repos</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-1">Serveurs sécurisés</h4>
                  <p className="text-xs text-muted-foreground">Infrastructure certifiée ISO 27001 et SOC 2</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-1">Accès limité</h4>
                  <p className="text-xs text-muted-foreground">Principe du moindre privilège appliqué</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Politique de confidentialité</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h4>Collecte des données</h4>
                <p className="text-muted-foreground">
                  Nous collectons uniquement les données nécessaires au fonctionnement du service :
                  informations de profil, conversations analysées, et métadonnées d'utilisation.
                </p>

                <h4>Utilisation des données</h4>
                <p className="text-muted-foreground">
                  Vos données servent exclusivement à générer vos analyses IA. Elles ne sont jamais 
                  partagées avec des tiers à des fins commerciales.
                </p>

                <h4>Conservation des données</h4>
                <p className="text-muted-foreground">
                  Les données sont conservées tant que votre compte est actif. Suppression automatique 
                  90 jours après fermeture du compte.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Fonctionnalités de sécurité</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Authentification</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Authentification OAuth sécurisée</li>
                    <li>• Sessions chiffrées avec expiration</li>
                    <li>• Protection contre le CSRF</li>
                    <li>• Rate limiting des API</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Monitoring</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Surveillance 24/7 des systèmes</li>
                    <li>• Détection d'intrusion automatique</li>
                    <li>• Logs d'audit complets</li>
                    <li>• Alertes de sécurité temps réel</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-muted">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Questions sur la sécurité ?</h3>
              <p className="text-muted-foreground mb-4">
                Notre équipe sécurité est disponible pour répondre à toutes vos questions
              </p>
              <div className="flex justify-center space-x-4 text-sm">
                <span>📧 security@leadmirror.com</span>
                <span>🔒 Audit RGPD disponible sur demande</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}