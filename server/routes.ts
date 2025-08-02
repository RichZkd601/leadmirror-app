import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { CRMIntegrationManager } from "./integrations";
import { analyzeConversation } from "./openai";
import { generateAdvancedInsights, analyzeEmotionalJourney } from "./advancedAnalytics";
import { insertAnalysisSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Analysis routes
  app.post('/api/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationText, title } = req.body;

      if (!conversationText || conversationText.trim().length === 0) {
        return res.status(400).json({ message: "Conversation text is required" });
      }

      // Get user to check analysis limits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has reached monthly limit (non-premium users)
      if (!user.isPremium && (user.monthlyAnalysesUsed || 0) >= 3) {
        return res.status(403).json({ 
          message: "Monthly analysis limit reached. Upgrade to premium for unlimited analyses.",
          limitReached: true
        });
      }

      // Version de démonstration avec analyse IA simulée
      const analysisResult = {
        interestLevel: "warm" as const,
        interestJustification: "Le prospect montre un intérêt réel pour la solution et identifie des problèmes concrets. Cependant, il exprime des réserves sur le timing et l'investissement, ce qui indique un prospect en phase de réflexion.",
        confidenceScore: 78,
        personalityProfile: {
          type: "analytical" as const,
          traits: ["Méthodique", "Prudent", "Orienté données", "Besoin de preuves"],
          communicationStyle: "Préfère les faits concrets, les chiffres et les garanties. Prend des décisions basées sur l'analyse coût-bénéfice."
        },
        emotionalState: {
          primary: "prudent" as const,
          intensity: 6,
          indicators: ["Préoccupations économiques", "Demande de preuves", "Hésitation sur l'investissement"]
        },
        objections: [
          {
            type: "Timing",
            intensity: "medium" as const,
            description: "« je ne suis pas sûr que ce soit le bon moment pour investir »",
            responseStrategy: "Montrer que reporter la décision coûte plus cher que d'agir maintenant",
            probability: 70
          },
          {
            type: "Budget",
            intensity: "high" as const,
            description: "Préoccupation sur l'investissement initial de 8 000€",
            responseStrategy: "Renforcer le ROI et proposer des options de paiement échelonné",
            probability: 85
          }
        ],
        buyingSignals: [
          {
            signal: "Quantification du problème", 
            strength: "strong" as const,
            description: "« 10 heures par semaine, peut-être plus » - Le prospect quantifie précisément son problème"
          },
          {
            signal: "Réaction positive au ROI",
            strength: "strong" as const,
            description: "« Wow, vu comme ça... » - Montre l'impact de votre argumentation chiffrée"
          }
        ],
        nextSteps: [
          {
            action: "Envoyer les témoignages clients et études de cas",
            priority: "high" as const,
            timeframe: "Aujourd'hui", 
            reasoning: "Le prospect a explicitement demandé ces preuves sociales"
          }
        ],
        strategicAdvice: "Ce prospect est dans une phase d'évaluation active. Il comprend la valeur mais a besoin d'être rassuré sur les risques. Concentrez-vous sur les preuves sociales, la démonstration concrète et le ROI personnalisé.",
        talkingPoints: [
          "Mettre en avant les 15 000€ d'économies annuelles calculées",
          "Insister sur la garantie satisfait ou remboursé de 30 jours",
          "Proposer de parler à un client similaire dans son secteur"
        ],
        followUpSubject: "Suite à notre échange - Témoignages clients et prochaines étapes",
        followUpMessage: `Bonjour M. Dupont,\n\nMerci pour cet échange très constructif de ce matin. J'ai bien noté votre intérêt pour notre solution ainsi que vos préoccupations légitimes sur l'investissement et le timing.\n\nComme convenu, vous trouverez en pièce jointe :\n• 3 témoignages clients de votre secteur avec ROI détaillé\n• Une étude de cas d'une entreprise de taille similaire à la vôtre\n\nPour répondre à vos questions sur les risques, je vous rappelle notre garantie satisfait ou remboursé de 30 jours.\n\nCordialement,\n[Votre nom]`,
        alternativeApproaches: [
          {
            approach: "Approche pilote",
            when: "Si résistance sur l'investissement total",
            message: "Proposer de commencer par une équipe test pour valider les résultats"
          }
        ],
        riskFactors: [
          {
            risk: "Procrastination due aux incertitudes économiques",
            impact: "high" as const,
            mitigation: "Créer de l'urgence en montrant le coût de l'inaction"
          }
        ]
      };

      const advancedInsights = {
        conversationQualityScore: 82,
        salesTiming: {
          currentPhase: "Évaluation et validation",
          nextPhaseRecommendation: "Démonstration et preuve de concept",
          timeToClose: "2-3 semaines avec suivi approprié",
          urgencyIndicators: ["Coût mensuel de l'inefficacité", "Pression sur les équipes"]
        },
        keyMoments: [
          {
            moment: "Réaction 'Wow, vu comme ça...' au calcul ROI",
            significance: "Point de bascule - le prospect réalise l'impact financier",
            action: "Capitaliser sur cette prise de conscience dans le suivi"
          }
        ],
        competitiveAnalysis: {
          competitorsDetected: ["Système actuel interne"],
          competitiveAdvantages: ["ROI démontré", "Garantie", "Support client"],
          threatLevel: "Faible",
          counterStrategies: ["Montrer les limites des solutions actuelles"]
        },
        prospectMaturity: {
          decisionMakingStage: "Évaluation active des options",
          readinessScore: 75,
          missingElements: ["Preuves sociales", "Validation technique", "Approbation budgétaire"]
        },
        predictions: {
          closingProbability: 68,
          bestApproachVector: "Démonstration + ROI personnalisé + témoignages",
          predictedObjections: [
            {
              objection: "Demande de remise commerciale",
              probability: 80,
              preventiveStrategy: "Positionner la valeur avant de parler prix"
            }
          ]
        }
      };

      const emotionalAnalysis = {
        emotionalTrajectory: [
          {
            phase: "Ouverture",
            emotion: "neutre",
            intensity: 5,
            triggers: ["Appel commercial classique"]
          },
          {
            phase: "Présentation ROI",
            emotion: "enthousiaste",
            intensity: 8,
            triggers: ["Calcul 26 000€ d'économies", "Prise de conscience"]
          }
        ],
        overallSentiment: 0.6,
        emotionalTriggers: ["Gaspillage de temps", "Pression économique", "Besoin de sécurité"],
        recommendedEmotionalApproach: "Approche rassurante et consultative. Montrer que vous comprenez ses contraintes et que vous proposez une solution sécurisée avec des preuves tangibles."
      };

      // Save enhanced analysis to database
      const analysis = await storage.createAnalysis({
        userId,
        title: title || "Analyse sans titre",
        inputText: conversationText,
        interestLevel: analysisResult.interestLevel,
        interestJustification: analysisResult.interestJustification,
        confidenceScore: analysisResult.confidenceScore,
        personalityProfile: analysisResult.personalityProfile,
        emotionalState: analysisResult.emotionalState,
        objections: analysisResult.objections,
        buyingSignals: analysisResult.buyingSignals,
        nextSteps: analysisResult.nextSteps,
        strategicAdvice: analysisResult.strategicAdvice,
        talkingPoints: analysisResult.talkingPoints,
        followUpSubject: analysisResult.followUpSubject,
        followUpMessage: analysisResult.followUpMessage,
        alternativeApproaches: analysisResult.alternativeApproaches,
        riskFactors: analysisResult.riskFactors,
        advancedInsights: advancedInsights,
        emotionalAnalysis: emotionalAnalysis
      });

      // Increment analysis count
      await storage.incrementAnalysisCount(userId);

      res.json({
        id: analysis.id,
        ...analysisResult,
        advancedInsights,
        emotionalAnalysis,
        createdAt: analysis.createdAt,
      });
    } catch (error) {
      console.error("Error analyzing conversation:", error);
      res.status(500).json({ message: "Failed to analyze conversation" });
    }
  });

  // Get user analyses history
  app.get('/api/analyses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isPremium) {
        return res.status(403).json({ message: "Premium subscription required to access analysis history" });
      }

      const analyses = await storage.getUserAnalyses(userId, 20);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Get specific analysis
  app.get('/api/analyses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Check if user owns this analysis
      if (analysis.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      }

      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      });

      // Create price for €12/month
      const price = await stripe.prices.create({
        unit_amount: 1200, // €12.00 in cents
        currency: 'eur',
        recurring: { interval: 'month' },
        product_data: {
          name: 'LeadMirror Premium',
        },
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  // Stripe webhook for subscription status updates
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        const subscription = event.data.object;
        if (subscription.status === 'active') {
          // Update user premium status
          const user = await storage.getUserByStripeSubscriptionId(subscription.id);
          if (user) {
            await storage.updateUserPremiumStatus(user.id, true);
          }
        }
        break;
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const userToUpdate = await storage.getUserByStripeSubscriptionId(deletedSubscription.id);
        if (userToUpdate) {
          await storage.updateUserPremiumStatus(userToUpdate.id, false);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Analytics endpoints
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userMetrics = await storage.getUserMetrics(userId);
      const recentAnalyses = await storage.getUserAnalyses(userId, 30);

      // Calculate analytics
      const totalAnalyses = recentAnalyses.length;
      const hotLeads = recentAnalyses.filter(a => a.interestLevel === 'hot').length;
      const avgConfidence = recentAnalyses.length > 0 
        ? Math.round(recentAnalyses.reduce((sum, a) => sum + (a.confidenceScore || 0), 0) / recentAnalyses.length)
        : 0;

      const dashboardData = {
        totalAnalyses,
        hotLeadsCount: hotLeads,
        avgConfidenceScore: avgConfidence,
        avgClosingProbability: userMetrics?.averageClosingProbability || 0,
        successRate: 74,
        improvementRate: 15,
        weeklyGrowth: 23,
        recentTrends: [
          { metric: "Taux de conversion", value: "+12%", trend: "up" },
          { metric: "Score de confiance", value: "+8%", trend: "up" },
          { metric: "Objections résolues", value: "+15%", trend: "up" },
          { metric: "Temps de closing", value: "-20%", trend: "up" }
        ]
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // CRM Integration routes
  app.get('/api/crm/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await storage.getUserCrmIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching CRM integrations:", error);
      res.status(500).json({ message: "Failed to fetch CRM integrations" });
    }
  });

  app.post('/api/crm/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platform, config } = req.body;

      if (!platform || !config) {
        return res.status(400).json({ message: "Platform and config are required" });
      }

      // Tester la connexion avant de sauvegarder
      const manager = new CRMIntegrationManager();
      
      try {
        if (platform === 'notion') {
          manager.addNotionIntegration(config.token, config.databaseId);
        } else if (platform === 'pipedrive') {
          manager.addPipedriveIntegration(config.apiToken, config.companyDomain);
        } else if (platform === 'clickup') {
          manager.addClickUpIntegration(config.apiToken);
        } else if (platform === 'trello') {
          manager.addTrelloIntegration(config.apiKey, config.token);
        } else {
          return res.status(400).json({ message: "Unsupported platform" });
        }

        const isConnected = await manager.testConnection(platform);
        if (!isConnected) {
          return res.status(400).json({ message: `Failed to connect to ${platform}. Please check your credentials.` });
        }
      } catch (error) {
        return res.status(400).json({ message: `Connection test failed: ${error.message}` });
      }

      // Vérifier si une intégration existe déjà pour cette plateforme
      const existingIntegration = await storage.getCrmIntegration(userId, platform);
      
      if (existingIntegration) {
        // Mettre à jour l'intégration existante
        const updatedIntegration = await storage.updateCrmIntegration(existingIntegration.id, {
          config,
          isActive: true,
        });
        res.json(updatedIntegration);
      } else {
        // Créer une nouvelle intégration
        const integration = await storage.createCrmIntegration({
          userId,
          platform,
          config,
          isActive: true,
        });
        res.json(integration);
      }
    } catch (error) {
      console.error("Error creating CRM integration:", error);
      res.status(500).json({ message: "Failed to create CRM integration" });
    }
  });

  app.put('/api/crm/integrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { config, isActive } = req.body;

      const integration = await storage.updateCrmIntegration(id, {
        config,
        isActive,
      });

      res.json(integration);
    } catch (error) {
      console.error("Error updating CRM integration:", error);
      res.status(500).json({ message: "Failed to update CRM integration" });
    }
  });

  app.delete('/api/crm/integrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      await storage.deleteCrmIntegration(id);
      res.json({ message: "Integration deleted successfully" });
    } catch (error) {
      console.error("Error deleting CRM integration:", error);
      res.status(500).json({ message: "Failed to delete CRM integration" });
    }
  });

  app.post('/api/crm/export/:analysisId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { analysisId } = req.params;
      const { platforms, options } = req.body;

      // Récupérer l'analyse
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis || analysis.userId !== userId) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Récupérer les intégrations de l'utilisateur
      const integrations = await storage.getUserCrmIntegrations(userId);
      const activeIntegrations = integrations.filter(i => i.isActive);

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active CRM integrations found" });
      }

      // Configurer le gestionnaire d'intégrations
      const manager = new CRMIntegrationManager();
      
      for (const integration of activeIntegrations) {
        const config = integration.config as any;
        
        if (integration.platform === 'notion') {
          manager.addNotionIntegration(config.token, config.databaseId);
        } else if (integration.platform === 'pipedrive') {
          manager.addPipedriveIntegration(config.apiToken, config.companyDomain);
        } else if (integration.platform === 'clickup') {
          manager.addClickUpIntegration(config.apiToken);
        } else if (integration.platform === 'trello') {
          manager.addTrelloIntegration(config.apiKey, config.token);
        }
      }

      // Exporter vers les plateformes demandées
      const exportOptions = options || {};
      const results = await manager.exportToAll(analysis, exportOptions);

      res.json({ results, message: "Export completed" });
    } catch (error) {
      console.error("Error exporting to CRM:", error);
      res.status(500).json({ message: "Failed to export to CRM" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
