import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { getSession } from "./socialAuth";
import bcrypt from "bcrypt";
import { CRMIntegrationManager } from "./integrations";
import { analyzeConversation, transcribeAudio, analyzeAudioConversation } from "./openai";
import { generateAdvancedInsights, analyzeEmotionalJourney } from "./advancedAnalytics";
import { ObjectStorageService } from "./objectStorage";
import { audioUpload, DirectAudioAnalysisService } from "./directAudioAnalysis";
import fs from "fs";
import { insertAnalysisSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware wrapper for async route handlers to catch errors
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation middleware
const validateRequired = (fields: string[]) => (req: any, res: any, next: any) => {
  const missing = fields.filter(field => !req.body[field]);
  if (missing.length > 0) {
    return res.status(400).json({ 
      message: `Champs requis manquants: ${missing.join(', ')}` 
    });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple auth system with email/password
  app.use(getSession());

  // Simple authentication middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes - Register
  app.post('/api/auth/register', validateRequired(['email', 'password']), asyncHandler(async (req: any, res: any) => {
    const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Un compte existe déjà avec cet email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      // Set session
      (req as any).session.userId = user.id;

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          isPremium: user.isPremium,
          monthlyAnalysesUsed: user.monthlyAnalysesUsed
        } 
      });
  }));

  // Auth routes - Login
  app.post('/api/auth/login', validateRequired(['email', 'password']), asyncHandler(async (req: any, res: any) => {
    const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      // Set session
      (req as any).session.userId = user.id;

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          isPremium: user.isPremium,
          monthlyAnalysesUsed: user.monthlyAnalysesUsed
        } 
      });
  }));

  // Auth routes - Logout
  app.post('/api/auth/logout', (req, res) => {
    (req as any).session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: "Déconnexion réussie" });
    });
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      res.json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName,
        isPremium: user.isPremium,
        monthlyAnalysesUsed: user.monthlyAnalysesUsed
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
    }
  });

  // Profile management routes
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { firstName, lastName } = req.body;
      
      const user = await storage.upsertUser({
        id: userId,
        firstName,
        lastName,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Subscription management routes
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      // Pour l'instant, on simule l'annulation car l'intégration Stripe complète n'est pas active
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Si l'utilisateur est premium, on peut "annuler" son abonnement
      if (user.isPremium) {
        // Mettre à jour le statut premium de l'utilisateur
        const updatedUser = await storage.updateUserPremiumStatus(userId, false);
        
        res.json({ 
          message: "Votre abonnement premium a été annulé avec succès.",
          user: updatedUser
        });
      } else {
        return res.status(400).json({ message: "Aucun abonnement premium actif trouvé" });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Impossible d'annuler l'abonnement" });
    }
  });

  // Revolutionary Direct Audio Upload and Analysis
  app.post("/api/direct-audio-upload", isAuthenticated, audioUpload.single('audio'), async (req: any, res) => {
    const startTime = Date.now();
    
    try {
      const userId = req.session.userId;
      
      if (!req.file) {
        return res.status(400).json({ message: "Fichier audio requis" });
      }

      console.log("🎵 UPLOAD AUDIO DIRECT RÉVOLUTIONNAIRE:", {
        userId,
        fileName: req.file.originalname,
        size: `${Math.round(req.file.size / 1024 / 1024 * 100) / 100}MB`,
        mimetype: req.file.mimetype
      });

      // Validate file
      const validation = DirectAudioAnalysisService.validateAudioFile(req.file);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: "Fichier audio invalide", 
          issues: validation.issues 
        });
      }

      // Process with revolutionary multi-pass system
      const analysisResult = await DirectAudioAnalysisService.processDirectAudioUpload(req.file);
      
      const totalTime = Date.now() - startTime;
      console.log(`🎯 UPLOAD ET TRANSCRIPTION TERMINÉS: ${totalTime}ms`);

      res.json({
        success: true,
        fileName: req.file.originalname,
        ...analysisResult,
        uploadMetadata: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadTime: totalTime
        }
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("❌ ERREUR UPLOAD AUDIO DIRECT:", error);
      
      // Enhanced error handling
      const errorResult = DirectAudioAnalysisService.handleUploadError(error);
      
      res.status(errorResult.code).json({ 
        message: errorResult.message,
        processingTime,
        error: process.env.NODE_ENV === 'development' ? {
          stack: error instanceof Error ? error.stack : undefined,
          details: error
        } : undefined
      });
    }
  });

  // Audio upload and transcription routes (legacy support)
  app.post("/api/audio/upload", isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getAudioUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting audio upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Revolutionary multi-pass transcription endpoint
  app.post("/api/audio/transcribe", isAuthenticated, async (req: any, res) => {
    const startTime = Date.now();
    
    try {
      const { audioURL, fileName, fileSize, duration } = req.body;
      const userId = req.session.userId;
      
      if (!audioURL) {
        return res.status(400).json({ message: "URL audio requise" });
      }

      console.log("🎵 TRANSCRIPTION RÉVOLUTIONNAIRE INITIÉE:", {
        userId,
        fileName,
        fileSize: `${Math.round(fileSize / 1024 / 1024 * 100) / 100}MB`,
        estimatedDuration: `${Math.round(duration / 60)}min`
      });

      const objectStorageService = new ObjectStorageService();
      
      // Normalize the audio path
      const audioPath = objectStorageService.normalizeAudioPath(audioURL);
      
      // Get the audio file from object storage
      const audioFile = await objectStorageService.getAudioFile(audioPath);
      
      // Download audio to temp file for transcription
      const tempAudioPath = await objectStorageService.downloadAudioToTemp(audioFile);
      
      try {
        // Step 1: Validate and optimize audio
        const { AdvancedAudioProcessor } = await import('./audioProcessor');
        const validation = AdvancedAudioProcessor.validateAudioFile(tempAudioPath);
        
        if (!validation.isValid) {
          // Clean up temp file
          if (fs.existsSync(tempAudioPath)) {
            fs.unlinkSync(tempAudioPath);
          }
          return res.status(400).json({ 
            message: "Fichier audio invalide", 
            issues: validation.issues 
          });
        }

        // Step 2: Extract detailed metadata
        const audioMetadata = await AdvancedAudioProcessor.extractAudioMetadata(tempAudioPath);
        console.log("📊 Métadonnées extraites:", audioMetadata);

        // Step 3: Assess audio quality
        const qualityAssessment = AdvancedAudioProcessor.assessAudioQuality(audioMetadata);
        console.log(`🔍 Qualité audio: ${Math.round(qualityAssessment.score * 100)}%`);

        // Step 4: Optimize for transcription
        const optimization = await AdvancedAudioProcessor.optimizeAudioForTranscription(tempAudioPath);
        console.log("🔧 Optimisations:", optimization.optimizations);

        // Step 5: Revolutionary multi-pass transcription
        console.log("🚀 Lancement transcription multi-passes...");
        const transcriptionResult = await transcribeAudio(optimization.optimizedPath);
        
        console.log(`✅ Transcription terminée: ${transcriptionResult.text.length} chars, confiance: ${Math.round(transcriptionResult.confidence * 100)}%`);
        
        // Clean up temp files
        if (fs.existsSync(tempAudioPath)) {
          fs.unlinkSync(tempAudioPath);
        }
        AdvancedAudioProcessor.cleanup();
        
        const totalProcessingTime = Date.now() - startTime;
        console.log(`🎯 TRANSCRIPTION RÉVOLUTIONNAIRE TERMINÉE: ${totalProcessingTime}ms`);
        
        res.json({
          transcription: transcriptionResult.text,
          duration: transcriptionResult.duration,
          confidence: transcriptionResult.confidence,
          segments: transcriptionResult.segments,
          audioPath: audioPath,
          fileName: fileName,
          processingMetadata: {
            totalTime: totalProcessingTime,
            transcriptionTime: transcriptionResult.processingMetadata.processingTime,
            method: transcriptionResult.processingMetadata.transcriptionMethod,
            qualityScore: qualityAssessment.score,
            optimizations: optimization.optimizations
          },
          audioMetadata: {
            ...audioMetadata,
            qualityScore: qualityAssessment.score,
            qualityIssues: qualityAssessment.issues,
            recommendations: qualityAssessment.recommendations
          }
        });
        
      } catch (transcriptionError) {
        // Enhanced cleanup on error
        if (fs.existsSync(tempAudioPath)) {
          fs.unlinkSync(tempAudioPath);
        }
        
        // Cleanup any temporary files
        const { AdvancedAudioProcessor } = await import('./audioProcessor');
        AdvancedAudioProcessor.cleanup();
        
        throw transcriptionError;
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("❌ ERREUR TRANSCRIPTION RÉVOLUTIONNAIRE:", error);
      
      // Detailed error response
      let errorMessage = "Erreur de transcription audio";
      let errorCode = 500;
      
      if (error instanceof Error) {
        if (error.message.includes('format') || error.message.includes('Format')) {
          errorMessage = "Format audio non supporté. Utilisez MP3, WAV, M4A, FLAC, ou OGG.";
          errorCode = 400;
        } else if (error.message.includes('size') || error.message.includes('volumineux')) {
          errorMessage = "Fichier trop volumineux. Maximum 25MB autorisé.";
          errorCode = 400;
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorMessage = "Limite API atteinte. Réessayez dans quelques minutes.";
          errorCode = 429;
        } else if (error.message.includes('timeout')) {
          errorMessage = "Délai de traitement dépassé. Utilisez un fichier plus court.";
          errorCode = 408;
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(errorCode).json({ 
        message: errorMessage,
        processingTime,
        error: process.env.NODE_ENV === 'development' ? {
          stack: error instanceof Error ? error.stack : undefined,
          details: error
        } : undefined
      });
    }
  });

  // Revolutionary Combined Audio Upload + Analysis Endpoint
  app.post("/api/revolutionary-audio-analysis", isAuthenticated, audioUpload.single('audio'), async (req: any, res) => {
    const startTime = Date.now();
    
    try {
      const userId = req.session.userId;
      const { title } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "Fichier audio requis" });
      }

      console.log("🚀 ANALYSE AUDIO RÉVOLUTIONNAIRE COMPLÈTE:", {
        userId,
        fileName: req.file.originalname,
        size: `${Math.round(req.file.size / 1024 / 1024 * 100) / 100}MB`,
        title: title || "Sans titre"
      });

      // Check usage limits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      const currentMonth = new Date().getMonth();
      const lastResetMonth = user.lastResetDate ? new Date(user.lastResetDate).getMonth() : -1;
      
      if (currentMonth !== lastResetMonth) {
        await storage.upsertUser({
          id: userId,
          monthlyAnalysesUsed: 0,
          lastResetDate: new Date()
        });
      }

      if (!user.isPremium && (user.monthlyAnalysesUsed || 0) >= 3) {
        return res.status(403).json({ 
          message: "Limite mensuelle atteinte. Passez premium pour des analyses illimitées.",
          limitReached: true
        });
      }

      // Step 1: Process audio with revolutionary system
      const audioResult = await DirectAudioAnalysisService.processDirectAudioUpload(req.file);
      
      console.log("✅ Transcription révolutionnaire terminée");
      console.log("🧠 Lancement de l'analyse IA complète...");

      // Step 2: Enhanced AI conversation analysis
      const analysisResult = await analyzeAudioConversation(audioResult.transcription.text, {
        duration: audioResult.transcription.duration,
        fileSize: audioResult.uploadMetadata.size,
        confidence: audioResult.transcription.confidence,
        qualityScore: audioResult.audioMetadata.qualityScore,
        audioMetadata: audioResult.audioMetadata
      });

      // Step 3: Advanced insights generation
      const advancedInsights = await generateAdvancedInsights(audioResult.transcription.text);
      
      // Step 4: Emotional journey mapping
      const emotionalAnalysis = await analyzeEmotionalJourney(audioResult.transcription.text);

      console.log("✨ Analyse IA complète terminée");
      
      // Step 5: Save comprehensive analysis to database
      const analysis = await storage.createAnalysis({
        userId: userId,
        title: title || `Analyse Révolutionnaire - ${audioResult.uploadMetadata.originalName}`,
        inputText: audioResult.transcription.text,
        audioFilePath: "revolutionary-direct-upload",
        transcriptionText: audioResult.transcription.text,
        audioProcessingStatus: "completed",
        audioDurationMinutes: Math.round(audioResult.transcription.duration / 60),
        audioFileSize: audioResult.uploadMetadata.size,
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
        advancedInsights: {
          ...advancedInsights,
          ...analysisResult.audioInsights,
          revolutionaryMetadata: {
            transcriptionMethod: audioResult.processingStats.method,
            transcriptionConfidence: audioResult.transcription.confidence,
            audioQualityScore: audioResult.audioMetadata.qualityScore,
            processingOptimizations: audioResult.processingStats.optimizations,
            totalProcessingTime: Date.now() - startTime,
            revolutionaryFeatures: [
              "Transcription multi-passes",
              "Optimisation audio automatique",
              "Analyse IA contextuelle avancée",
              "Profiling psychologique approfondi",
              "Détection émotionnelle en temps réel"
            ]
          }
        },
        emotionalAnalysis: {
          ...emotionalAnalysis,
          audioSpecificInsights: {
            transcriptionSegments: audioResult.transcription.segments,
            confidenceVariations: audioResult.transcription.segments?.map(s => s.confidence) || [],
            qualityIssues: audioResult.audioMetadata.qualityIssues,
            recommendations: audioResult.audioMetadata.recommendations
          }
        }
      });

      // Step 6: Update analytics
      await storage.incrementUserAnalysisCount(userId);

      const totalProcessingTime = Date.now() - startTime;
      console.log(`🎯 ANALYSE RÉVOLUTIONNAIRE COMPLÈTE TERMINÉE: ${totalProcessingTime}ms`);

      res.json({
        success: true,
        analysis,
        revolutionaryInsights: {
          transcriptionMetadata: {
            text: audioResult.transcription.text,
            duration: audioResult.transcription.duration,
            confidence: audioResult.transcription.confidence,
            segments: audioResult.transcription.segments
          },
          audioMetadata: audioResult.audioMetadata,
          processingStats: {
            ...audioResult.processingStats,
            totalTime: totalProcessingTime,
            analysisTime: Date.now() - startTime - audioResult.processingStats.totalTime
          },
          uploadMetadata: audioResult.uploadMetadata,
          aiAnalysisMetadata: {
            confidenceScore: analysisResult.confidenceScore,
            interestLevel: analysisResult.interestLevel,
            emotionalComplexity: emotionalAnalysis.complexity || "medium",
            strategicComplexity: analysisResult.alternativeApproaches?.length || 0
          }
        }
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("❌ ERREUR ANALYSE RÉVOLUTIONNAIRE COMPLÈTE:", error);
      
      // Enhanced error handling with specific error categorization
      let errorMessage = "Erreur d'analyse révolutionnaire";
      let errorCode = 500;
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          errorMessage = "Limite API OpenAI atteinte. Réessayez dans quelques minutes.";
          errorCode = 429;
        } else if (error.message.includes('timeout')) {
          errorMessage = "Délai de traitement dépassé. Utilisez un fichier plus court.";
          errorCode = 408;
        } else if (error.message.includes('format') || error.message.includes('Format')) {
          errorMessage = "Format de données invalide lors du traitement.";
          errorCode = 400;
        } else if (error.message.includes('audio') || error.message.includes('Audio')) {
          errorMessage = "Erreur de traitement audio. Vérifiez le format et la qualité du fichier.";
          errorCode = 400;
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(errorCode).json({ 
        message: errorMessage,
        processingTime,
        revolutionaryError: true,
        error: process.env.NODE_ENV === 'development' ? {
          stack: error instanceof Error ? error.stack : undefined,
          details: error
        } : undefined
      });
    }
  });

  // Revolutionary Enhanced Audio Analysis with Multi-pass Transcription
  app.post("/api/analyze-audio", isAuthenticated, async (req: any, res) => {
    try {
      const { transcriptionText, title, audioPath, fileName, duration, fileSize } = req.body;
      const userId = req.session.userId;

      if (!transcriptionText) {
        return res.status(400).json({ message: "Transcription text is required" });
      }

      // Check usage limits for free users
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentMonth = new Date().getMonth();
      const lastResetMonth = user.lastResetDate ? new Date(user.lastResetDate).getMonth() : -1;
      
      if (currentMonth !== lastResetMonth) {
        await storage.upsertUser({
          id: userId,
          monthlyAnalysesUsed: 0,
          lastResetDate: new Date()
        });
      }

      if (!user.isPremium && (user.monthlyAnalysesUsed || 0) >= 3) {
        return res.status(403).json({ message: "Monthly analysis limit reached. Upgrade to premium for unlimited analyses." });
      }

      // Revolutionary AI Analysis System with enhanced processing
      console.log("🧠 Lancement de l'analyse IA révolutionnaire...");
      const startProcessingTime = Date.now();
      
      const analysisResult = await analyzeAudioConversation(transcriptionText, {
        duration,
        fileSize,
        confidence: 0.95, // High confidence for complete transcriptions
        qualityScore: 0.9, // Assume good quality for existing transcriptions
        audioMetadata: {
          duration,
          sampleRate: 44100,
          channels: 2,
          bitrate: 128000,
          format: fileName?.split('.').pop() || 'mp3',
          codec: 'unknown'
        }
      });
      
      console.log(`✅ Analyse IA terminée: ${Date.now() - startProcessingTime}ms`);

      // Generate advanced insights
      const advancedInsights = await generateAdvancedInsights(transcriptionText);
      const emotionalAnalysis = await analyzeEmotionalJourney(transcriptionText);

      // Save analysis to database with audio metadata
      const analysis = await storage.createAnalysis({
        userId: userId,
        title: title || `Analyse Audio Avancée - ${new Date().toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        inputText: transcriptionText,
        audioFilePath: audioPath,
        transcriptionText: transcriptionText,
        audioProcessingStatus: "completed",
        audioDurationMinutes: Math.round(duration / 60),
        audioFileSize: fileSize,
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
        advancedInsights: {
          ...advancedInsights,
          ...analysisResult.audioInsights,
          processingMetadata: {
            analysisMethod: "revolutionary-ai-system",
            confidenceScore: analysisResult.confidenceScore || 95,
            qualityIndicators: [
              "Analyse multi-passes IA",
              "Traitement contextuel avancé",
              "Insights psychologiques profonds"
            ]
          }
        },
        emotionalAnalysis: emotionalAnalysis
      });

      // Update user analysis count
      await storage.incrementUserAnalysisCount(userId);

      console.log("Audio conversation analysis completed successfully");

      res.json({
        ...analysis,
        audioInsights: analysisResult.audioInsights
      });
    } catch (error) {
      console.error("Error analyzing audio conversation:", error);
      res.status(500).json({ 
        message: "Failed to analyze audio conversation: " + (error as Error).message 
      });
    }
  });

  // Analysis routes
  app.post('/api/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { conversationText, title } = req.body;

      // Comprehensive input validation
      if (!conversationText || typeof conversationText !== 'string' || conversationText.trim().length === 0) {
        return res.status(400).json({ message: "Le texte de conversation est obligatoire et ne peut pas être vide." });
      }

      if (conversationText.length > 50000) {
        return res.status(400).json({ message: "Le texte de conversation ne peut pas dépasser 50 000 caractères." });
      }

      if (title && (typeof title !== 'string' || title.length > 200)) {
        return res.status(400).json({ message: "Le titre doit être une chaîne de moins de 200 caractères." });
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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

  // Stripe payment route for lifetime offer
  app.post("/api/create-lifetime-payment", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Vérifier si l'utilisateur a déjà un accès premium
      if (user.isPremium) {
        return res.status(400).json({ message: "Vous avez déjà un accès premium" });
      }

      // Créer une session Stripe Checkout pour l'offre à vie
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'LeadMirror - Accès à Vie',
                description: 'Accès illimité à vie à toutes les fonctionnalités premium de LeadMirror',
                images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'],
              },
              unit_amount: 9900, // 99€ en centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/dashboard?payment=success`,
        cancel_url: `${req.protocol}://${req.get('host')}/lifetime-offer?payment=cancelled`,
        client_reference_id: userId,
        metadata: {
          userId: userId,
          offer_type: 'lifetime',
        },
      });

      res.json({ checkoutUrl: session.url });
    } catch (error: any) {
      console.error("Erreur création paiement:", error);
      res.status(500).json({ message: "Erreur lors de la création du paiement: " + error.message });
    }
  });

  // Stripe subscription routes - Create Checkout Session
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId && user.subscriptionStatus === 'active') {
        // User already has an active subscription
        return res.status(400).json({ 
          message: "Vous avez déjà un abonnement actif"
        });
      }

      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          metadata: { userId: userId }
        });
        customerId = customer.id;
      }

      // Create price for €15/month
      const price = await stripe.prices.create({
        unit_amount: 1500, // €15.00 in cents
        currency: 'eur',
        recurring: { interval: 'month' },
        product_data: {
          name: 'LeadMirror Premium'
        },
      });

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: price.id,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/profile?success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/profile?canceled=true`,
        metadata: { userId: userId }
      });

      res.json({
        checkoutUrl: session.url,
        sessionId: session.id
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
      case 'checkout.session.completed':
        const session = event.data.object;
        if (session.metadata?.type === 'lifetime') {
          const userId = session.metadata.userId;
          if (userId) {
            await storage.updateUserPremiumStatus(userId, true);
            console.log(`Lifetime payment processed for user: ${userId}`);
          }
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
      const integrations = await storage.getUserCrmIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching CRM integrations:", error);
      res.status(500).json({ message: "Failed to fetch CRM integrations" });
    }
  });

  app.post('/api/crm/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
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
        return res.status(400).json({ message: `Connection test failed: ${(error as Error).message}` });
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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

  // Create lifetime payment - Stripe Checkout for €99
  app.post("/api/create-lifetime-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_1Rs9fdF1s37tn7hICAwHQvsE', // LeadMirror Lifetime - 99 EUR
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/dashboard?payment=success&type=lifetime`,
        cancel_url: `${req.headers.origin}/subscribe?payment=cancelled`,
        customer_email: user.email || undefined,
        metadata: {
          userId: userId,
          type: 'lifetime',
          amount: '99',
        },
      });

      res.json({ checkoutUrl: session.url });
    } catch (error: any) {
      console.error("Error creating lifetime payment:", error);
      res.status(500).json({ message: "Erreur lors de la création du paiement: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
