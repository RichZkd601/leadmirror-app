// Direct audio file upload and analysis with revolutionary multi-pass transcription
import fs from "fs";
import path from "path";
import multer from "multer";
import { transcribeAudio } from "./openai";
import { AdvancedAudioProcessor } from "./audioProcessor";

// Configure multer for direct audio uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = '/tmp/leadmirror-uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}_${timestamp}${ext}`);
  }
});

// File filter for audio files only
const fileFilter = (req: any, file: any, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'audio/mpeg', // MP3
    'audio/wav', // WAV
    'audio/m4a', // M4A
    'audio/mp4', // MP4 audio
    'audio/flac', // FLAC
    'audio/ogg', // OGG
    'audio/webm', // WebM audio
    'audio/aac', // AAC
    'audio/x-m4a' // Alternative M4A mime
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format audio non supporté: ${file.mimetype}. Formats acceptés: MP3, WAV, M4A, FLAC, OGG, AAC`));
  }
};

export const audioUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper API limit)
    files: 1 // Only one file at a time
  }
});

// Revolutionary direct audio analysis service
export class DirectAudioAnalysisService {
  static async processDirectAudioUpload(file: any): Promise<{
    transcription: {
      text: string;
      duration: number;
      confidence: number;
      segments?: Array<{
        start: number;
        end: number;
        text: string;
        confidence?: number;
      }>;
    };
    audioMetadata: {
      duration: number;
      sampleRate: number;
      channels: number;
      bitrate: number;
      format: string;
      codec: string;
      qualityScore: number;
      qualityIssues: string[];
      recommendations: string[];
    };
    processingStats: {
      totalTime: number;
      transcriptionTime: number;
      optimizations: string[];
      method: string;
    };
  }> {
    const startTime = Date.now();
    
    try {
      console.log("🎵 ANALYSE AUDIO DIRECTE RÉVOLUTIONNAIRE:", {
        fileName: file.originalname,
        size: `${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`,
        mimetype: file.mimetype
      });

      // Step 1: Advanced validation
      const validation = AdvancedAudioProcessor.validateAudioFile(file.path);
      if (!validation.isValid) {
        throw new Error(`Fichier audio invalide: ${validation.issues.join(', ')}`);
      }

      // Step 2: Extract comprehensive metadata
      const audioMetadata = await AdvancedAudioProcessor.extractAudioMetadata(file.path);
      console.log("📊 Métadonnées extraites:", audioMetadata);

      // Step 3: Quality assessment
      const qualityAssessment = AdvancedAudioProcessor.assessAudioQuality(audioMetadata);
      console.log(`🔍 Score qualité: ${Math.round(qualityAssessment.score * 100)}%`);
      
      if (qualityAssessment.issues.length > 0) {
        console.warn("⚠️ Problèmes détectés:", qualityAssessment.issues);
      }

      // Step 4: Audio optimization
      const optimization = await AdvancedAudioProcessor.optimizeAudioForTranscription(file.path);
      console.log("🔧 Optimisations appliquées:", optimization.optimizations);

      // Step 5: Revolutionary multi-pass transcription
      console.log("🚀 Lancement transcription multi-passes...");
      const transcriptionResult = await transcribeAudio(optimization.optimizedPath);
      
      console.log(`✅ Transcription réussie:`);
      console.log(`   Texte: ${transcriptionResult.text.length} caractères`);
      console.log(`   Confiance: ${Math.round(transcriptionResult.confidence * 100)}%`);
      console.log(`   Durée: ${Math.round(transcriptionResult.duration)}s`);
      console.log(`   Méthode: ${transcriptionResult.processingMetadata.transcriptionMethod}`);

      // Step 6: Cleanup temporary files
      this.cleanupTempFiles([file.path, optimization.optimizedPath]);
      AdvancedAudioProcessor.cleanup();

      const totalProcessingTime = Date.now() - startTime;
      console.log(`🎯 ANALYSE DIRECTE TERMINÉE: ${totalProcessingTime}ms`);

      return {
        transcription: {
          text: transcriptionResult.text,
          duration: transcriptionResult.duration,
          confidence: transcriptionResult.confidence,
          segments: transcriptionResult.segments
        },
        audioMetadata: {
          ...audioMetadata,
          qualityScore: qualityAssessment.score,
          qualityIssues: qualityAssessment.issues,
          recommendations: qualityAssessment.recommendations
        },
        processingStats: {
          totalTime: totalProcessingTime,
          transcriptionTime: transcriptionResult.processingMetadata.processingTime,
          optimizations: optimization.optimizations,
          method: transcriptionResult.processingMetadata.transcriptionMethod
        }
      };

    } catch (error) {
      console.error("❌ ERREUR ANALYSE AUDIO DIRECTE:", error);
      
      // Cleanup on error
      this.cleanupTempFiles([file.path]);
      AdvancedAudioProcessor.cleanup();
      
      throw error;
    }
  }

  private static cleanupTempFiles(filePaths: string[]): void {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Fichier temporaire supprimé: ${path.basename(filePath)}`);
        }
      } catch (error) {
        console.warn(`⚠️ Impossible de supprimer le fichier temporaire: ${filePath}`, error);
      }
    }
  }

  // Validate audio file on upload
  static validateAudioFile(file: any): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Size validation
    if (file.size > 25 * 1024 * 1024) {
      issues.push(`Fichier trop volumineux: ${Math.round(file.size / 1024 / 1024)}MB (maximum 25MB)`);
    }
    
    if (file.size < 1024) {
      issues.push(`Fichier trop petit: ${file.size} bytes (minimum 1KB)`);
    }
    
    // Format validation
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.flac', '.ogg', '.webm', '.aac'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      issues.push(`Extension non supportée: ${fileExt}. Extensions acceptées: ${allowedExtensions.join(', ')}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Error handler for multer
  static handleUploadError(error: any) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return {
          message: "Fichier trop volumineux. Taille maximum autorisée: 25MB",
          code: 400
        };
      } else if (error.code === 'LIMIT_FILE_COUNT') {
        return {
          message: "Trop de fichiers. Un seul fichier audio autorisé",
          code: 400
        };
      } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return {
          message: "Champ de fichier inattendu",
          code: 400
        };
      }
    }
    
    if (error.message && error.message.includes('Format audio non supporté')) {
      return {
        message: error.message,
        code: 400
      };
    }
    
    return {
      message: "Erreur de traitement du fichier audio",
      code: 500
    };
  }
}

// Auto-cleanup on process exit
process.on('exit', () => {
  try {
    const uploadDir = '/tmp/leadmirror-uploads';
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        fs.unlinkSync(filePath);
      }
      fs.rmdirSync(uploadDir);
      console.log("🧹 Dossier temporaire d'upload nettoyé");
    }
  } catch (error) {
    console.warn("⚠️ Erreur nettoyage dossier upload:", error);
  }
});

process.on('SIGINT', () => {
  DirectAudioAnalysisService;
  process.exit();
});

process.on('SIGTERM', () => {
  DirectAudioAnalysisService;
  process.exit();
});