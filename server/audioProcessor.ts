import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

// Revolutionary audio processing and optimization system
export class AdvancedAudioProcessor {
  private static readonly SUPPORTED_FORMATS = [
    '.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.flac', '.ogg', '.opus', '.aac'
  ];
  
  private static readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper limit)
  private static readonly MIN_FILE_SIZE = 1024; // 1KB minimum
  private static readonly OPTIMAL_SAMPLE_RATE = 16000; // 16kHz optimal for Whisper
  private static readonly TEMP_DIR = "/tmp/leadmirror-audio";
  
  static async initialize(): Promise<void> {
    // Create temp directory for audio processing
    if (!fs.existsSync(this.TEMP_DIR)) {
      fs.mkdirSync(this.TEMP_DIR, { recursive: true });
    }
  }
  
  // Enhanced audio validation with detailed feedback
  static validateAudioFile(filePath: string): {
    isValid: boolean;
    issues: string[];
    metadata: {
      size: number;
      format: string;
      hash: string;
    };
  } {
    const issues: string[] = [];
    
    if (!fs.existsSync(filePath)) {
      return {
        isValid: false,
        issues: ["Fichier audio introuvable"],
        metadata: { size: 0, format: "", hash: "" }
      };
    }
    
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const fileExt = path.extname(filePath).toLowerCase();
    const fileHash = this.generateFileHash(filePath);
    
    if (fileSize < this.MIN_FILE_SIZE) {
      issues.push(`Fichier trop petit (minimum ${this.MIN_FILE_SIZE} bytes)`);
    }
    
    if (fileSize > this.MAX_FILE_SIZE) {
      issues.push(`Fichier trop volumineux (maximum ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB, reçu ${Math.round(fileSize / 1024 / 1024)}MB)`);
    }
    
    if (!this.SUPPORTED_FORMATS.includes(fileExt)) {
      issues.push(`Format non supporté: ${fileExt}. Formats acceptés: ${this.SUPPORTED_FORMATS.join(', ')}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      metadata: {
        size: fileSize,
        format: fileExt,
        hash: fileHash
      }
    };
  }
  
  // Pre-process audio for optimal transcription
  static async optimizeAudioForTranscription(inputPath: string): Promise<{
    optimizedPath: string;
    optimizations: string[];
    originalSize: number;
    optimizedSize: number;
  }> {
    await this.initialize();
    
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;
    const inputHash = this.generateFileHash(inputPath);
    const outputPath = path.join(this.TEMP_DIR, `optimized_${inputHash.substring(0, 8)}.wav`);
    
    const optimizations: string[] = [];
    
    try {
      // Check if ffmpeg is available (optional optimization)
      try {
        await execAsync('which ffmpeg');
        
        // Optimize audio using ffmpeg
        const ffmpegCommand = [
          'ffmpeg',
          '-i', `"${inputPath}"`,
          '-ar', this.OPTIMAL_SAMPLE_RATE.toString(), // Resample to 16kHz
          '-ac', '1', // Convert to mono
          '-c:a', 'pcm_s16le', // Uncompressed PCM for best quality
          '-y', // Overwrite output
          `"${outputPath}"`
        ].join(' ');
        
        console.log(`🔧 Optimisation audio avec FFmpeg: ${ffmpegCommand}`);
        await execAsync(ffmpegCommand);
        
        optimizations.push('Rééchantillonnage à 16kHz');
        optimizations.push('Conversion en mono');
        optimizations.push('Format PCM non compressé');
        
      } catch (ffmpegError) {
        console.log('📝 FFmpeg non disponible, utilisation du fichier original');
        // If ffmpeg is not available, copy original file
        fs.copyFileSync(inputPath, outputPath);
        optimizations.push('Fichier original utilisé (FFmpeg non disponible)');
      }
      
      const optimizedStats = fs.statSync(outputPath);
      const optimizedSize = optimizedStats.size;
      
      console.log(`✅ Optimisation terminée:`);
      console.log(`   Taille originale: ${Math.round(originalSize / 1024)}KB`);
      console.log(`   Taille optimisée: ${Math.round(optimizedSize / 1024)}KB`);
      console.log(`   Optimisations: ${optimizations.join(', ')}`);
      
      return {
        optimizedPath: outputPath,
        optimizations,
        originalSize,
        optimizedSize
      };
      
    } catch (error) {
      console.error('❌ Erreur optimisation audio:', error);
      
      // Fallback: use original file
      fs.copyFileSync(inputPath, outputPath);
      return {
        optimizedPath: outputPath,
        optimizations: ['Erreur optimisation - fichier original utilisé'],
        originalSize,
        optimizedSize: originalSize
      };
    }
  }
  
  // Extract detailed audio metadata
  static async extractAudioMetadata(filePath: string): Promise<{
    duration: number;
    sampleRate: number;
    channels: number;
    bitrate: number;
    format: string;
    codec: string;
  }> {
    try {
      // Try to use ffprobe for detailed metadata
      const ffprobeCommand = [
        'ffprobe',
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        `"${filePath}"`
      ].join(' ');
      
      const { stdout } = await execAsync(ffprobeCommand);
      const metadata = JSON.parse(stdout);
      
      const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio') || {};
      const format = metadata.format || {};
      
      return {
        duration: parseFloat(format.duration) || 0,
        sampleRate: parseInt(audioStream.sample_rate) || 0,
        channels: parseInt(audioStream.channels) || 0,
        bitrate: parseInt(format.bit_rate) || 0,
        format: format.format_name || 'unknown',
        codec: audioStream.codec_name || 'unknown'
      };
      
    } catch (error) {
      console.log('📝 FFprobe non disponible, estimation basique des métadonnées');
      
      // Fallback: basic estimation
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Rough estimation: 128kbps average
      const estimatedDuration = fileSize / (128 * 1024 / 8); // seconds
      
      return {
        duration: estimatedDuration,
        sampleRate: 44100, // Common default
        channels: 2, // Stereo default
        bitrate: 128000, // 128kbps default
        format: path.extname(filePath).substring(1),
        codec: 'unknown'
      };
    }
  }
  
  static generateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return createHash('sha256').update(fileBuffer).digest('hex');
  }
  
  // Cleanup temporary files
  static cleanup(): void {
    try {
      if (fs.existsSync(this.TEMP_DIR)) {
        const files = fs.readdirSync(this.TEMP_DIR);
        for (const file of files) {
          const filePath = path.join(this.TEMP_DIR, file);
          const stats = fs.statSync(filePath);
          
          // Delete files older than 1 hour
          if (Date.now() - stats.mtime.getTime() > 60 * 60 * 1000) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Fichier temporaire supprimé: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Erreur nettoyage fichiers temporaires:', error);
    }
  }
  
  // Audio quality assessment
  static assessAudioQuality(metadata: {
    duration: number;
    sampleRate: number;
    channels: number;
    bitrate: number;
    format: string;
  }): {
    score: number; // 0-1
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;
    
    // Duration checks
    if (metadata.duration < 10) {
      issues.push('Audio très court (< 10 secondes)');
      score -= 0.2;
    } else if (metadata.duration > 3600) {
      issues.push('Audio très long (> 1 heure)');
      recommendations.push('Divisez les longs enregistrements en segments');
      score -= 0.1;
    }
    
    // Sample rate checks
    if (metadata.sampleRate < 16000) {
      issues.push('Taux d\'échantillonnage faible (< 16kHz)');
      recommendations.push('Utilisez un taux d\'échantillonnage d\'au moins 16kHz');
      score -= 0.3;
    } else if (metadata.sampleRate > 48000) {
      recommendations.push('Taux d\'échantillonnage élevé - 16-44kHz suffisant');
    }
    
    // Bitrate checks
    if (metadata.bitrate < 64000) {
      issues.push('Débit faible (< 64kbps)');
      recommendations.push('Utilisez un débit d\'au moins 128kbps pour une meilleure qualité');
      score -= 0.2;
    }
    
    // Format checks
    const lossyFormats = ['.mp3', '.aac', '.ogg'];
    if (lossyFormats.includes(metadata.format)) {
      recommendations.push('Préférez les formats sans perte (WAV, FLAC) pour une qualité optimale');
    }
    
    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}

// Auto-cleanup on process exit
process.on('exit', () => {
  AdvancedAudioProcessor.cleanup();
});

process.on('SIGINT', () => {
  AdvancedAudioProcessor.cleanup();
  process.exit();
});

process.on('SIGTERM', () => {
  AdvancedAudioProcessor.cleanup();
  process.exit();
});