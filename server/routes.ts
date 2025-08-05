import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { getSession } from "./socialAuth";
import bcrypt from "bcrypt";

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
    const { email, password, firstName, lastName, rememberMe } = req.body;
      
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

      // Set session with extended duration if rememberMe is true
      (req as any).session.userId = user.id;
      if (rememberMe) {
        // Extend session to 30 days
        (req as any).session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

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
    const { email, password, rememberMe } = req.body;
      
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

      // Set session with extended duration if rememberMe is true
      (req as any).session.userId = user.id;
      if (rememberMe) {
        // Extend session to 30 days
        (req as any).session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

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

  // Route temporaire pour activer le premium manuellement (pour les tests)
  app.post('/api/activate-premium', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.updateUserPremiumStatus(req.session.userId, true);
      res.json({ 
        message: "Premium activé avec succès",
        user: {
          id: user.id,
          email: user.email,
          isPremium: user.isPremium
        }
      });
    } catch (error) {
      console.error("Error activating premium:", error);
      res.status(500).json({ message: "Erreur lors de l'activation du premium" });
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

      // Performance optimization: removed verbose logging

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
      // Performance optimization: removed verbose logging

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

      // Performance optimization: removed verbose logging

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
        fileSize: audioResult.audioMetadata.fileSize,
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
        title: title || `Analyse Révolutionnaire - ${audioResult.audioMetadata.fileName}`,
        inputText: audioResult.transcription.text,
        audioFilePath: "revolutionary-direct-upload",
        transcriptionText: audioResult.transcription.text,
        audioProcessingStatus: "completed",
        audioDurationMinutes: Math.round(audioResult.transcription.duration / 60),
        audioFileSize: audioResult.audioMetadata.fileSize,
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
      await storage.incrementAnalysisCount(userId);

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
          uploadMetadata: {
            originalName: audioResult.audioMetadata.fileName,
            fileSize: audioResult.audioMetadata.fileSize,
            format: audioResult.audioMetadata.format
          },
          aiAnalysisMetadata: {
            confidenceScore: analysisResult.confidenceScore,
            interestLevel: analysisResult.interestLevel,
            emotionalComplexity: "medium",
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
      await storage.incrementAnalysisCount(userId);

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

      // Analyse IA réelle avec OpenAI
      const analysisResult = await analyzeConversation(conversationText);

      // Génération dynamique des insights avancés et analyse émotionnelle
      const advancedInsights = await generateAdvancedInsights(conversationText);
      const emotionalAnalysis = await analyzeEmotionalJourney(conversationText);

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

      console.log(`💳 Création session de paiement à vie pour l'utilisateur: ${userId}`);

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
          success_url: `${req.protocol}://${req.get('host')}/dashboard?payment=success&type=lifetime`,
          cancel_url: `${req.protocol}://${req.get('host')}/dashboard?payment=cancelled`,
          client_reference_id: userId,
          customer_email: user.email || undefined,
          metadata: {
            userId: userId,
            offer_type: 'lifetime',
            type: 'lifetime',
            payment_type: 'lifetime'
          },
        });

      console.log(`✅ Session de paiement créée: ${session.id}`);
      console.log(`🔗 URLs de retour:`);
      console.log(`   Success: ${req.protocol}://${req.get('host')}/dashboard?payment=success&type=lifetime`);
      console.log(`   Cancel: ${req.protocol}://${req.get('host')}/dashboard?payment=cancelled`);
      res.json({ checkoutUrl: session.url });
    } catch (error: any) {
      console.error("❌ Erreur création paiement:", error);
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

      console.log(`💳 Création session d'abonnement pour l'utilisateur: ${userId}`);

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          metadata: { userId: userId }
        });
        customerId = customer.id;
        console.log(`👤 Client Stripe créé: ${customerId}`);
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

      console.log(`💰 Prix créé: ${price.id}`);

              // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [{
            price: price.id,
            quantity: 1,
          }],
          mode: 'subscription',
          success_url: `${req.protocol}://${req.get('host')}/dashboard?payment=success&type=subscription`,
          cancel_url: `${req.protocol}://${req.get('host')}/dashboard?payment=cancelled`,
          client_reference_id: userId,
          metadata: { 
            userId: userId,
            type: 'subscription',
            offer_type: 'subscription'
          }
        });

      console.log(`✅ Session d'abonnement créée: ${session.id}`);
      console.log(`🔗 URLs de retour:`);
      console.log(`   Success: ${req.protocol}://${req.get('host')}/dashboard?payment=success&type=subscription`);
      console.log(`   Cancel: ${req.protocol}://${req.get('host')}/dashboard?payment=cancelled`);
      res.json({
        checkoutUrl: session.url,
        sessionId: session.id
      });
    } catch (error: any) {
      console.error("❌ Error creating subscription:", error);
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
      console.log(`❌ Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`🔔 Webhook reçu: ${event.type}`);
    console.log(`📊 Données webhook:`, JSON.stringify(event.data.object, null, 2));

    try {
      // Handle the event
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
          const subscription = event.data.object;
          console.log(`📅 Abonnement ${subscription.status}: ${subscription.id}`);
          if (subscription.status === 'active') {
            // Update user premium status
            const user = await storage.getUserByStripeSubscriptionId(subscription.id);
            if (user) {
              await storage.updateUserPremiumStatus(user.id, true);
              console.log(`✅ Accès premium activé pour l'utilisateur: ${user.id} (${user.email})`);
            } else {
              console.log(`⚠️ Utilisateur non trouvé pour l'abonnement: ${subscription.id}`);
            }
          }
          break;
        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object;
          const userToUpdate = await storage.getUserByStripeSubscriptionId(deletedSubscription.id);
          if (userToUpdate) {
            await storage.updateUserPremiumStatus(userToUpdate.id, false);
            console.log(`❌ Accès premium désactivé pour l'utilisateur: ${userToUpdate.id} (${userToUpdate.email})`);
          }
          break;
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log(`💳 Session de paiement complétée: ${session.id}`);
          console.log(`📋 Métadonnées:`, session.metadata);
          console.log(`🎯 Mode: ${session.mode}, Subscription: ${session.subscription}`);
          
          // Gérer les paiements à vie
          if (session.metadata?.type === 'lifetime' || session.metadata?.offer_type === 'lifetime') {
            const userId = session.metadata.userId || session.client_reference_id;
            if (userId) {
              await storage.updateUserPremiumStatus(userId, true);
              console.log(`🎉 Paiement à vie traité pour l'utilisateur: ${userId}`);
            } else {
              console.log(`⚠️ userId manquant pour le paiement à vie: ${session.id}`);
            }
          }
          
          // Gérer les abonnements mensuels
          if (session.mode === 'subscription' && session.subscription) {
            const userId = session.metadata?.userId;
            if (userId) {
              await storage.updateUserPremiumStatus(userId, true);
              console.log(`🎉 Abonnement mensuel activé pour l'utilisateur: ${userId}`);
            } else {
              console.log(`⚠️ userId manquant pour l'abonnement: ${session.id}`);
            }
          }
          break;
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          console.log(`💰 Paiement d'invoice réussi: ${invoice.subscription}`);
          if (invoice.subscription) {
            const user = await storage.getUserByStripeSubscriptionId(invoice.subscription);
            if (user) {
              await storage.updateUserPremiumStatus(user.id, true);
              console.log(`✅ Accès premium renouvelé pour l'utilisateur: ${user.id} (${user.email})`);
            } else {
              console.log(`⚠️ Utilisateur non trouvé pour l'invoice: ${invoice.subscription}`);
            }
          }
          break;
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          console.log(`❌ Paiement d'invoice échoué: ${failedInvoice.subscription}`);
          if (failedInvoice.subscription) {
            const user = await storage.getUserByStripeSubscriptionId(failedInvoice.subscription);
            if (user) {
              await storage.updateUserPremiumStatus(user.id, false);
              console.log(`❌ Accès premium désactivé pour l'utilisateur: ${user.id} (${user.email})`);
            }
          }
          break;
        default:
          console.log(`⚠️ Événement non géré: ${event.type}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement du webhook ${event.type}:`, error);
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





  const httpServer = createServer(app);
  return httpServer;
}
