var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/audioProcessor.ts
var audioProcessor_exports = {};
__export(audioProcessor_exports, {
  AdvancedAudioProcessor: () => AdvancedAudioProcessor
});
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { promisify } from "util";
import { exec } from "child_process";
var execAsync, AdvancedAudioProcessor;
var init_audioProcessor = __esm({
  "server/audioProcessor.ts"() {
    "use strict";
    execAsync = promisify(exec);
    AdvancedAudioProcessor = class {
      static SUPPORTED_FORMATS = [
        ".mp3",
        ".mp4",
        ".mpeg",
        ".mpga",
        ".m4a",
        ".wav",
        ".webm",
        ".flac",
        ".ogg",
        ".opus",
        ".aac"
      ];
      static MAX_FILE_SIZE = 25 * 1024 * 1024;
      // 25MB (Whisper limit)
      static MIN_FILE_SIZE = 1024;
      // 1KB minimum
      static OPTIMAL_SAMPLE_RATE = 16e3;
      // 16kHz optimal for Whisper
      static TEMP_DIR = "/tmp/leadmirror-audio";
      static async initialize() {
        if (!fs.existsSync(this.TEMP_DIR)) {
          fs.mkdirSync(this.TEMP_DIR, { recursive: true });
        }
      }
      // Enhanced audio validation with detailed feedback
      static validateAudioFile(filePath) {
        const issues = [];
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
          issues.push(`Fichier trop volumineux (maximum ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB, re\xE7u ${Math.round(fileSize / 1024 / 1024)}MB)`);
        }
        if (!this.SUPPORTED_FORMATS.includes(fileExt)) {
          issues.push(`Format non support\xE9: ${fileExt}. Formats accept\xE9s: ${this.SUPPORTED_FORMATS.join(", ")}`);
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
      static async optimizeAudioForTranscription(inputPath) {
        await this.initialize();
        const originalStats = fs.statSync(inputPath);
        const originalSize = originalStats.size;
        const inputHash = this.generateFileHash(inputPath);
        const outputPath = path.join(this.TEMP_DIR, `optimized_${inputHash.substring(0, 8)}.wav`);
        const optimizations = [];
        try {
          try {
            await execAsync("which ffmpeg");
            const ffmpegCommand = [
              "ffmpeg",
              "-i",
              `"${inputPath}"`,
              "-ar",
              this.OPTIMAL_SAMPLE_RATE.toString(),
              // Resample to 16kHz
              "-ac",
              "1",
              // Convert to mono
              "-c:a",
              "pcm_s16le",
              // Uncompressed PCM for best quality
              "-y",
              // Overwrite output
              `"${outputPath}"`
            ].join(" ");
            console.log(`\u{1F527} Optimisation audio avec FFmpeg: ${ffmpegCommand}`);
            await execAsync(ffmpegCommand);
            optimizations.push("R\xE9\xE9chantillonnage \xE0 16kHz");
            optimizations.push("Conversion en mono");
            optimizations.push("Format PCM non compress\xE9");
          } catch (ffmpegError) {
            console.log("\u{1F4DD} FFmpeg non disponible, utilisation du fichier original");
            fs.copyFileSync(inputPath, outputPath);
            optimizations.push("Fichier original utilis\xE9 (FFmpeg non disponible)");
          }
          const optimizedStats = fs.statSync(outputPath);
          const optimizedSize = optimizedStats.size;
          console.log(`\u2705 Optimisation termin\xE9e:`);
          console.log(`   Taille originale: ${Math.round(originalSize / 1024)}KB`);
          console.log(`   Taille optimis\xE9e: ${Math.round(optimizedSize / 1024)}KB`);
          console.log(`   Optimisations: ${optimizations.join(", ")}`);
          return {
            optimizedPath: outputPath,
            optimizations,
            originalSize,
            optimizedSize
          };
        } catch (error) {
          console.error("\u274C Erreur optimisation audio:", error);
          fs.copyFileSync(inputPath, outputPath);
          return {
            optimizedPath: outputPath,
            optimizations: ["Erreur optimisation - fichier original utilis\xE9"],
            originalSize,
            optimizedSize: originalSize
          };
        }
      }
      // Extract detailed audio metadata
      static async extractAudioMetadata(filePath) {
        try {
          const ffprobeCommand = [
            "ffprobe",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            `"${filePath}"`
          ].join(" ");
          const { stdout } = await execAsync(ffprobeCommand);
          const metadata = JSON.parse(stdout);
          const audioStream = metadata.streams.find((s) => s.codec_type === "audio") || {};
          const format = metadata.format || {};
          return {
            duration: parseFloat(format.duration) || 0,
            sampleRate: parseInt(audioStream.sample_rate) || 0,
            channels: parseInt(audioStream.channels) || 0,
            bitrate: parseInt(format.bit_rate) || 0,
            format: format.format_name || "unknown",
            codec: audioStream.codec_name || "unknown"
          };
        } catch (error) {
          console.log("\u{1F4DD} FFprobe non disponible, estimation basique des m\xE9tadonn\xE9es");
          const stats = fs.statSync(filePath);
          const fileSize = stats.size;
          const estimatedDuration = fileSize / (128 * 1024 / 8);
          return {
            duration: estimatedDuration,
            sampleRate: 44100,
            // Common default
            channels: 2,
            // Stereo default
            bitrate: 128e3,
            // 128kbps default
            format: path.extname(filePath).substring(1),
            codec: "unknown"
          };
        }
      }
      static generateFileHash(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        return createHash("sha256").update(fileBuffer).digest("hex");
      }
      // Cleanup temporary files
      static cleanup() {
        try {
          if (fs.existsSync(this.TEMP_DIR)) {
            const files = fs.readdirSync(this.TEMP_DIR);
            for (const file of files) {
              const filePath = path.join(this.TEMP_DIR, file);
              const stats = fs.statSync(filePath);
              if (Date.now() - stats.mtime.getTime() > 60 * 60 * 1e3) {
                fs.unlinkSync(filePath);
                console.log(`\u{1F5D1}\uFE0F Fichier temporaire supprim\xE9: ${file}`);
              }
            }
          }
        } catch (error) {
          console.error("\u26A0\uFE0F Erreur nettoyage fichiers temporaires:", error);
        }
      }
      // Audio quality assessment
      static assessAudioQuality(metadata) {
        const issues = [];
        const recommendations = [];
        let score = 1;
        if (metadata.duration < 10) {
          issues.push("Audio tr\xE8s court (< 10 secondes)");
          score -= 0.2;
        } else if (metadata.duration > 3600) {
          issues.push("Audio tr\xE8s long (> 1 heure)");
          recommendations.push("Divisez les longs enregistrements en segments");
          score -= 0.1;
        }
        if (metadata.sampleRate < 16e3) {
          issues.push("Taux d'\xE9chantillonnage faible (< 16kHz)");
          recommendations.push("Utilisez un taux d'\xE9chantillonnage d'au moins 16kHz");
          score -= 0.3;
        } else if (metadata.sampleRate > 48e3) {
          recommendations.push("Taux d'\xE9chantillonnage \xE9lev\xE9 - 16-44kHz suffisant");
        }
        if (metadata.bitrate < 64e3) {
          issues.push("D\xE9bit faible (< 64kbps)");
          recommendations.push("Utilisez un d\xE9bit d'au moins 128kbps pour une meilleure qualit\xE9");
          score -= 0.2;
        }
        const lossyFormats = [".mp3", ".aac", ".ogg"];
        if (lossyFormats.includes(metadata.format)) {
          recommendations.push("Pr\xE9f\xE9rez les formats sans perte (WAV, FLAC) pour une qualit\xE9 optimale");
        }
        return {
          score: Math.max(0, score),
          issues,
          recommendations
        };
      }
    };
    process.on("exit", () => {
      AdvancedAudioProcessor.cleanup();
    });
    process.on("SIGINT", () => {
      AdvancedAudioProcessor.cleanup();
      process.exit();
    });
    process.on("SIGTERM", () => {
      AdvancedAudioProcessor.cleanup();
      process.exit();
    });
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import Stripe from "stripe";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analyses: () => analyses,
  analysesRelations: () => analysesRelations,
  insertAnalysisSchema: () => insertAnalysisSchema,
  insertUserMetricsSchema: () => insertUserMetricsSchema,
  insertUserSchema: () => insertUserSchema,
  sessions: () => sessions,
  userMetrics: () => userMetrics,
  userMetricsRelations: () => userMetricsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password_hash"),
  // Match existing database column
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  isPremium: boolean("is_premium").default(false),
  monthlyAnalysesUsed: integer("monthly_analyses_used").default(0),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull().default("Analyse sans titre"),
  inputText: text("input_text").notNull(),
  // Audio analysis fields
  audioFilePath: varchar("audio_file_path").notNull().default(""),
  // Path to uploaded audio file
  transcriptionText: text("transcription_text"),
  // Whisper transcription result
  audioProcessingStatus: varchar("audio_processing_status").default("none"),
  // none, processing, completed, failed
  audioDurationMinutes: integer("audio_duration_minutes"),
  // Duration in minutes
  audioFileSize: integer("audio_file_size"),
  // File size in bytes
  // Core analysis
  interestLevel: varchar("interest_level").notNull(),
  // "hot", "warm", "cold"
  interestJustification: text("interest_justification").notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  // 0-100
  // Advanced psychological analysis
  personalityProfile: jsonb("personality_profile"),
  emotionalState: jsonb("emotional_state"),
  // Enhanced objections analysis
  objections: jsonb("objections").notNull(),
  buyingSignals: jsonb("buying_signals"),
  // Strategic recommendations
  nextSteps: jsonb("next_steps"),
  strategicAdvice: text("strategic_advice").notNull(),
  talkingPoints: jsonb("talking_points"),
  // Follow-up optimization
  followUpSubject: text("follow_up_subject").notNull(),
  followUpMessage: text("follow_up_message").notNull(),
  alternativeApproaches: jsonb("alternative_approaches"),
  // Risk management
  riskFactors: jsonb("risk_factors"),
  // Revolutionary AI insights
  advancedInsights: jsonb("advanced_insights"),
  emotionalAnalysis: jsonb("emotional_analysis"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var userMetrics = pgTable("user_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Performance tracking
  totalAnalyses: integer("total_analyses").default(0),
  successfulClosings: integer("successful_closings").default(0),
  averageConfidenceScore: decimal("average_confidence_score", { precision: 5, scale: 2 }).default("0.00"),
  averageClosingProbability: decimal("average_closing_probability", { precision: 5, scale: 2 }).default("0.00"),
  // Skill levels (0-100)
  discoverySkillLevel: integer("discovery_skill_level").default(50),
  objectionHandlingLevel: integer("objection_handling_level").default(50),
  closingSkillLevel: integer("closing_skill_level").default(50),
  followUpSkillLevel: integer("follow_up_skill_level").default(50),
  // Goals and achievements
  monthlyGoals: jsonb("monthly_goals"),
  // Array of goal objects
  achievements: jsonb("achievements"),
  // Array of achievement objects
  // Tracking dates
  lastAnalysisDate: timestamp("last_analysis_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  analyses: many(analyses),
  metrics: many(userMetrics)
}));
var analysesRelations = relations(analyses, ({ one }) => ({
  user: one(users, {
    fields: [analyses.userId],
    references: [users.id]
  })
}));
var userMetricsRelations = relations(userMetrics, ({ one }) => ({
  user: one(users, {
    fields: [userMetrics.userId],
    references: [users.id]
  })
}));
var insertUserMetricsSchema = createInsertSchema(userMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // Reduced for Railway to avoid connection limits
  min: 1,
  // Keep minimum connections ready
  idleTimeoutMillis: 3e4,
  // Reduced for Railway
  connectionTimeoutMillis: 1e4,
  // Reduced timeout for acquiring connections
  // createRetryIntervalMillis: 100, // Retry connection creation quickly
  // Railway specific optimizations
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});
var db = drizzle({ client: pool, schema: schema_exports });
pool.on("error", (err) => {
  console.error("Database pool error:", err);
});
pool.on("connect", (client) => {
  console.log("New database connection established");
});
pool.on("remove", (client) => {
  console.log("Database connection removed from pool");
});
process.on("SIGINT", async () => {
  console.log("\u{1F504} Fermeture gracieuse du pool de base de donn\xE9es...");
  try {
    await pool.end();
    console.log("\u2705 Pool de base de donn\xE9es ferm\xE9 avec succ\xE8s");
  } catch (error) {
    console.error("\u274C Erreur lors de la fermeture du pool:", error);
  }
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("\u{1F504} Fermeture gracieuse du pool de base de donn\xE9es...");
  try {
    await pool.end();
    console.log("\u2705 Pool de base de donn\xE9es ferm\xE9 avec succ\xE8s");
  } catch (error) {
    console.error("\u274C Erreur lors de la fermeture du pool:", error);
  }
  process.exit(0);
});

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUserPremiumStatus(userId, isPremium) {
    const [user] = await db.update(users).set({
      isPremium,
      subscriptionStatus: isPremium ? "active" : "cancelled",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return user;
  }
  async updateUserStripeInfo(userId, stripeCustomerId, stripeSubscriptionId) {
    const [user] = await db.update(users).set({
      stripeCustomerId,
      stripeSubscriptionId,
      isPremium: true,
      subscriptionStatus: "active",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return user;
  }
  async incrementAnalysisCount(userId) {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    const now = /* @__PURE__ */ new Date();
    const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : /* @__PURE__ */ new Date();
    const shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    if (shouldReset) {
      const [updatedUser2] = await db.update(users).set({
        monthlyAnalysesUsed: 1,
        lastResetDate: now,
        updatedAt: now
      }).where(eq(users.id, userId)).returning();
      return updatedUser2;
    }
    const [updatedUser] = await db.update(users).set({
      monthlyAnalysesUsed: (user.monthlyAnalysesUsed || 0) + 1,
      updatedAt: now
    }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async resetMonthlyAnalyses(userId) {
    const [user] = await db.update(users).set({
      monthlyAnalysesUsed: 0,
      lastResetDate: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return user;
  }
  // Analysis operations
  async createAnalysis(analysis) {
    const [newAnalysis] = await db.insert(analyses).values(analysis).returning();
    return newAnalysis;
  }
  async getUserAnalyses(userId, limit = 10) {
    return await db.select().from(analyses).where(eq(analyses.userId, userId)).orderBy(desc(analyses.createdAt)).limit(limit);
  }
  async getAnalysis(id) {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis;
  }
  async getUserByStripeSubscriptionId(subscriptionId) {
    const [user] = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId));
    return user;
  }
  // Metrics operations
  async createUserMetrics(userId) {
    const [metrics] = await db.insert(userMetrics).values({ userId }).returning();
    return metrics;
  }
  async getUserMetrics(userId) {
    const [metrics] = await db.select().from(userMetrics).where(eq(userMetrics.userId, userId));
    return metrics;
  }
  async updateUserMetrics(userId, updates) {
    const [metrics] = await db.update(userMetrics).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userMetrics.userId, userId)).returning();
    return metrics;
  }
};
var storage = new DatabaseStorage();

// server/socialAuth.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPg from "connect-pg-simple";
function getSession() {
  const defaultSessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const extendedSessionTtl = 30 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: extendedSessionTtl,
    // Use extended TTL for store
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      // Set to false for development
      maxAge: defaultSessionTtl
      // Default to 1 week, can be overridden
    }
  });
}

// server/routes.ts
import bcrypt from "bcrypt";

// server/openai.ts
init_audioProcessor();
import OpenAI from "openai";
import fs2 from "fs";
import path2 from "path";
import { createHash as createHash2 } from "crypto";
if (!process.env.OPENAI_API_KEY) {
  if (process.env.NODE_ENV === "production") {
    console.warn("\u26A0\uFE0F OPENAI_API_KEY non d\xE9finie - Les fonctionnalit\xE9s IA seront d\xE9sactiv\xE9es");
  } else {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
}
var openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 6e4,
  // 60 seconds timeout for robust processing
  maxRetries: 3
  // Auto-retry on failure
}) : null;
var AudioProcessor = class {
  static SUPPORTED_FORMATS = [
    ".mp3",
    ".mp4",
    ".mpeg",
    ".mpga",
    ".m4a",
    ".wav",
    ".webm",
    ".flac",
    ".ogg",
    ".opus"
  ];
  static MAX_FILE_SIZE = 25 * 1024 * 1024;
  // 25MB (Whisper limit)
  static MIN_FILE_SIZE = 1024;
  // 1KB minimum
  static validateAudioFile(filePath) {
    if (!fs2.existsSync(filePath)) {
      throw new Error("Fichier audio introuvable");
    }
    const stats = fs2.statSync(filePath);
    const fileSize = stats.size;
    const fileExt = path2.extname(filePath).toLowerCase();
    if (fileSize < this.MIN_FILE_SIZE) {
      throw new Error("Fichier audio trop petit (minimum 1KB)");
    }
    if (fileSize > this.MAX_FILE_SIZE) {
      throw new Error(`Fichier audio trop volumineux (maximum 25MB, re\xE7u ${Math.round(fileSize / 1024 / 1024)}MB)`);
    }
    if (!this.SUPPORTED_FORMATS.includes(fileExt)) {
      throw new Error(`Format audio non support\xE9: ${fileExt}. Formats accept\xE9s: ${this.SUPPORTED_FORMATS.join(", ")}`);
    }
  }
  static generateFileHash(filePath) {
    const fileBuffer = fs2.readFileSync(filePath);
    return createHash2("sha256").update(fileBuffer).digest("hex");
  }
  static estimateDuration(fileSize) {
    return Math.max(1, Math.round(fileSize / (1024 * 1024)));
  }
};
var TextProcessor = class {
  static MIN_TEXT_LENGTH = 10;
  static MAX_TEXT_LENGTH = 1e5;
  // Increased limit
  static CONVERSATION_PATTERNS = [
    /\b(vendeur|commercial|client|prospect|acheteur|représentant)\s*:/gi,
    /\b(moi|vous|nous|je|tu|il|elle)\s*:/gi,
    /\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi
    // Timestamps
  ];
  static preprocessConversation(text2) {
    if (!text2 || typeof text2 !== "string") {
      throw new Error("Texte de conversation invalide");
    }
    const originalLength = text2.length;
    if (originalLength < this.MIN_TEXT_LENGTH) {
      throw new Error(`Texte trop court (minimum ${this.MIN_TEXT_LENGTH} caract\xE8res)`);
    }
    if (originalLength > this.MAX_TEXT_LENGTH) {
      throw new Error(`Texte trop long (maximum ${this.MAX_TEXT_LENGTH} caract\xE8res, re\xE7u ${originalLength})`);
    }
    let cleanedText = text2.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
    const hasTimestamps = /\b\d{1,2}:\d{2}/.test(cleanedText);
    const hasSpeakerLabels = /:/.test(cleanedText) && /\b(vendeur|commercial|client|prospect|moi|vous)\s*:/i.test(cleanedText);
    const speakerMatches = cleanedText.match(/\b\w+\s*:/g) || [];
    const uniqueSpeakers = new Set(speakerMatches.map((s) => s.toLowerCase()));
    const estimatedParticipants = Math.max(2, uniqueSpeakers.size);
    const frenchWords = (cleanedText.match(/\b(le|la|les|un|une|des|et|de|du|dans|sur|avec|pour|par|ce|cette|qui|que|dont|où|oui|non|très|mais|comme|tout|bien|plus|encore|aussi|peut|être|avoir|faire|dire|aller|voir|savoir|nous|vous|ils|elles)\b/gi) || []).length;
    const englishWords = (cleanedText.match(/\b(the|and|or|but|in|on|at|to|for|of|with|by|from|this|that|which|who|what|where|when|why|how|yes|no|very|more|also|can|will|would|could|should|have|has|had|do|does|did|go|come|see|know|think|say|get|make|take|give|find|use|work|try|ask|tell|show|play|run|move|live|feel|seem|become|leave|turn|start|stop|help|talk|walk|look|want|need|like|love|hate|hope|wish|believe|understand|remember|forget|learn|teach|study|read|write|listen|hear|speak|call|answer|open|close|buy|sell|pay|cost|spend|save|win|lose|choose|decide|agree|disagree|accept|refuse|allow|prevent|protect|attack|defend|fight|argue|discuss|explain|describe|compare|contrast|analyze|solve|create|build|destroy|repair|clean|cook|eat|drink|sleep|wake|dream|smile|laugh|cry|sing|dance|drive|ride|fly|swim|jump|run|walk|sit|stand|lie|fall|rise|grow|change|improve|increase|decrease|begin|end|continue|stop|start|finish|complete|succeed|fail|try|attempt|achieve|reach|arrive|leave|return|stay|remain|exist|happen|occur|appear|disappear|seem|look|sound|feel|taste|smell|touch|hold|carry|bring|take|put|place|keep|store|find|lose|search|discover|invent|create)\b/gi) || []).length;
    let language = "fr";
    if (englishWords > frenchWords * 1.5) {
      language = "en";
    } else if (englishWords > frenchWords * 0.3) {
      language = "mixed";
    }
    return {
      cleanedText,
      metadata: {
        originalLength,
        cleanedLength: cleanedText.length,
        hasTimestamps,
        hasSpeakerLabels,
        estimatedParticipants,
        language
      }
    };
  }
};
async function analyzeConversation(conversationText) {
  if (!openai) {
    throw new Error("OpenAI API non configur\xE9e - Impossible d'analyser la conversation");
  }
  const startTime = Date.now();
  try {
    const { cleanedText, metadata } = TextProcessor.preprocessConversation(conversationText);
    console.log(`Processing conversation: ${metadata.cleanedLength} chars, ${metadata.estimatedParticipants} participants, language: ${metadata.language}`);
    const languageInstruction = metadata.language === "en" ? "IMPORTANT: This conversation is in English. Provide analysis in French but acknowledge the original language." : metadata.language === "mixed" ? "IMPORTANT: This is a multilingual conversation. Analyze language switches as psychological indicators." : "Conversation en fran\xE7ais d\xE9tect\xE9e.";
    const participantContext = metadata.estimatedParticipants > 2 ? `CONTEXTE: Conversation multi-participants (${metadata.estimatedParticipants} personnes d\xE9tect\xE9es). Analyse la dynamique de groupe.` : "CONTEXTE: Dialogue commercial standard (2 participants).";
    const prompt = `Tu es l'analyste commercial le plus avanc\xE9 au monde, combinant l'expertise de:
    - Grant Cardone (psychologie de vente agressive)
    - Jordan Belfort (persuasion et closing)
    - Daniel Kahneman (biais cognitifs et prise de d\xE9cision)
    - Robert Cialdini (influence et persuasion)
    - Dale Carnegie (relations humaines)
    - Neil Rackham (SPIN Selling)
    - Challenger Sale methodology
    - Sandler Sales methodology

${languageInstruction}
${participantContext}

M\xC9TADONN\xC9ES DE LA CONVERSATION :
- Longueur: ${metadata.cleanedLength} caract\xE8res
- Participants estim\xE9s: ${metadata.estimatedParticipants}
- Marqueurs temporels d\xE9tect\xE9s: ${metadata.hasTimestamps ? "Oui" : "Non"}
- Labels d'interlocuteurs: ${metadata.hasSpeakerLabels ? "Oui" : "Non"}
- Langue d\xE9tect\xE9e: ${metadata.language}

CONVERSATION \xC0 ANALYSER :
${cleanedText}

ANALYSE COMMERCIALE R\xC9VOLUTIONNAIRE REQUISE (JSON uniquement) :

\u{1F3AF} ANALYSE PRIMAIRE:
1. \xC9VALUATION NIVEAU D'INT\xC9R\xCAT (hot/warm/cold) avec score de confiance pr\xE9cis (0-100)
2. PROFIL PSYCHOLOGIQUE DISC complet (Dominant/Influent/Stable/Consciencieux) avec sous-types
3. \xC9TAT \xC9MOTIONNEL multi-dimensionnel avec intensit\xE9 et triggers
4. OBJECTIONS PR\xC9DICTIVES avec probabilit\xE9s calcul\xE9es et contre-strat\xE9gies
5. SIGNAUX D'ACHAT micro et macro avec scoring de force

\u{1F9E0} ANALYSE PSYCHOLOGIQUE AVANC\xC9E:
6. BIAIS COGNITIFS d\xE9tect\xE9s (anchoring, loss aversion, social proof, etc.)
7. TRIGGERS \xC9MOTIONNELS identifi\xE9s (peur, prestige, urgence, appartenance)
8. STYLE DE COMMUNICATION pr\xE9f\xE9r\xE9 et adaptation requise
9. NIVEAU D'AUTORIT\xC9 et processus de d\xE9cision
10. MOTIVATIONS CACH\xC9ES et besoins non exprim\xE9s

\u{1F680} STRAT\xC9GIE COMMERCIALE:
11. \xC9TAPES SUIVANTES tactiques avec timing optimal
12. CONSEILS STRAT\xC9GIQUES multi-niveaux
13. POINTS DE LEVIER psychologiques \xE0 exploiter
14. MESSAGE DE RELANCE personnalis\xE9 avec A/B variants
15. APPROCHES ALTERNATIVES selon r\xE9sistances
16. FACTEURS DE RISQUE avec plans de mitigation
17. CLOSING STRATEGIES adapt\xE9es au profil

Structure JSON EXACTE obligatoire :
{
  "interestLevel": "hot|warm|cold",
  "interestJustification": "analyse psychologique d\xE9taill\xE9e...",
  "confidenceScore": 85,
  "personalityProfile": {
    "type": "analytical|driver|expressive|amiable",
    "traits": ["trait1", "trait2", "trait3"],
    "communicationStyle": "description du style de communication pr\xE9f\xE9r\xE9"
  },
  "emotionalState": {
    "primary": "excited|cautious|frustrated|neutral|enthusiastic",
    "intensity": 7,
    "indicators": ["indicateur1", "indicateur2"]
  },
  "objections": [
    {
      "type": "prix|timing|autorit\xE9|besoin|confiance|budget|concurrent",
      "intensity": "high|medium|low",
      "description": "description de l'objection",
      "responseStrategy": "strat\xE9gie de r\xE9ponse sp\xE9cifique",
      "probability": 75
    }
  ],
  "buyingSignals": [
    {
      "signal": "signal d\xE9tect\xE9",
      "strength": "strong|medium|weak",
      "description": "explication du signal"
    }
  ],
  "nextSteps": [
    {
      "action": "action sp\xE9cifique",
      "priority": "high|medium|low",
      "timeframe": "d\xE9lai recommand\xE9",
      "reasoning": "justification de l'action"
    }
  ],
  "strategicAdvice": "conseil strat\xE9gique avanc\xE9 bas\xE9 sur la psychologie comportementale...",
  "talkingPoints": ["point1", "point2", "point3"],
  "followUpSubject": "objet email optimis\xE9 psychologiquement",
  "followUpMessage": "message personnalis\xE9 et persuasif",
  "alternativeApproaches": [
    {
      "approach": "nom de l'approche",
      "when": "quand l'utiliser",
      "message": "message alternatif"
    }
  ],
  "riskFactors": [
    {
      "risk": "facteur de risque",
      "impact": "high|medium|low",
      "mitigation": "strat\xE9gie de mitigation"
    }
  ]
}`;
    const systemPrompt = `Tu es l'ANALYSTE COMMERCIAL LE PLUS AVANC\xC9 AU MONDE, combinant:
    
    \u{1F3AF} EXPERTISE TECHNIQUE:
    - Psychologie comportementale (Kahneman, Tversky)
    - Neurosciences commerciales (neuromarketing)
    - Analyse conversationnelle linguistique
    - Intelligence \xE9motionnelle avanc\xE9e
    - Mod\xE9lisation pr\xE9dictive des comportements d'achat
    
    \u{1F4CA} M\xC9THODOLOGIES:
    - DISC + Big Five + Myers-Briggs synthesis
    - SPIN Selling + Challenger Sale integration
    - Cialdini's 7 principles of persuasion
    - Loss aversion et prospect theory
    - Social proof et autorit\xE9 dynamics
    
    \u26A1 MISSION: Produire l'analyse commerciale la plus pr\xE9cise et actionable possible.
    R\xC9PONSE: JSON valide UNIQUEMENT, structure EXACTE requise, Z\xC9RO texte externe.`;
    const response = await openai?.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      // Optimal balance between creativity and consistency
      max_tokens: 4096,
      // Maximum for detailed analysis
      top_p: 0.9,
      // Focus on high-probability tokens
      frequency_penalty: 0.1,
      // Reduce repetition
      presence_penalty: 0.1
      // Encourage diverse insights
    });
    const rawContent = response?.choices[0].message.content;
    if (!rawContent) {
      throw new Error("R\xE9ponse vide de l'IA");
    }
    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", rawContent);
      throw new Error("R\xE9ponse IA non valide (JSON malform\xE9)");
    }
    const requiredFields = [
      "interestLevel",
      "interestJustification",
      "confidenceScore",
      "personalityProfile",
      "emotionalState",
      "objections",
      "buyingSignals",
      "nextSteps",
      "strategicAdvice",
      "talkingPoints",
      "followUpSubject",
      "followUpMessage",
      "alternativeApproaches",
      "riskFactors"
    ];
    const missingFields = requiredFields.filter((field) => !(field in result));
    if (missingFields.length > 0) {
      console.warn(`Missing fields detected: ${missingFields.join(", ")}`);
      for (const field of missingFields) {
        switch (field) {
          case "interestLevel":
            result[field] = "warm";
            break;
          case "confidenceScore":
            result[field] = 75;
            break;
          case "objections":
          case "buyingSignals":
          case "nextSteps":
          case "talkingPoints":
          case "alternativeApproaches":
          case "riskFactors":
            result[field] = [];
            break;
          default:
            result[field] = `Analyse ${field} en cours de traitement`;
        }
      }
    }
    const processingTime = Date.now() - startTime;
    const confidenceFactors = [
      `Longueur texte: ${metadata.cleanedLength} chars`,
      `Participants: ${metadata.estimatedParticipants}`,
      `Langue: ${metadata.language}`,
      `Temps de traitement: ${processingTime}ms`
    ];
    return {
      ...result,
      processingMetadata: {
        textLength: metadata.cleanedLength,
        language: metadata.language,
        participants: metadata.estimatedParticipants,
        processingTime,
        confidenceFactors
      }
    };
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    throw new Error("\xC9chec de l'analyse de conversation: " + error.message);
  }
}
async function transcribeAudio(audioFilePath) {
  if (!openai) {
    throw new Error("OpenAI API non configur\xE9e - Impossible de transcrire l'audio");
  }
  const startTime = Date.now();
  try {
    const validation = AdvancedAudioProcessor.validateAudioFile(audioFilePath);
    if (!validation.isValid) {
      throw new Error(`Fichier audio invalide: ${validation.issues.join(", ")}`);
    }
    const stats = fs2.statSync(audioFilePath);
    const fileSizeInBytes = stats.size;
    const fileFormat = path2.extname(audioFilePath).toLowerCase();
    const fileHash = AdvancedAudioProcessor.generateFileHash(audioFilePath);
    console.log(`\u{1F3B5} TRANSCRIPTION AVANC\xC9E INITI\xC9E:`);
    console.log(`   Fichier: ${path2.basename(audioFilePath)}`);
    console.log(`   Taille: ${Math.round(fileSizeInBytes / 1024 / 1024 * 100) / 100}MB`);
    console.log(`   Format: ${fileFormat}`);
    console.log(`   Hash: ${fileHash.substring(0, 8)}...`);
    const transcriptionResults = [];
    console.log("\u{1F504} Pass 1: Transcription fran\xE7ais standard...");
    const frenchResult = await performTranscription(audioFilePath, {
      language: "fr",
      temperature: 0,
      // Maximum accuracy
      response_format: "verbose_json"
    });
    transcriptionResults.push({ method: "french", result: frenchResult });
    console.log("\u{1F504} Pass 2: D\xE9tection automatique de langue...");
    const autoResult = await performTranscription(audioFilePath, {
      temperature: 0.1,
      response_format: "verbose_json"
    });
    transcriptionResults.push({ method: "auto", result: autoResult });
    console.log("\u{1F504} Pass 3: Transcription contextuelle commerciale...");
    const contextualResult = await performTranscription(audioFilePath, {
      language: "fr",
      temperature: 0.2,
      response_format: "verbose_json",
      prompt: "Conversation commerciale entre vendeur et prospect. Termes business, prix, n\xE9gociation, closing, objections."
    });
    transcriptionResults.push({ method: "contextual", result: contextualResult });
    const bestResult = selectBestTranscription(transcriptionResults);
    const confidence = calculateTranscriptionConfidence(transcriptionResults);
    const qualityScore = assessAudioQuality(bestResult.result, fileSizeInBytes);
    const processingTime = Date.now() - startTime;
    console.log(`\u2705 TRANSCRIPTION TERMIN\xC9E:`);
    console.log(`   Dur\xE9e: ${Math.round(bestResult.result.duration || 0)}s`);
    console.log(`   Confiance: ${Math.round(confidence * 100)}%`);
    console.log(`   Qualit\xE9: ${Math.round(qualityScore * 100)}%`);
    console.log(`   M\xE9thode optimale: ${bestResult.method}`);
    console.log(`   Temps de traitement: ${processingTime}ms`);
    return {
      text: bestResult.result.text,
      duration: bestResult.result.duration || 0,
      confidence,
      segments: bestResult.result.segments || void 0,
      processingMetadata: {
        fileSize: fileSizeInBytes,
        format: fileFormat,
        processingTime,
        qualityScore,
        transcriptionMethod: bestResult.method
      }
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("\u274C ERREUR TRANSCRIPTION AUDIO:", error);
    if (error instanceof Error) {
      if (error.message.includes("file not found")) {
        throw new Error("Fichier audio introuvable. V\xE9rifiez que le fichier existe.");
      } else if (error.message.includes("format")) {
        throw new Error("Format audio non support\xE9. Utilisez MP3, WAV, M4A, ou FLAC.");
      } else if (error.message.includes("size")) {
        throw new Error("Taille de fichier invalide. Maximum 25MB, minimum 1KB.");
      } else if (error.message.includes("timeout")) {
        throw new Error("D\xE9lai de transcription d\xE9pass\xE9. Essayez avec un fichier plus court.");
      } else if (error.message.includes("quota")) {
        throw new Error("Limite API atteinte. R\xE9essayez dans quelques minutes.");
      }
    }
    throw new Error(`\xC9chec de la transcription audio avanc\xE9e: ${error.message} (temps: ${processingTime}ms)`);
  }
}
async function performTranscription(filePath, options) {
  const audioReadStream = fs2.createReadStream(filePath);
  return await openai?.audio.transcriptions.create({
    file: audioReadStream,
    model: "whisper-1",
    ...options
  });
}
function selectBestTranscription(results) {
  let bestScore = -1;
  let bestResult = results[0];
  for (const { method, result } of results) {
    let score = 0;
    const textLength = result.text?.length || 0;
    score += Math.min(textLength / 1e3, 5);
    const segmentCount = result.segments?.length || 0;
    score += Math.min(segmentCount / 10, 3);
    if (method === "contextual") score += 2;
    if (method === "french") score += 1;
    if (textLength < 10) score = 0;
    if (score > bestScore) {
      bestScore = score;
      bestResult = { method, result };
    }
  }
  return bestResult;
}
function calculateTranscriptionConfidence(results) {
  if (results.length < 2) return 0.7;
  const texts = results.map((r) => r.result.text?.toLowerCase() || "");
  let totalSimilarity = 0;
  let comparisons = 0;
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const similarity = calculateTextSimilarity(texts[i], texts[j]);
      totalSimilarity += similarity;
      comparisons++;
    }
  }
  const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0.5;
  return Math.max(0.5, Math.min(1, avgSimilarity + 0.3));
}
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = Array.from(set1).filter((word) => set2.has(word));
  const union = Array.from(/* @__PURE__ */ new Set([...words1, ...words2]));
  return intersection.length / union.length;
}
function assessAudioQuality(transcription, fileSize) {
  let quality = 0.5;
  const sizeMB = fileSize / (1024 * 1024);
  if (sizeMB > 10) quality += 0.2;
  else if (sizeMB > 5) quality += 0.1;
  const textLength = transcription.text?.length || 0;
  if (textLength > 1e3) quality += 0.2;
  else if (textLength > 500) quality += 0.1;
  const segments = transcription.segments?.length || 0;
  if (segments > 20) quality += 0.1;
  return Math.min(1, quality);
}
async function analyzeAudioConversation(transcriptionText, audioMetadata) {
  if (!openai) {
    throw new Error("OpenAI API non configur\xE9e - Impossible d'analyser l'audio");
  }
  try {
    const enhancedPrompt = `Tu es le meilleur expert mondial en psychologie commerciale, analyse comportementale et strat\xE9gie de vente. Tu combines l'expertise de Grant Cardone, Jordan Belfort, et Daniel Kahneman.

CONVERSATION TRANSCRITE (AUDIO) \xC0 ANALYSER :
${transcriptionText}

${audioMetadata ? `
M\xC9TADONN\xC9ES AUDIO :
- Dur\xE9e: ${Math.round(audioMetadata.duration / 60)} minutes
- Taille du fichier: ${Math.round(audioMetadata.fileSize / 1024 / 1024)} MB
` : ""}

ANALYSE COMPL\xC8TE REQUISE pour conversation AUDIO (JSON uniquement) :

ATTENTION: Cette conversation provient d'un enregistrement audio. Analyse les nuances vocales, pauses, h\xE9sitations, et dynamiques conversationnelles qui peuvent r\xE9v\xE9ler des insights suppl\xE9mentaires.

1. \xC9VALUATION DU NIVEAU D'INT\xC9R\xCAT (hot/warm/cold) avec score de confiance (0-100)
2. PROFIL PSYCHOLOGIQUE du prospect avec traits comportementaux
3. \xC9TAT \xC9MOTIONNEL d\xE9tect\xE9 avec intensit\xE9 et indicateurs vocaux
4. OBJECTIONS PROBABLES avec strat\xE9gies de r\xE9ponse
5. SIGNAUX D'ACHAT identifi\xE9s avec force du signal
6. \xC9TAPES SUIVANTES recommand\xE9es avec priorit\xE9s
7. CONSEILS STRAT\xC9GIQUES avanc\xE9s
8. POINTS CL\xC9S \xE0 aborder dans la suite
9. MESSAGE DE RELANCE optimis\xE9
10. APPROCHES ALTERNATIVES selon diff\xE9rents sc\xE9narios
11. FACTEURS DE RISQUE et mitigations
12. INSIGHTS SP\xC9CIFIQUES \xC0 L'AUDIO (rythme, pauses, ratio de parole)

Structure JSON EXACTE obligatoire (inclut audioInsights) :
{
  "interestLevel": "hot|warm|cold",
  "interestJustification": "analyse psychologique d\xE9taill\xE9e incluant les nuances vocales...",
  "confidenceScore": 85,
  "personalityProfile": {
    "type": "analytical|driver|expressive|amiable",
    "traits": ["trait1", "trait2", "trait3"],
    "communicationStyle": "description du style de communication pr\xE9f\xE9r\xE9"
  },
  "emotionalState": {
    "primary": "excited|cautious|frustrated|neutral|enthusiastic",
    "intensity": 7,
    "indicators": ["indicateur1 vocal", "indicateur2 vocal"]
  },
  "objections": [
    {
      "type": "prix|timing|autorit\xE9|besoin|confiance|budget|concurrent",
      "intensity": "high|medium|low",
      "description": "description de l'objection",
      "responseStrategy": "strat\xE9gie de r\xE9ponse sp\xE9cifique",
      "probability": 75
    }
  ],
  "buyingSignals": [
    {
      "signal": "signal d\xE9tect\xE9",
      "strength": "strong|medium|weak",
      "description": "explication du signal"
    }
  ],
  "nextSteps": [
    {
      "action": "action sp\xE9cifique",
      "priority": "high|medium|low",
      "timeframe": "d\xE9lai recommand\xE9",
      "reasoning": "justification de l'action"
    }
  ],
  "strategicAdvice": "conseil strat\xE9gique avanc\xE9 bas\xE9 sur la psychologie comportementale et les nuances audio...",
  "talkingPoints": ["point1", "point2", "point3"],
  "followUpSubject": "objet email optimis\xE9 psychologiquement",
  "followUpMessage": "message personnalis\xE9 et persuasif",
  "alternativeApproaches": [
    {
      "approach": "nom de l'approche",
      "when": "quand l'utiliser",
      "message": "message alternatif"
    }
  ],
  "riskFactors": [
    {
      "risk": "facteur de risque",
      "impact": "high|medium|low",
      "mitigation": "strat\xE9gie de mitigation"
    }
  ],
  "audioInsights": {
    "conversationPacing": "slow|normal|fast",
    "silencePeriods": ["description des moments de silence significatifs"],
    "speakingRatio": {
      "seller": 60,
      "prospect": 40
    },
    "audioQualityNotes": ["note1 sur la qualit\xE9 audio", "note2"]
  }
}`;
    const response = await openai?.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es le meilleur analyste commercial au monde, expert en psychologie comportementale et analyse de conversations audio. R\xE9ponds UNIQUEMENT en JSON valide, structure EXACTE requise."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4500
      // Increased for audio insights
    });
    const result = JSON.parse(response?.choices[0].message.content || "{}");
    const requiredFields = [
      "interestLevel",
      "interestJustification",
      "confidenceScore",
      "personalityProfile",
      "emotionalState",
      "objections",
      "buyingSignals",
      "nextSteps",
      "strategicAdvice",
      "talkingPoints",
      "followUpSubject",
      "followUpMessage",
      "alternativeApproaches",
      "riskFactors",
      "audioInsights"
    ];
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return result;
  } catch (error) {
    console.error("Error analyzing audio conversation:", error);
    throw new Error("\xC9chec de l'analyse de conversation audio: " + error.message);
  }
}

// server/advancedAnalytics.ts
import OpenAI2 from "openai";
var openai2 = new OpenAI2({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});
async function generateAdvancedInsights(conversationText) {
  try {
    const prompt = `Tu es le meilleur analyste commercial IA au monde, expert en neuro-science commerciale et psychologie comportementale. Analyse cette conversation commerciale avec la pr\xE9cision d'un super-ordinateur :

CONVERSATION :
${conversationText}

ANALYSE ULTRA-AVANC\xC9E REQUISE (JSON UNIQUEMENT) :

1. SCORE DE QUALIT\xC9 CONVERSATION (0-100) bas\xE9 sur l'efficacit\xE9 commerciale
2. ANALYSE DE TIMING COMMERCIAL avec phase actuelle et recommandations de progression
3. MOMENTS CL\xC9S CRITIQUES d\xE9tect\xE9s dans la conversation 
4. ANALYSE COMPETITIVE avec d\xE9tection de concurrents et strat\xE9gies
5. MATURIT\xC9 DU PROSPECT avec niveau de pr\xE9paration \xE0 l'achat
6. PR\xC9DICTIONS IA avec probabilit\xE9 de closing et strat\xE9gies optimales

STRUCTURE JSON OBLIGATOIRE :
{
  "conversationQualityScore": 85,
  "salesTiming": {
    "currentPhase": "d\xE9couverte|pr\xE9sentation|n\xE9gociation|closing|suivi",
    "nextPhaseRecommendation": "strat\xE9gie pour passer \xE0 la phase suivante",
    "timeToClose": "imm\xE9diat|court|moyen|long",
    "urgencyIndicators": ["indicateur1", "indicateur2"]
  },
  "keyMoments": [
    {
      "moment": "moment cl\xE9 d\xE9tect\xE9",
      "significance": "critique|important|notable",
      "action": "action recommand\xE9e"
    }
  ],
  "competitiveAnalysis": {
    "competitorsDetected": ["concurrent1", "concurrent2"],
    "competitiveAdvantages": ["avantage1", "avantage2"],
    "threatLevel": "low|medium|high",
    "counterStrategies": ["strat\xE9gie1", "strat\xE9gie2"]
  },
  "prospectMaturity": {
    "decisionMakingStage": "reconnaissance|\xE9valuation|comparaison|d\xE9cision",
    "readinessScore": 75,
    "missingElements": ["\xE9l\xE9ment1", "\xE9l\xE9ment2"]
  },
  "predictions": {
    "closingProbability": 65,
    "bestApproachVector": "meilleure approche recommand\xE9e",
    "predictedObjections": [
      {
        "objection": "objection pr\xE9dite",
        "probability": 70,
        "preventiveStrategy": "strat\xE9gie pr\xE9ventive"
      }
    ]
  }
}`;
    const response = await openai2.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es le meilleur analyste commercial IA au monde. G\xE9n\xE8re uniquement du JSON valide selon la structure exacte demand\xE9e."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 3e3
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    const requiredFields = [
      "conversationQualityScore",
      "salesTiming",
      "keyMoments",
      "competitiveAnalysis",
      "prospectMaturity",
      "predictions"
    ];
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Champ requis manquant: ${field}`);
      }
    }
    return result;
  } catch (error) {
    console.error("Erreur lors de l'analyse avanc\xE9e:", error);
    throw new Error("\xC9chec de l'analyse avanc\xE9e: " + error.message);
  }
}
async function analyzeEmotionalJourney(conversationText) {
  try {
    const prompt = `Analyse le parcours \xE9motionnel de cette conversation commerciale :

${conversationText}

Trace la trajectoire \xE9motionnelle du prospect et identifie les d\xE9clencheurs \xE9motionnels.

JSON structure:
{
  "emotionalTrajectory": [
    {
      "phase": "d\xE9but de conversation",
      "emotion": "curiosit\xE9",
      "intensity": 7,
      "triggers": ["mention du probl\xE8me", "solution propos\xE9e"]
    }
  ],
  "overallSentiment": 65,
  "emotionalTriggers": ["trigger1", "trigger2"],
  "recommendedEmotionalApproach": "approche \xE9motionnelle recommand\xE9e"
}`;
    const response = await openai2.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Tu es un expert en psychologie \xE9motionnelle commerciale." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Erreur analyse \xE9motionnelle:", error);
    throw error;
  }
}

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the public object search paths.
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path6) => path6.trim()).filter((path6) => path6.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object from the search paths.
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `private, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Gets the upload URL for an audio file
  async getAudioUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const audioId = randomUUID();
    const fullPath = `${privateObjectDir}/audio/${audioId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
      // 15 minutes
    });
  }
  // Gets the audio file from the object path.
  async getAudioFile(objectPath) {
    if (!objectPath.startsWith("/audio/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const audioId = parts.slice(1).join("/");
    let audioDir = this.getPrivateObjectDir();
    if (!audioDir.endsWith("/")) {
      audioDir = `${audioDir}/`;
    }
    const audioObjectPath = `${audioDir}${objectPath.slice(1)}`;
    const { bucketName, objectName } = parseObjectPath(audioObjectPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const audioFile = bucket.file(objectName);
    const [exists] = await audioFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return audioFile;
  }
  // Downloads an audio file to a local temporary path for processing
  async downloadAudioToTemp(audioFile) {
    const fs6 = __require("fs");
    const tempPath = `/tmp/audio_${randomUUID()}.tmp`;
    return new Promise((resolve, reject) => {
      const writeStream = fs6.createWriteStream(tempPath);
      const readStream = audioFile.createReadStream();
      readStream.on("error", reject);
      writeStream.on("error", reject);
      writeStream.on("finish", () => resolve(tempPath));
      readStream.pipe(writeStream);
    });
  }
  normalizeAudioPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let audioDir = this.getPrivateObjectDir();
    if (!audioDir.endsWith("/")) {
      audioDir = `${audioDir}/`;
    }
    if (!rawObjectPath.startsWith(audioDir)) {
      return rawObjectPath;
    }
    const audioId = rawObjectPath.slice(audioDir.length);
    return `/audio/${audioId}`;
  }
};
function parseObjectPath(path6) {
  if (!path6.startsWith("/")) {
    path6 = `/${path6}`;
  }
  const pathParts = path6.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/directAudioAnalysis.ts
import fs3 from "fs";
import path3 from "path";
import multer from "multer";
init_audioProcessor();
var storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "/tmp/leadmirror-uploads";
    if (!fs3.existsSync(uploadDir)) {
      fs3.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp2 = Date.now();
    const ext = path3.extname(file.originalname);
    const baseName = path3.basename(file.originalname, ext);
    cb(null, `${baseName}_${timestamp2}${ext}`);
  }
});
var fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "audio/mpeg",
    // MP3
    "audio/wav",
    // WAV
    "audio/m4a",
    // M4A
    "audio/mp4",
    // MP4 audio
    "audio/flac",
    // FLAC
    "audio/ogg",
    // OGG
    "audio/webm",
    // WebM audio
    "audio/aac",
    // AAC
    "audio/x-m4a"
    // Alternative M4A mime
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format audio non support\xE9: ${file.mimetype}. Formats accept\xE9s: MP3, WAV, M4A, FLAC, OGG, AAC`));
  }
};
var audioUpload = multer({
  storage: storage2,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
    // 25MB limit (Whisper API limit)
    files: 1
    // Only one file at a time
  }
});
var DirectAudioAnalysisService = class {
  static async processDirectAudioUpload(file) {
    const startTime = Date.now();
    try {
      console.log("\u{1F3B5} ANALYSE AUDIO DIRECTE R\xC9VOLUTIONNAIRE:", {
        fileName: file.originalname,
        size: `${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`,
        mimetype: file.mimetype
      });
      const validation = AdvancedAudioProcessor.validateAudioFile(file.path);
      if (!validation.isValid) {
        throw new Error(`Fichier audio invalide: ${validation.issues.join(", ")}`);
      }
      const audioMetadata = await AdvancedAudioProcessor.extractAudioMetadata(file.path);
      console.log("\u{1F4CA} M\xE9tadonn\xE9es extraites:", audioMetadata);
      const qualityAssessment = AdvancedAudioProcessor.assessAudioQuality(audioMetadata);
      console.log(`\u{1F50D} Score qualit\xE9: ${Math.round(qualityAssessment.score * 100)}%`);
      if (qualityAssessment.issues.length > 0) {
        console.warn("\u26A0\uFE0F Probl\xE8mes d\xE9tect\xE9s:", qualityAssessment.issues);
      }
      const optimization = await AdvancedAudioProcessor.optimizeAudioForTranscription(file.path);
      console.log("\u{1F527} Optimisations appliqu\xE9es:", optimization.optimizations);
      console.log("\u{1F680} Lancement transcription multi-passes...");
      const transcriptionResult = await transcribeAudio(optimization.optimizedPath);
      console.log(`\u2705 Transcription r\xE9ussie:`);
      console.log(`   Texte: ${transcriptionResult.text.length} caract\xE8res`);
      console.log(`   Confiance: ${Math.round(transcriptionResult.confidence * 100)}%`);
      console.log(`   Dur\xE9e: ${Math.round(transcriptionResult.duration)}s`);
      console.log(`   M\xE9thode: ${transcriptionResult.processingMetadata.transcriptionMethod}`);
      this.cleanupTempFiles([file.path, optimization.optimizedPath]);
      AdvancedAudioProcessor.cleanup();
      const totalProcessingTime = Date.now() - startTime;
      console.log(`\u{1F3AF} ANALYSE DIRECTE TERMIN\xC9E: ${totalProcessingTime}ms`);
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
      console.error("\u274C ERREUR ANALYSE AUDIO DIRECTE:", error);
      this.cleanupTempFiles([file.path]);
      AdvancedAudioProcessor.cleanup();
      throw error;
    }
  }
  static cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        if (fs3.existsSync(filePath)) {
          fs3.unlinkSync(filePath);
          console.log(`\u{1F5D1}\uFE0F Fichier temporaire supprim\xE9: ${path3.basename(filePath)}`);
        }
      } catch (error) {
        console.warn(`\u26A0\uFE0F Impossible de supprimer le fichier temporaire: ${filePath}`, error);
      }
    }
  }
  // Validate audio file on upload
  static validateAudioFile(file) {
    const issues = [];
    if (file.size > 25 * 1024 * 1024) {
      issues.push(`Fichier trop volumineux: ${Math.round(file.size / 1024 / 1024)}MB (maximum 25MB)`);
    }
    if (file.size < 1024) {
      issues.push(`Fichier trop petit: ${file.size} bytes (minimum 1KB)`);
    }
    const allowedExtensions = [".mp3", ".wav", ".m4a", ".mp4", ".flac", ".ogg", ".webm", ".aac"];
    const fileExt = path3.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      issues.push(`Extension non support\xE9e: ${fileExt}. Extensions accept\xE9es: ${allowedExtensions.join(", ")}`);
    }
    return {
      isValid: issues.length === 0,
      issues
    };
  }
  // Error handler for multer
  static handleUploadError(error) {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return {
          message: "Fichier trop volumineux. Taille maximum autoris\xE9e: 25MB",
          code: 400
        };
      } else if (error.code === "LIMIT_FILE_COUNT") {
        return {
          message: "Trop de fichiers. Un seul fichier audio autoris\xE9",
          code: 400
        };
      } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return {
          message: "Champ de fichier inattendu",
          code: 400
        };
      }
    }
    if (error.message && error.message.includes("Format audio non support\xE9")) {
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
};
process.on("exit", () => {
  try {
    const uploadDir = "/tmp/leadmirror-uploads";
    if (fs3.existsSync(uploadDir)) {
      const files = fs3.readdirSync(uploadDir);
      for (const file of files) {
        const filePath = path3.join(uploadDir, file);
        fs3.unlinkSync(filePath);
      }
      fs3.rmdirSync(uploadDir);
      console.log("\u{1F9F9} Dossier temporaire d'upload nettoy\xE9");
    }
  } catch (error) {
    console.warn("\u26A0\uFE0F Erreur nettoyage dossier upload:", error);
  }
});
process.on("SIGINT", () => {
  DirectAudioAnalysisService;
  process.exit();
});
process.on("SIGTERM", () => {
  DirectAudioAnalysisService;
  process.exit();
});

// server/routes.ts
import fs4 from "fs";
if (!process.env.STRIPE_SECRET_KEY) {
  if (process.env.NODE_ENV === "production") {
    console.warn("\u26A0\uFE0F STRIPE_SECRET_KEY non d\xE9finie - Les fonctionnalit\xE9s de paiement seront d\xE9sactiv\xE9es");
  } else {
    throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
  }
}
var stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
var asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
var validateRequired = (fields) => (req, res, next) => {
  const missing = fields.filter((field) => !req.body[field]);
  if (missing.length > 0) {
    return res.status(400).json({
      message: `Champs requis manquants: ${missing.join(", ")}`
    });
  }
  next();
};
async function registerRoutes(app2) {
  app2.use(getSession());
  app2.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development",
      message: "API is running"
    });
  });
  app2.get("/", (req, res) => {
    res.json({
      message: "LeadMirror API is running",
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };
  app2.post("/api/auth/register", validateRequired(["email", "password"]), asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Un compte existe d\xE9j\xE0 avec cet email" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName
    });
    req.session.userId = user.id;
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1e3;
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
  app2.post("/api/auth/login", validateRequired(["email", "password"]), asyncHandler(async (req, res) => {
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
    req.session.userId = user.id;
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1e3;
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
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "D\xE9connexion r\xE9ussie" });
    });
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouv\xE9" });
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
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration de l'utilisateur" });
    }
  });
  app2.post("/api/activate-premium", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.updateUserPremiumStatus(req.session.userId, true);
      res.json({
        message: "Premium activ\xE9 avec succ\xE8s",
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
  app2.patch("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { firstName, lastName } = req.body;
      const user = await storage.upsertUser({
        id: userId,
        firstName,
        lastName
      });
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.post("/api/subscription/cancel", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.isPremium) {
        const updatedUser = await storage.updateUserPremiumStatus(userId, false);
        res.json({
          message: "Votre abonnement premium a \xE9t\xE9 annul\xE9 avec succ\xE8s.",
          user: updatedUser
        });
      } else {
        return res.status(400).json({ message: "Aucun abonnement premium actif trouv\xE9" });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Impossible d'annuler l'abonnement" });
    }
  });
  app2.post("/api/direct-audio-upload", isAuthenticated, audioUpload.single("audio"), async (req, res) => {
    const startTime = Date.now();
    try {
      const userId = req.session.userId;
      if (!req.file) {
        return res.status(400).json({ message: "Fichier audio requis" });
      }
      const validation = DirectAudioAnalysisService.validateAudioFile(req.file);
      if (!validation.isValid) {
        return res.status(400).json({
          message: "Fichier audio invalide",
          issues: validation.issues
        });
      }
      const analysisResult = await DirectAudioAnalysisService.processDirectAudioUpload(req.file);
      const totalTime = Date.now() - startTime;
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
      console.error("\u274C ERREUR UPLOAD AUDIO DIRECT:", error);
      const errorResult = DirectAudioAnalysisService.handleUploadError(error);
      res.status(errorResult.code).json({
        message: errorResult.message,
        processingTime,
        error: process.env.NODE_ENV === "development" ? {
          stack: error instanceof Error ? error.stack : void 0,
          details: error
        } : void 0
      });
    }
  });
  app2.post("/api/audio/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getAudioUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting audio upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });
  app2.post("/api/audio/transcribe", isAuthenticated, async (req, res) => {
    const startTime = Date.now();
    try {
      const { audioURL, fileName, fileSize, duration } = req.body;
      const userId = req.session.userId;
      if (!audioURL) {
        return res.status(400).json({ message: "URL audio requise" });
      }
      const objectStorageService = new ObjectStorageService();
      const audioPath = objectStorageService.normalizeAudioPath(audioURL);
      const audioFile = await objectStorageService.getAudioFile(audioPath);
      const tempAudioPath = await objectStorageService.downloadAudioToTemp(audioFile);
      try {
        const { AdvancedAudioProcessor: AdvancedAudioProcessor2 } = await Promise.resolve().then(() => (init_audioProcessor(), audioProcessor_exports));
        const validation = AdvancedAudioProcessor2.validateAudioFile(tempAudioPath);
        if (!validation.isValid) {
          if (fs4.existsSync(tempAudioPath)) {
            fs4.unlinkSync(tempAudioPath);
          }
          return res.status(400).json({
            message: "Fichier audio invalide",
            issues: validation.issues
          });
        }
        const audioMetadata = await AdvancedAudioProcessor2.extractAudioMetadata(tempAudioPath);
        console.log("\u{1F4CA} M\xE9tadonn\xE9es extraites:", audioMetadata);
        const qualityAssessment = AdvancedAudioProcessor2.assessAudioQuality(audioMetadata);
        console.log(`\u{1F50D} Qualit\xE9 audio: ${Math.round(qualityAssessment.score * 100)}%`);
        const optimization = await AdvancedAudioProcessor2.optimizeAudioForTranscription(tempAudioPath);
        console.log("\u{1F527} Optimisations:", optimization.optimizations);
        console.log("\u{1F680} Lancement transcription multi-passes...");
        const transcriptionResult = await transcribeAudio(optimization.optimizedPath);
        console.log(`\u2705 Transcription termin\xE9e: ${transcriptionResult.text.length} chars, confiance: ${Math.round(transcriptionResult.confidence * 100)}%`);
        if (fs4.existsSync(tempAudioPath)) {
          fs4.unlinkSync(tempAudioPath);
        }
        AdvancedAudioProcessor2.cleanup();
        const totalProcessingTime = Date.now() - startTime;
        console.log(`\u{1F3AF} TRANSCRIPTION R\xC9VOLUTIONNAIRE TERMIN\xC9E: ${totalProcessingTime}ms`);
        res.json({
          transcription: transcriptionResult.text,
          duration: transcriptionResult.duration,
          confidence: transcriptionResult.confidence,
          segments: transcriptionResult.segments,
          audioPath,
          fileName,
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
        if (fs4.existsSync(tempAudioPath)) {
          fs4.unlinkSync(tempAudioPath);
        }
        const { AdvancedAudioProcessor: AdvancedAudioProcessor2 } = await Promise.resolve().then(() => (init_audioProcessor(), audioProcessor_exports));
        AdvancedAudioProcessor2.cleanup();
        throw transcriptionError;
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("\u274C ERREUR TRANSCRIPTION R\xC9VOLUTIONNAIRE:", error);
      let errorMessage = "Erreur de transcription audio";
      let errorCode = 500;
      if (error instanceof Error) {
        if (error.message.includes("format") || error.message.includes("Format")) {
          errorMessage = "Format audio non support\xE9. Utilisez MP3, WAV, M4A, FLAC, ou OGG.";
          errorCode = 400;
        } else if (error.message.includes("size") || error.message.includes("volumineux")) {
          errorMessage = "Fichier trop volumineux. Maximum 25MB autoris\xE9.";
          errorCode = 400;
        } else if (error.message.includes("quota") || error.message.includes("limit")) {
          errorMessage = "Limite API atteinte. R\xE9essayez dans quelques minutes.";
          errorCode = 429;
        } else if (error.message.includes("timeout")) {
          errorMessage = "D\xE9lai de traitement d\xE9pass\xE9. Utilisez un fichier plus court.";
          errorCode = 408;
        } else {
          errorMessage = error.message;
        }
      }
      res.status(errorCode).json({
        message: errorMessage,
        processingTime,
        error: process.env.NODE_ENV === "development" ? {
          stack: error instanceof Error ? error.stack : void 0,
          details: error
        } : void 0
      });
    }
  });
  app2.post("/api/revolutionary-audio-analysis", isAuthenticated, audioUpload.single("audio"), async (req, res) => {
    const startTime = Date.now();
    try {
      const userId = req.session.userId;
      const { title } = req.body;
      if (!req.file) {
        return res.status(400).json({ message: "Fichier audio requis" });
      }
      console.log("\u{1F680} ANALYSE AUDIO R\xC9VOLUTIONNAIRE COMPL\xC8TE:", {
        userId,
        fileName: req.file.originalname,
        size: `${Math.round(req.file.size / 1024 / 1024 * 100) / 100}MB`,
        title: title || "Sans titre"
      });
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }
      const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
      const lastResetMonth = user.lastResetDate ? new Date(user.lastResetDate).getMonth() : -1;
      if (currentMonth !== lastResetMonth) {
        await storage.upsertUser({
          id: userId,
          monthlyAnalysesUsed: 0,
          lastResetDate: /* @__PURE__ */ new Date()
        });
      }
      if (!user.isPremium && (user.monthlyAnalysesUsed || 0) >= 3) {
        return res.status(403).json({
          message: "Limite mensuelle atteinte. Passez premium pour des analyses illimit\xE9es.",
          limitReached: true
        });
      }
      const audioResult = await DirectAudioAnalysisService.processDirectAudioUpload(req.file);
      console.log("\u2705 Transcription r\xE9volutionnaire termin\xE9e");
      console.log("\u{1F9E0} Lancement de l'analyse IA compl\xE8te...");
      const analysisResult = await analyzeAudioConversation(audioResult.transcription.text, {
        duration: audioResult.transcription.duration,
        fileSize: req.file.size
        // qualityScore: audioResult.audioMetadata.qualityScore,
        // audioMetadata: audioResult.audioMetadata
      });
      const advancedInsights = await generateAdvancedInsights(audioResult.transcription.text);
      const emotionalAnalysis = await analyzeEmotionalJourney(audioResult.transcription.text);
      console.log("\u2728 Analyse IA compl\xE8te termin\xE9e");
      const analysis = await storage.createAnalysis({
        userId,
        title: title || `Analyse R\xE9volutionnaire - ${req.file.originalname}`,
        inputText: audioResult.transcription.text,
        audioFilePath: "revolutionary-direct-upload",
        transcriptionText: audioResult.transcription.text,
        audioProcessingStatus: "completed",
        audioDurationMinutes: Math.round(audioResult.transcription.duration / 60),
        audioFileSize: req.file.size,
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
              "Analyse IA contextuelle avanc\xE9e",
              "Profiling psychologique approfondi",
              "D\xE9tection \xE9motionnelle en temps r\xE9el"
            ]
          }
        },
        emotionalAnalysis: {
          ...emotionalAnalysis,
          audioSpecificInsights: {
            transcriptionSegments: audioResult.transcription.segments,
            confidenceVariations: audioResult.transcription.segments?.map((s) => s.confidence) || [],
            qualityIssues: audioResult.audioMetadata.qualityIssues,
            recommendations: audioResult.audioMetadata.recommendations
          }
        }
      });
      await storage.incrementAnalysisCount(userId);
      const totalProcessingTime = Date.now() - startTime;
      console.log(`\u{1F3AF} ANALYSE R\xC9VOLUTIONNAIRE COMPL\xC8TE TERMIN\xC9E: ${totalProcessingTime}ms`);
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
            originalName: req.file.originalname,
            fileSize: req.file.size,
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
      console.error("\u274C ERREUR ANALYSE R\xC9VOLUTIONNAIRE COMPL\xC8TE:", error);
      let errorMessage = "Erreur d'analyse r\xE9volutionnaire";
      let errorCode = 500;
      if (error instanceof Error) {
        if (error.message.includes("quota") || error.message.includes("limit")) {
          errorMessage = "Limite API OpenAI atteinte. R\xE9essayez dans quelques minutes.";
          errorCode = 429;
        } else if (error.message.includes("timeout")) {
          errorMessage = "D\xE9lai de traitement d\xE9pass\xE9. Utilisez un fichier plus court.";
          errorCode = 408;
        } else if (error.message.includes("format") || error.message.includes("Format")) {
          errorMessage = "Format de donn\xE9es invalide lors du traitement.";
          errorCode = 400;
        } else if (error.message.includes("audio") || error.message.includes("Audio")) {
          errorMessage = "Erreur de traitement audio. V\xE9rifiez le format et la qualit\xE9 du fichier.";
          errorCode = 400;
        } else {
          errorMessage = error.message;
        }
      }
      res.status(errorCode).json({
        message: errorMessage,
        processingTime,
        revolutionaryError: true,
        error: process.env.NODE_ENV === "development" ? {
          stack: error instanceof Error ? error.stack : void 0,
          details: error
        } : void 0
      });
    }
  });
  app2.post("/api/analyze-audio", isAuthenticated, async (req, res) => {
    try {
      const { transcriptionText, title, audioPath, fileName, duration, fileSize } = req.body;
      const userId = req.session.userId;
      if (!transcriptionText) {
        return res.status(400).json({ message: "Transcription text is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
      const lastResetMonth = user.lastResetDate ? new Date(user.lastResetDate).getMonth() : -1;
      if (currentMonth !== lastResetMonth) {
        await storage.upsertUser({
          id: userId,
          monthlyAnalysesUsed: 0,
          lastResetDate: /* @__PURE__ */ new Date()
        });
      }
      if (!user.isPremium && (user.monthlyAnalysesUsed || 0) >= 3) {
        return res.status(403).json({ message: "Monthly analysis limit reached. Upgrade to premium for unlimited analyses." });
      }
      console.log("\u{1F9E0} Lancement de l'analyse IA r\xE9volutionnaire...");
      const startProcessingTime = Date.now();
      const analysisResult = await analyzeAudioConversation(transcriptionText, {
        duration,
        fileSize
        // confidence: 0.95, // High confidence for complete transcriptions
        // qualityScore: 0.9, // Assume good quality for existing transcriptions
        // audioMetadata: {
        //   duration,
        //   sampleRate: 44100,
        //   channels: 2,
        //   bitrate: 128000,
        //   format: fileName?.split('.').pop() || 'mp3',
        //   codec: 'unknown'
        // }
      });
      console.log(`\u2705 Analyse IA termin\xE9e: ${Date.now() - startProcessingTime}ms`);
      const advancedInsights = await generateAdvancedInsights(transcriptionText);
      const emotionalAnalysis = await analyzeEmotionalJourney(transcriptionText);
      const analysis = await storage.createAnalysis({
        userId,
        title: title || `Analyse Audio Avanc\xE9e - ${(/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}`,
        inputText: transcriptionText,
        audioFilePath: audioPath,
        transcriptionText,
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
              "Traitement contextuel avanc\xE9",
              "Insights psychologiques profonds"
            ]
          }
        },
        emotionalAnalysis
      });
      await storage.incrementAnalysisCount(userId);
      console.log("Audio conversation analysis completed successfully");
      res.json({
        ...analysis,
        audioInsights: analysisResult.audioInsights
      });
    } catch (error) {
      console.error("Error analyzing audio conversation:", error);
      res.status(500).json({
        message: "Failed to analyze audio conversation: " + error.message
      });
    }
  });
  app2.post("/api/analyze", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { conversationText, title } = req.body;
      if (!conversationText || typeof conversationText !== "string" || conversationText.trim().length === 0) {
        return res.status(400).json({ message: "Le texte de conversation est obligatoire et ne peut pas \xEAtre vide." });
      }
      if (conversationText.length > 5e4) {
        return res.status(400).json({ message: "Le texte de conversation ne peut pas d\xE9passer 50 000 caract\xE8res." });
      }
      if (title && (typeof title !== "string" || title.length > 200)) {
        return res.status(400).json({ message: "Le titre doit \xEAtre une cha\xEEne de moins de 200 caract\xE8res." });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.isPremium && (user.monthlyAnalysesUsed || 0) >= 3) {
        return res.status(403).json({
          message: "Monthly analysis limit reached. Upgrade to premium for unlimited analyses.",
          limitReached: true
        });
      }
      const analysisResult = await analyzeConversation(conversationText);
      const advancedInsights = await generateAdvancedInsights(conversationText);
      const emotionalAnalysis = await analyzeEmotionalJourney(conversationText);
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
        advancedInsights,
        emotionalAnalysis
      });
      await storage.incrementAnalysisCount(userId);
      res.json({
        id: analysis.id,
        ...analysisResult,
        advancedInsights,
        emotionalAnalysis,
        createdAt: analysis.createdAt
      });
    } catch (error) {
      console.error("Error analyzing conversation:", error);
      res.status(500).json({ message: "Failed to analyze conversation" });
    }
  });
  app2.get("/api/analyses", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user?.isPremium) {
        return res.status(403).json({ message: "Premium subscription required to access analysis history" });
      }
      const analyses2 = await storage.getUserAnalyses(userId, 20);
      res.json(analyses2);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });
  app2.get("/api/analyses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      if (analysis.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });
  app2.post("/api/create-lifetime-payment", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouv\xE9" });
      }
      if (user.isPremium) {
        return res.status(400).json({ message: "Vous avez d\xE9j\xE0 un acc\xE8s premium" });
      }
      console.log(`\u{1F4B3} Cr\xE9ation session de paiement \xE0 vie pour l'utilisateur: ${userId}`);
      const session2 = await stripe?.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: "LeadMirror - Acc\xE8s \xE0 Vie",
                description: "Acc\xE8s illimit\xE9 \xE0 vie \xE0 toutes les fonctionnalit\xE9s premium de LeadMirror",
                images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400"]
              },
              unit_amount: 9900
              // 99€ en centimes
            },
            quantity: 1
          }
        ],
        mode: "payment",
        success_url: `${req.protocol}://${req.get("host")}/dashboard?payment=success&type=lifetime`,
        cancel_url: `${req.protocol}://${req.get("host")}/dashboard?payment=cancelled`,
        client_reference_id: userId,
        customer_email: user.email || void 0,
        metadata: {
          userId,
          offer_type: "lifetime",
          type: "lifetime",
          payment_type: "lifetime"
        }
      });
      console.log(`\u2705 Session de paiement cr\xE9\xE9e: ${session2?.id}`);
      console.log(`\u{1F517} URLs de retour:`);
      console.log(`   Success: ${req.protocol}://${req.get("host")}/dashboard?payment=success&type=lifetime`);
      console.log(`   Cancel: ${req.protocol}://${req.get("host")}/dashboard?payment=cancelled`);
      res.json({ checkoutUrl: session2?.url });
    } catch (error) {
      console.error("\u274C Erreur cr\xE9ation paiement:", error);
      res.status(500).json({ message: "Erreur lors de la cr\xE9ation du paiement: " + error.message });
    }
  });
  app2.post("/api/stripe/create-lifetime-session", isAuthenticated, asyncHandler(async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Paiements non configur\xE9s" });
    }
    try {
      const userId = req.session.userId;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouv\xE9" });
      }
      const session2 = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: "LeadMirror - Acc\xE8s \xE0 Vie",
                description: "Acc\xE8s illimit\xE9 \xE0 vie \xE0 toutes les fonctionnalit\xE9s premium de LeadMirror",
                images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400"]
              },
              unit_amount: 9900
              // 99€ en centimes
            },
            quantity: 1
          }
        ],
        mode: "payment",
        success_url: `${req.protocol}://${req.get("host")}/dashboard?payment=success&type=lifetime`,
        cancel_url: `${req.protocol}://${req.get("host")}/dashboard?payment=cancelled`,
        client_reference_id: userId,
        customer_email: user.email || void 0,
        metadata: {
          userId,
          offer_type: "lifetime",
          type: "lifetime",
          payment_type: "lifetime"
        }
      });
      console.log(`\u2705 Session de paiement cr\xE9\xE9e: ${session2?.id}`);
      console.log(`\u{1F517} URLs de retour:`);
      console.log(`   Success: ${req.protocol}://${req.get("host")}/dashboard?payment=success&type=lifetime`);
      console.log(`   Cancel: ${req.protocol}://${req.get("host")}/dashboard?payment=cancelled`);
      res.json({ checkoutUrl: session2?.url });
    } catch (error) {
      console.error("\u274C Erreur cr\xE9ation paiement:", error);
      res.status(500).json({ message: "Erreur lors de la cr\xE9ation du paiement: " + error.message });
    }
  }));
  app2.post("/api/create-subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.stripeSubscriptionId && user.subscriptionStatus === "active") {
        return res.status(400).json({
          message: "Vous avez d\xE9j\xE0 un abonnement actif"
        });
      }
      if (!user.email) {
        return res.status(400).json({ message: "No user email on file" });
      }
      console.log(`\u{1F4B3} Cr\xE9ation session d'abonnement pour l'utilisateur: ${userId}`);
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe?.customers.create({
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          metadata: { userId }
        });
        customerId = customer?.id;
        console.log(`\u{1F464} Client Stripe cr\xE9\xE9: ${customerId}`);
      }
      const price = await stripe?.prices.create({
        unit_amount: 1500,
        // €15.00 in cents
        currency: "eur",
        recurring: { interval: "month" },
        product_data: {
          name: "LeadMirror Premium"
        }
      });
      console.log(`\uFFFD\uFFFD Prix cr\xE9\xE9: ${price?.id}`);
      const session2 = await stripe?.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{
          price: price?.id,
          quantity: 1
        }],
        mode: "subscription",
        success_url: `${req.protocol}://${req.get("host")}/dashboard?payment=success&type=subscription`,
        cancel_url: `${req.protocol}://${req.get("host")}/dashboard?payment=cancelled`,
        client_reference_id: userId,
        metadata: {
          userId,
          type: "subscription",
          offer_type: "subscription"
        }
      });
      console.log(`\u2705 Session d'abonnement cr\xE9\xE9e: ${session2?.id}`);
      console.log(`\u{1F517} URLs de retour:`);
      console.log(`   Success: ${req.protocol}://${req.get("host")}/dashboard?payment=success&type=subscription`);
      console.log(`   Cancel: ${req.protocol}://${req.get("host")}/dashboard?payment=cancelled`);
      res.json({
        checkoutUrl: session2?.url,
        sessionId: session2?.id
      });
    } catch (error) {
      console.error("\u274C Error creating subscription:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });
  app2.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe?.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
    } catch (err) {
      console.log(`\u274C Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log(`\u{1F514} Webhook re\xE7u: ${event.type}`);
    console.log(`\u{1F4CA} Donn\xE9es webhook:`, JSON.stringify(event.data.object, null, 2));
    try {
      switch (event.type) {
        case "customer.subscription.updated":
        case "customer.subscription.created":
          const subscription = event.data.object;
          console.log(`\u{1F4C5} Abonnement ${subscription.status}: ${subscription.id}`);
          if (subscription.status === "active") {
            const user = await storage.getUserByStripeSubscriptionId(subscription.id);
            if (user) {
              await storage.updateUserPremiumStatus(user.id, true);
              console.log(`\u2705 Acc\xE8s premium activ\xE9 pour l'utilisateur: ${user.id} (${user.email})`);
            } else {
              console.log(`\u26A0\uFE0F Utilisateur non trouv\xE9 pour l'abonnement: ${subscription.id}`);
            }
          }
          break;
        case "customer.subscription.deleted":
          const deletedSubscription = event.data.object;
          const userToUpdate = await storage.getUserByStripeSubscriptionId(deletedSubscription.id);
          if (userToUpdate) {
            await storage.updateUserPremiumStatus(userToUpdate.id, false);
            console.log(`\u274C Acc\xE8s premium d\xE9sactiv\xE9 pour l'utilisateur: ${userToUpdate.id} (${userToUpdate.email})`);
          }
          break;
        case "checkout.session.completed":
          const session2 = event.data.object;
          console.log(`\u{1F4B3} Session de paiement compl\xE9t\xE9e: ${session2.id}`);
          console.log(`\u{1F4CB} M\xE9tadonn\xE9es:`, session2.metadata);
          console.log(`\u{1F3AF} Mode: ${session2.mode}, Subscription: ${session2.subscription}`);
          if (session2.metadata?.type === "lifetime" || session2.metadata?.offer_type === "lifetime") {
            const userId = session2.metadata.userId || session2.client_reference_id;
            if (userId) {
              await storage.updateUserPremiumStatus(userId, true);
              console.log(`\u{1F389} Paiement \xE0 vie trait\xE9 pour l'utilisateur: ${userId}`);
            } else {
              console.log(`\u26A0\uFE0F userId manquant pour le paiement \xE0 vie: ${session2.id}`);
            }
          }
          if (session2.mode === "subscription" && session2.subscription) {
            const userId = session2.metadata?.userId;
            if (userId) {
              await storage.updateUserPremiumStatus(userId, true);
              console.log(`\u{1F389} Abonnement mensuel activ\xE9 pour l'utilisateur: ${userId}`);
            } else {
              console.log(`\u26A0\uFE0F userId manquant pour l'abonnement: ${session2.id}`);
            }
          }
          break;
        case "invoice.payment_succeeded":
          const invoice = event.data.object;
          console.log(`\u{1F4B0} Paiement d'invoice r\xE9ussi: ${invoice.id}`);
          const subscriptionId = invoice.subscription;
          if (subscriptionId) {
            const user = await storage.getUserByStripeSubscriptionId(subscriptionId);
            if (user) {
              await storage.updateUserPremiumStatus(user.id, true);
              console.log(`\u2705 Acc\xE8s premium renouvel\xE9 pour l'utilisateur: ${user.id} (${user.email})`);
            } else {
              console.log(`\u26A0\uFE0F Utilisateur non trouv\xE9 pour l'invoice: ${subscriptionId}`);
            }
          }
          break;
        case "invoice.payment_failed":
          const failedInvoice = event.data.object;
          console.log(`\u274C Paiement d'invoice \xE9chou\xE9: ${failedInvoice.id}`);
          const failedSubscriptionId = failedInvoice.subscription;
          if (failedSubscriptionId) {
            const user = await storage.getUserByStripeSubscriptionId(failedSubscriptionId);
            if (user) {
              await storage.updateUserPremiumStatus(user.id, false);
              console.log(`\u274C Acc\xE8s premium d\xE9sactiv\xE9 pour l'utilisateur: ${user.id} (${user.email})`);
            }
          }
          break;
        default:
          console.log(`\u26A0\uFE0F \xC9v\xE9nement non g\xE9r\xE9: ${event.type}`);
      }
    } catch (error) {
      console.error(`\u274C Erreur lors du traitement du webhook ${event.type}:`, error);
    }
    res.json({ received: true });
  });
  app2.get("/api/analytics/dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      const userMetrics2 = await storage.getUserMetrics(userId);
      const recentAnalyses = await storage.getUserAnalyses(userId, 30);
      const totalAnalyses = recentAnalyses.length;
      const hotLeads = recentAnalyses.filter((a) => a.interestLevel === "hot").length;
      const avgConfidence = recentAnalyses.length > 0 ? Math.round(recentAnalyses.reduce((sum, a) => sum + (a.confidenceScore || 0), 0) / recentAnalyses.length) : 0;
      const dashboardData = {
        totalAnalyses,
        hotLeadsCount: hotLeads,
        avgConfidenceScore: avgConfidence,
        avgClosingProbability: userMetrics2?.averageClosingProbability || 0,
        successRate: 74,
        improvementRate: 15,
        weeklyGrowth: 23,
        recentTrends: [
          { metric: "Taux de conversion", value: "+12%", trend: "up" },
          { metric: "Score de confiance", value: "+8%", trend: "up" },
          { metric: "Objections r\xE9solues", value: "+15%", trend: "up" },
          { metric: "Temps de closing", value: "-20%", trend: "up" }
        ]
      };
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs5 from "fs";
import path5 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path4 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path4.resolve(import.meta.dirname, "client", "src"),
      "@shared": path4.resolve(import.meta.dirname, "shared"),
      "@assets": path4.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path4.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path4.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-toast"]
        }
      }
    },
    minify: "terser",
    sourcemap: false
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query"]
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path5.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs5.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path5.resolve(import.meta.dirname, "..", "dist", "public");
  if (!fs5.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}

// server/index.ts
function createServer2() {
  const app2 = express2();
  app2.use(express2.json());
  app2.use(express2.urlencoded({ extended: false }));
  app2.use((req, res, next) => {
    const start = Date.now();
    const path6 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path6.startsWith("/api")) {
        let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "\u2026";
        }
        log(logLine);
      }
    });
    next();
  });
  return app2;
}
var app = createServer2();
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    if (process.env.NODE_ENV === "development" || err.status !== 404 && err.statusCode !== 404) {
      console.error("Error handler caught:", err);
    }
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    if (status === 400) {
      message = "Requ\xEAte invalide";
    } else if (status === 401) {
      message = "Authentification requise";
    } else if (status === 403) {
      message = "Acc\xE8s interdit";
    } else if (status === 404) {
      message = "Ressource introuvable";
    } else if (status >= 500) {
      message = "Erreur temporaire du serveur. Veuillez r\xE9essayer.";
      if (process.env.NODE_ENV === "development") {
        console.error("Server error details:", err.stack);
      }
    }
    res.status(status).json({
      message,
      ...process.env.NODE_ENV === "development" && { error: err.message }
    });
  });
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ message: "Endpoint API introuvable" });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0"
    // Changed from "127.0.0.1" for Railway compatibility
  }, () => {
    log(`\u{1F680} Serveur d\xE9marr\xE9 sur le port ${port} (Railway)`);
    log(`\u{1F4CA} Environnement: ${process.env.NODE_ENV || "development"}`);
    log(`\u{1F517} URL: http://localhost:${port}`);
  });
})();
export {
  createServer2 as createServer
};
