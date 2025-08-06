import { FlipHorizontal2, Mail, Shield, HelpCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-background mt-auto">
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
              L'IA révolutionnaire pour analyser vos conversations commerciales et optimiser vos ventes.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Produit</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/audio-analysis" className="hover:text-foreground transition-colors">Analyse audio</a></li>
              <li><a href="/analytics" className="hover:text-foreground transition-colors">Analytics</a></li>
              <li><a href="/integrations" className="hover:text-foreground transition-colors">Intégrations</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/profile" className="hover:text-foreground transition-colors">Mon profil</a></li>
              <li><a href="/security" className="hover:text-foreground transition-colors">Sécurité</a></li>
              <li className="flex items-center space-x-1">
                <HelpCircle className="w-3 h-3" />
                <span>Centre d'aide</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-1">
                <Mail className="w-3 h-3" />
                <span>support@leadmirror.com</span>
              </li>
              <li className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Politique de confidentialité</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2025 LeadMirror. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Conditions d'utilisation</span>
              <span>•</span>
              <span>Mentions légales</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}