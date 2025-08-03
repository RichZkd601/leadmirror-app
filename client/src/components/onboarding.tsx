import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Mail, 
  Brain, 
  ArrowRight, 
  CheckCircle,
  Crown,
  Settings,
  Target
} from "lucide-react";

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function Onboarding({ isOpen, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    }
  }, [isOpen]);

  const steps = [
    {
      title: "Bienvenue dans LeadMirror ! 👋",
      subtitle: "L'IA révolutionnaire pour vos conversations commerciales",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Transformez vos emails et appels en insights stratégiques avec notre IA de pointe
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
              <Brain className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xs font-medium">IA Avancée</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
              <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs font-medium">Insights Précis</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
              <Mail className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-xs font-medium">Messages Parfaits</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Comment ça fonctionne ?",
      subtitle: "3 étapes simples pour des résultats exceptionnels",
      content: (
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">1</div>
            <div>
              <h4 className="font-medium mb-1">Collez votre conversation</h4>
              <p className="text-sm text-muted-foreground">Email, notes d'appel, résumé de meeting - tout fonctionne</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">2</div>
            <div>
              <h4 className="font-medium mb-1">IA analyse en profondeur</h4>
              <p className="text-sm text-muted-foreground">Profil psychologique, niveau d'intérêt, objections probables</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">3</div>
            <div>
              <h4 className="font-medium mb-1">Recevez vos insights</h4>
              <p className="text-sm text-muted-foreground">Message de relance optimisé + stratégies personnalisées</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Vos fonctionnalités révolutionnaires",
      subtitle: "L'IA la plus avancée du marché",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded">
              <Brain className="w-5 h-5 text-purple-600 mb-2" />
              <h4 className="font-medium text-sm mb-1">Profiling DISC</h4>
              <p className="text-xs text-muted-foreground">Analyse personnalité prospect</p>
            </div>
            <div className="p-3 border rounded">
              <Target className="w-5 h-5 text-green-600 mb-2" />
              <h4 className="font-medium text-sm mb-1">Prédictions IA</h4>
              <p className="text-xs text-muted-foreground">Objections futures détectées</p>
            </div>
            <div className="p-3 border rounded">
              <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
              <h4 className="font-medium text-sm mb-1">Score Qualité</h4>
              <p className="text-xs text-muted-foreground">Évaluation conversation</p>
            </div>
            <div className="p-3 border rounded">
              <Settings className="w-5 h-5 text-orange-600 mb-2" />
              <h4 className="font-medium text-sm mb-1">Intégrations CRM</h4>
              <p className="text-xs text-muted-foreground">Export automatique</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-sm">Premium : Analyses illimitées</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Débloquez toutes les fonctionnalités IA + historique + CRM pour €15/mois
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Prêt à commencer ! 🚀",
      subtitle: "Votre première analyse vous attend",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <Badge variant="secondary" className="mb-2">3 analyses gratuites</Badge>
            <p className="text-muted-foreground">
              Testez la puissance de LeadMirror avec vos vraies conversations
            </p>
          </div>
          <div className="bg-muted p-4 rounded text-left">
            <p className="text-sm font-medium mb-2">💡 Conseil pro :</p>
            <p className="text-xs text-muted-foreground">
              Commencez avec un email où le prospect a exprimé des objections ou de l'intérêt.
              Les résultats seront encore plus impressionnants !
            </p>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md transition-all duration-500 ${showAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <CardContent className="p-6">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {currentStep + 1}/{steps.length}
            </span>
          </div>

          {/* Step content */}
          <div className="space-y-4 min-h-[300px]">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">{steps[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground">{steps[currentStep].subtitle}</p>
            </div>
            
            <div className="transition-all duration-300">
              {steps[currentStep].content}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Précédent
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                size="sm"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="space-x-1"
              >
                <span>Suivant</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={onComplete}
                className="space-x-1"
              >
                <span>Commencer !</span>
                <Sparkles className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Skip option */}
          <div className="text-center mt-4">
            <button 
              onClick={onComplete}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Passer l'introduction
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}