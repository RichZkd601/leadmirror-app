var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
  crmIntegrations: () => crmIntegrations,
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
  password: varchar("password"),
  // Added for email/password auth
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
  audioFilePath: varchar("audio_file_path"),
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
var crmIntegrations = pgTable("crm_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  platform: varchar("platform").notNull(),
  // 'notion', 'pipedrive', 'clickup', 'trello'
  isActive: boolean("is_active").default(true),
  config: jsonb("config").notNull(),
  // Configuration spécifique à chaque plateforme
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
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
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3
});
var db = drizzle({ client: pool, schema: schema_exports });
process.on("SIGINT", async () => {
  console.log("Closing database pool...");
  await pool.end();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("Closing database pool...");
  await pool.end();
  process.exit(0);
});

// server/storage.ts
import { eq, desc, and } from "drizzle-orm";
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
  // CRM Integration operations
  async createCrmIntegration(integration) {
    const [newIntegration] = await db.insert(crmIntegrations).values(integration).returning();
    return newIntegration;
  }
  async getUserCrmIntegrations(userId) {
    return await db.select().from(crmIntegrations).where(eq(crmIntegrations.userId, userId)).orderBy(desc(crmIntegrations.createdAt));
  }
  async getCrmIntegration(userId, platform) {
    const [integration] = await db.select().from(crmIntegrations).where(and(eq(crmIntegrations.userId, userId), eq(crmIntegrations.platform, platform)));
    return integration;
  }
  async updateCrmIntegration(id, updates) {
    const [updatedIntegration] = await db.update(crmIntegrations).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(crmIntegrations.id, id)).returning();
    return updatedIntegration;
  }
  async deleteCrmIntegration(id) {
    await db.delete(crmIntegrations).where(eq(crmIntegrations.id, id));
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
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
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
      maxAge: sessionTtl
    }
  });
}

// server/routes.ts
import bcrypt from "bcrypt";

// server/integrations/notion.ts
import { Client } from "@notionhq/client";
var NotionIntegration = class {
  notion;
  databaseId;
  constructor(token, databaseId) {
    this.notion = new Client({ auth: token });
    this.databaseId = databaseId;
  }
  async exportAnalysis(analysis) {
    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId
        },
        properties: {
          "Titre": {
            title: [
              {
                text: {
                  content: analysis.title || "Analyse sans titre"
                }
              }
            ]
          },
          "Niveau d'int\xE9r\xEAt": {
            select: {
              name: analysis.interestLevel === "hot" ? "Chaud" : analysis.interestLevel === "warm" ? "Ti\xE8de" : "Froid"
            }
          },
          "Score de confiance": {
            number: analysis.confidenceScore || 0
          },
          "Date d'analyse": {
            date: {
              start: analysis.createdAt.split("T")[0]
            }
          },
          "Statut": {
            select: {
              name: "\xC0 suivre"
            }
          }
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "\u{1F4CA} R\xE9sum\xE9 de l'analyse"
                  }
                }
              ]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: analysis.interestJustification
                  }
                }
              ]
            }
          },
          {
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "\u{1F3AF} Conseils strat\xE9giques"
                  }
                }
              ]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: analysis.strategicAdvice
                  }
                }
              ]
            }
          },
          {
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "\u{1F4E7} Message de relance"
                  }
                }
              ]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: `Objet: ${analysis.followUpSubject}

${analysis.followUpMessage}`
                  }
                }
              ]
            }
          }
        ]
      });
      return response.id;
    } catch (error) {
      console.error("Erreur lors de l'export vers Notion:", error);
      throw new Error("\xC9chec de l'export vers Notion");
    }
  }
  async testConnection() {
    try {
      await this.notion.databases.retrieve({ database_id: this.databaseId });
      return true;
    } catch (error) {
      return false;
    }
  }
};

// server/integrations/pipedrive.ts
var PipedriveIntegration = class {
  apiToken;
  baseUrl;
  constructor(apiToken, companyDomain) {
    this.apiToken = apiToken;
    this.baseUrl = `https://${companyDomain}.pipedrive.com/api/v1`;
  }
  async exportAnalysis(analysis, personId) {
    try {
      const noteResponse = await fetch(`${this.baseUrl}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_token: this.apiToken,
          content: this.formatAnalysisNote(analysis),
          person_id: personId,
          pinned_to_person_flag: true
        })
      });
      if (!noteResponse.ok) {
        throw new Error(`Erreur Pipedrive: ${noteResponse.statusText}`);
      }
      const noteData = await noteResponse.json();
      if (analysis.nextSteps && analysis.nextSteps.length > 0) {
        const activityResponse = await fetch(`${this.baseUrl}/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            api_token: this.apiToken,
            subject: `Suivi: ${analysis.title}`,
            note: analysis.nextSteps.map(
              (step) => `${step.action} (${step.timeframe})`
            ).join("\n"),
            person_id: personId,
            type: "call",
            due_date: this.getNextBusinessDay()
          })
        });
        if (!activityResponse.ok) {
          console.warn("Impossible de cr\xE9er l'activit\xE9 de suivi dans Pipedrive");
        }
      }
      return noteData.data.id.toString();
    } catch (error) {
      console.error("Erreur lors de l'export vers Pipedrive:", error);
      throw new Error("\xC9chec de l'export vers Pipedrive");
    }
  }
  formatAnalysisNote(analysis) {
    return `
\u{1F50D} ANALYSE LeadMirror - ${analysis.title}

\u{1F4CA} NIVEAU D'INT\xC9R\xCAT: ${analysis.interestLevel.toUpperCase()}
${analysis.interestJustification}

\u{1F3AF} CONSEILS STRAT\xC9GIQUES:
${analysis.strategicAdvice}

\u{1F4E7} MESSAGE DE RELANCE SUGG\xC9R\xC9:
Objet: ${analysis.followUpSubject}

${analysis.followUpMessage}

${analysis.objections && analysis.objections.length > 0 ? `
\u26A0\uFE0F OBJECTIONS IDENTIFI\xC9ES:
${analysis.objections.map((obj) => `\u2022 ${obj.description} (${obj.intensity})`).join("\n")}
` : ""}

${analysis.buyingSignals && analysis.buyingSignals.length > 0 ? `
\u2705 SIGNAUX D'ACHAT:
${analysis.buyingSignals.map((signal) => `\u2022 ${signal.description} (${signal.strength})`).join("\n")}
` : ""}

---
Analys\xE9 automatiquement par LeadMirror le ${new Date(analysis.createdAt).toLocaleDateString("fr-FR")}
    `.trim();
  }
  getNextBusinessDay() {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() + 1);
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    if (date.getDay() === 6) date.setDate(date.getDate() + 2);
    return date.toISOString().split("T")[0];
  }
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/users/me?api_token=${this.apiToken}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};

// server/integrations/clickup.ts
var ClickUpIntegration = class {
  apiToken;
  baseUrl = "https://api.clickup.com/api/v2";
  constructor(apiToken) {
    this.apiToken = apiToken;
  }
  async exportAnalysis(analysis, listId) {
    try {
      const taskData = {
        name: `\u{1F4DE} ${analysis.title}`,
        description: this.formatAnalysisDescription(analysis),
        status: "to do",
        priority: this.getPriority(analysis.interestLevel),
        due_date: this.getDueDate(analysis),
        tags: this.getTags(analysis),
        custom_fields: await this.getCustomFields(analysis, listId)
      };
      const response = await fetch(`${this.baseUrl}/list/${listId}/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.apiToken
        },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) {
        throw new Error(`Erreur ClickUp: ${response.statusText}`);
      }
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error("Erreur lors de l'export vers ClickUp:", error);
      throw new Error("\xC9chec de l'export vers ClickUp");
    }
  }
  formatAnalysisDescription(analysis) {
    return `
## \u{1F4CA} Analyse LeadMirror

**Niveau d'int\xE9r\xEAt:** ${analysis.interestLevel === "hot" ? "\u{1F525} Chaud" : analysis.interestLevel === "warm" ? "\u{1F324} Ti\xE8de" : "\u2744\uFE0F Froid"}

**Justification:** ${analysis.interestJustification}

## \u{1F3AF} Conseils strat\xE9giques
${analysis.strategicAdvice}

## \u{1F4E7} Message de relance
**Objet:** ${analysis.followUpSubject}

\`\`\`
${analysis.followUpMessage}
\`\`\`

${analysis.objections && analysis.objections.length > 0 ? `
## \u26A0\uFE0F Objections identifi\xE9es
${analysis.objections.map((obj) => `- **${obj.type}** (${obj.intensity}): ${obj.description}`).join("\n")}
` : ""}

${analysis.buyingSignals && analysis.buyingSignals.length > 0 ? `
## \u2705 Signaux d'achat
${analysis.buyingSignals.map((signal) => `- **${signal.signal}** (${signal.strength}): ${signal.description}`).join("\n")}
` : ""}

---
*Analys\xE9 automatiquement par LeadMirror le ${new Date(analysis.createdAt).toLocaleDateString("fr-FR")}*
    `.trim();
  }
  getPriority(interestLevel) {
    switch (interestLevel) {
      case "hot":
        return 1;
      // Urgent
      case "warm":
        return 2;
      // High
      case "cold":
        return 3;
      // Normal
      default:
        return 4;
    }
  }
  getDueDate(analysis) {
    if (analysis.nextSteps && analysis.nextSteps.length > 0) {
      const firstStep = analysis.nextSteps[0];
      if (firstStep.timeframe === "Aujourd'hui") {
        return Date.now();
      } else if (firstStep.timeframe === "Cette semaine") {
        return Date.now() + 7 * 24 * 60 * 60 * 1e3;
      }
    }
    return void 0;
  }
  getTags(analysis) {
    const tags = ["leadmirror", analysis.interestLevel];
    if (analysis.objections && analysis.objections.length > 0) {
      tags.push("objections");
    }
    if (analysis.buyingSignals && analysis.buyingSignals.length > 0) {
      tags.push("buying-signals");
    }
    return tags;
  }
  async getCustomFields(analysis, listId) {
    try {
      const response = await fetch(`${this.baseUrl}/list/${listId}/field`, {
        headers: {
          "Authorization": this.apiToken
        }
      });
      if (!response.ok) return [];
      const fieldsData = await response.json();
      const customFields = [];
      for (const field of fieldsData.fields) {
        if (field.name === "Score de confiance" && analysis.confidenceScore) {
          customFields.push({
            id: field.id,
            value: analysis.confidenceScore
          });
        } else if (field.name === "Niveau d'int\xE9r\xEAt") {
          customFields.push({
            id: field.id,
            value: analysis.interestLevel
          });
        }
      }
      return customFields;
    } catch (error) {
      console.warn("Impossible de mapper les champs personnalis\xE9s ClickUp");
      return [];
    }
  }
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          "Authorization": this.apiToken
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};

// server/integrations/trello.ts
var TrelloIntegration = class {
  apiKey;
  token;
  baseUrl = "https://api.trello.com/1";
  constructor(apiKey, token) {
    this.apiKey = apiKey;
    this.token = token;
  }
  async exportAnalysis(analysis, listId) {
    try {
      const cardData = {
        name: `\u{1F4DE} ${analysis.title}`,
        desc: this.formatAnalysisDescription(analysis),
        idList: listId,
        pos: "top",
        key: this.apiKey,
        token: this.token
      };
      const response = await fetch(`${this.baseUrl}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cardData)
      });
      if (!response.ok) {
        throw new Error(`Erreur Trello: ${response.statusText}`);
      }
      const card = await response.json();
      await this.addLabels(card.id, analysis.interestLevel);
      if (analysis.nextSteps && analysis.nextSteps.length > 0) {
        await this.addChecklist(card.id, analysis.nextSteps);
      }
      return card.id;
    } catch (error) {
      console.error("Erreur lors de l'export vers Trello:", error);
      throw new Error("\xC9chec de l'export vers Trello");
    }
  }
  formatAnalysisDescription(analysis) {
    return `
## \u{1F4CA} Analyse LeadMirror

**Niveau d'int\xE9r\xEAt:** ${analysis.interestLevel === "hot" ? "\u{1F525} Chaud" : analysis.interestLevel === "warm" ? "\u{1F324} Ti\xE8de" : "\u2744\uFE0F Froid"}

**Justification:** ${analysis.interestJustification}

## \u{1F3AF} Conseils strat\xE9giques
${analysis.strategicAdvice}

## \u{1F4E7} Message de relance sugg\xE9r\xE9
**Objet:** ${analysis.followUpSubject}

\`\`\`
${analysis.followUpMessage}
\`\`\`

${analysis.objections && analysis.objections.length > 0 ? `
## \u26A0\uFE0F Objections identifi\xE9es
${analysis.objections.map((obj) => `\u2022 **${obj.type}** (${obj.intensity}): ${obj.description}`).join("\n")}

**Strat\xE9gies de r\xE9ponse:**
${analysis.objections.map((obj) => `\u2022 ${obj.responseStrategy || "Strat\xE9gie \xE0 d\xE9finir"}`).join("\n")}
` : ""}

${analysis.buyingSignals && analysis.buyingSignals.length > 0 ? `
## \u2705 Signaux d'achat d\xE9tect\xE9s
${analysis.buyingSignals.map((signal) => `\u2022 **${signal.signal}** (${signal.strength}): ${signal.description}`).join("\n")}
` : ""}

${analysis.advancedInsights ? `
## \u{1F9E0} Insights avanc\xE9s
**Score de qualit\xE9:** ${analysis.advancedInsights.conversationQualityScore}/100
**Probabilit\xE9 de closing:** ${analysis.advancedInsights.predictions?.closingProbability || "N/A"}%
**Temps estim\xE9 pour closer:** ${analysis.advancedInsights.salesTiming?.timeToClose || "N/A"}
` : ""}

---
*Analys\xE9 automatiquement par LeadMirror le ${new Date(analysis.createdAt).toLocaleDateString("fr-FR")}*
    `.trim();
  }
  async addLabels(cardId, interestLevel) {
    try {
      const boardResponse = await fetch(`${this.baseUrl}/cards/${cardId}/board?key=${this.apiKey}&token=${this.token}`);
      const board = await boardResponse.json();
      const labelsResponse = await fetch(`${this.baseUrl}/boards/${board.id}/labels?key=${this.apiKey}&token=${this.token}`);
      const labels = await labelsResponse.json();
      const colorMap = {
        hot: "red",
        warm: "orange",
        cold: "blue"
      };
      const labelName = interestLevel === "hot" ? "\u{1F525} Chaud" : interestLevel === "warm" ? "\u{1F324} Ti\xE8de" : "\u2744\uFE0F Froid";
      let targetLabel = labels.find((label) => label.name === labelName);
      if (!targetLabel) {
        const createLabelResponse = await fetch(`${this.baseUrl}/boards/${board.id}/labels`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: labelName,
            color: colorMap[interestLevel],
            key: this.apiKey,
            token: this.token
          })
        });
        targetLabel = await createLabelResponse.json();
      }
      await fetch(`${this.baseUrl}/cards/${cardId}/idLabels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          value: targetLabel.id,
          key: this.apiKey,
          token: this.token
        })
      });
    } catch (error) {
      console.warn("Impossible d'ajouter des labels \xE0 la carte Trello");
    }
  }
  async addChecklist(cardId, nextSteps) {
    try {
      const checklistResponse = await fetch(`${this.baseUrl}/cards/${cardId}/checklists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "\u{1F4CB} Actions \xE0 r\xE9aliser",
          key: this.apiKey,
          token: this.token
        })
      });
      const checklist = await checklistResponse.json();
      for (const step of nextSteps) {
        await fetch(`${this.baseUrl}/checklists/${checklist.id}/checkItems`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: `${step.action} (${step.timeframe || "\xC0 planifier"})`,
            key: this.apiKey,
            token: this.token
          })
        });
      }
    } catch (error) {
      console.warn("Impossible d'ajouter une checklist \xE0 la carte Trello");
    }
  }
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/members/me?key=${this.apiKey}&token=${this.token}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};

// server/integrations/index.ts
var CRMIntegrationManager = class {
  integrations = /* @__PURE__ */ new Map();
  addNotionIntegration(token, databaseId) {
    this.integrations.set("notion", new NotionIntegration(token, databaseId));
  }
  addPipedriveIntegration(apiToken, companyDomain) {
    this.integrations.set("pipedrive", new PipedriveIntegration(apiToken, companyDomain));
  }
  addClickUpIntegration(apiToken) {
    this.integrations.set("clickup", new ClickUpIntegration(apiToken));
  }
  addTrelloIntegration(apiKey, token) {
    this.integrations.set("trello", new TrelloIntegration(apiKey, token));
  }
  async exportToAll(analysis, options = {}) {
    const results = {};
    for (const [platform, integration] of this.integrations) {
      try {
        const platformOptions = options[platform];
        const result = await integration.exportAnalysis(analysis, platformOptions);
        results[platform] = result;
      } catch (error) {
        results[platform] = error;
      }
    }
    return results;
  }
  async exportTo(platform, analysis, options) {
    const integration = this.integrations.get(platform);
    if (!integration) {
      throw new Error(`Integration ${platform} not configured`);
    }
    return await integration.exportAnalysis(analysis, options);
  }
  async testConnection(platform) {
    const integration = this.integrations.get(platform);
    if (!integration) {
      return false;
    }
    return await integration.testConnection();
  }
  getConfiguredPlatforms() {
    return Array.from(this.integrations.keys());
  }
};

// server/openai.ts
import OpenAI from "openai";
import fs from "fs";
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
async function transcribeAudio(audioFilePath) {
  try {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error("Audio file not found");
    }
    const stats = fs.statSync(audioFilePath);
    const fileSizeInBytes = stats.size;
    const audioReadStream = fs.createReadStream(audioFilePath);
    console.log(`Transcribing audio file: ${audioFilePath} (${fileSizeInBytes} bytes)`);
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      language: "fr",
      // French language for better accuracy
      response_format: "verbose_json",
      // Get detailed response with timestamps
      temperature: 0.2
      // Lower temperature for more consistent transcription
    });
    console.log("Transcription completed successfully");
    return {
      text: transcription.text,
      duration: transcription.duration || 0
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("\xC9chec de la transcription audio: " + error.message);
  }
}
async function analyzeAudioConversation(transcriptionText, audioMetadata) {
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
    const response = await openai.chat.completions.create({
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
    const result = JSON.parse(response.choices[0].message.content || "{}");
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
        pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
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
    const fs4 = __require("fs");
    const tempPath = `/tmp/audio_${randomUUID()}.tmp`;
    return new Promise((resolve, reject) => {
      const writeStream = fs4.createWriteStream(tempPath);
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
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
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

// server/routes.ts
import fs2 from "fs";
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
async function registerRoutes(app2) {
  app2.use(getSession());
  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
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
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Erreur lors de la cr\xE9ation du compte" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
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
      req.session.userId = user.id;
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
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erreur lors de la connexion" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/");
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
    try {
      const { audioURL, fileName, fileSize, duration } = req.body;
      const userId = req.session.userId;
      if (!audioURL) {
        return res.status(400).json({ message: "Audio URL is required" });
      }
      const objectStorageService = new ObjectStorageService();
      const audioPath = objectStorageService.normalizeAudioPath(audioURL);
      const audioFile = await objectStorageService.getAudioFile(audioPath);
      const tempAudioPath = await objectStorageService.downloadAudioToTemp(audioFile);
      try {
        console.log("Starting audio transcription...");
        const transcriptionResult = await transcribeAudio(tempAudioPath);
        console.log("Transcription completed successfully");
        fs2.unlinkSync(tempAudioPath);
        res.json({
          transcription: transcriptionResult.text,
          duration: transcriptionResult.duration,
          audioPath,
          fileName
        });
      } catch (transcriptionError) {
        if (fs2.existsSync(tempAudioPath)) {
          fs2.unlinkSync(tempAudioPath);
        }
        throw transcriptionError;
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({
        message: "Failed to transcribe audio: " + error.message
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
      console.log("Starting enhanced audio conversation analysis...");
      const analysisResult = await analyzeAudioConversation(transcriptionText, {
        duration,
        fileSize
      });
      const advancedInsights = await generateAdvancedInsights(transcriptionText);
      const emotionalAnalysis = await analyzeEmotionalJourney(transcriptionText);
      const analysis = await storage.createAnalysis({
        userId,
        title: title || "Analyse audio sans titre",
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
          audioInsights: analysisResult.audioInsights
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
      const analysisResult = {
        interestLevel: "warm",
        interestJustification: "Le prospect montre un int\xE9r\xEAt r\xE9el pour la solution et identifie des probl\xE8mes concrets. Cependant, il exprime des r\xE9serves sur le timing et l'investissement, ce qui indique un prospect en phase de r\xE9flexion.",
        confidenceScore: 78,
        personalityProfile: {
          type: "analytical",
          traits: ["M\xE9thodique", "Prudent", "Orient\xE9 donn\xE9es", "Besoin de preuves"],
          communicationStyle: "Pr\xE9f\xE8re les faits concrets, les chiffres et les garanties. Prend des d\xE9cisions bas\xE9es sur l'analyse co\xFBt-b\xE9n\xE9fice."
        },
        emotionalState: {
          primary: "prudent",
          intensity: 6,
          indicators: ["Pr\xE9occupations \xE9conomiques", "Demande de preuves", "H\xE9sitation sur l'investissement"]
        },
        objections: [
          {
            type: "Timing",
            intensity: "medium",
            description: "\xAB je ne suis pas s\xFBr que ce soit le bon moment pour investir \xBB",
            responseStrategy: "Montrer que reporter la d\xE9cision co\xFBte plus cher que d'agir maintenant",
            probability: 70
          },
          {
            type: "Budget",
            intensity: "high",
            description: "Pr\xE9occupation sur l'investissement initial de 8 000\u20AC",
            responseStrategy: "Renforcer le ROI et proposer des options de paiement \xE9chelonn\xE9",
            probability: 85
          }
        ],
        buyingSignals: [
          {
            signal: "Quantification du probl\xE8me",
            strength: "strong",
            description: "\xAB 10 heures par semaine, peut-\xEAtre plus \xBB - Le prospect quantifie pr\xE9cis\xE9ment son probl\xE8me"
          },
          {
            signal: "R\xE9action positive au ROI",
            strength: "strong",
            description: "\xAB Wow, vu comme \xE7a... \xBB - Montre l'impact de votre argumentation chiffr\xE9e"
          }
        ],
        nextSteps: [
          {
            action: "Envoyer les t\xE9moignages clients et \xE9tudes de cas",
            priority: "high",
            timeframe: "Aujourd'hui",
            reasoning: "Le prospect a explicitement demand\xE9 ces preuves sociales"
          }
        ],
        strategicAdvice: "Ce prospect est dans une phase d'\xE9valuation active. Il comprend la valeur mais a besoin d'\xEAtre rassur\xE9 sur les risques. Concentrez-vous sur les preuves sociales, la d\xE9monstration concr\xE8te et le ROI personnalis\xE9.",
        talkingPoints: [
          "Mettre en avant les 15 000\u20AC d'\xE9conomies annuelles calcul\xE9es",
          "Insister sur la garantie satisfait ou rembours\xE9 de 30 jours",
          "Proposer de parler \xE0 un client similaire dans son secteur"
        ],
        followUpSubject: "Suite \xE0 notre \xE9change - T\xE9moignages clients et prochaines \xE9tapes",
        followUpMessage: `Bonjour M. Dupont,

Merci pour cet \xE9change tr\xE8s constructif de ce matin. J'ai bien not\xE9 votre int\xE9r\xEAt pour notre solution ainsi que vos pr\xE9occupations l\xE9gitimes sur l'investissement et le timing.

Comme convenu, vous trouverez en pi\xE8ce jointe :
\u2022 3 t\xE9moignages clients de votre secteur avec ROI d\xE9taill\xE9
\u2022 Une \xE9tude de cas d'une entreprise de taille similaire \xE0 la v\xF4tre

Pour r\xE9pondre \xE0 vos questions sur les risques, je vous rappelle notre garantie satisfait ou rembours\xE9 de 30 jours.

Cordialement,
[Votre nom]`,
        alternativeApproaches: [
          {
            approach: "Approche pilote",
            when: "Si r\xE9sistance sur l'investissement total",
            message: "Proposer de commencer par une \xE9quipe test pour valider les r\xE9sultats"
          }
        ],
        riskFactors: [
          {
            risk: "Procrastination due aux incertitudes \xE9conomiques",
            impact: "high",
            mitigation: "Cr\xE9er de l'urgence en montrant le co\xFBt de l'inaction"
          }
        ]
      };
      const advancedInsights = {
        conversationQualityScore: 82,
        salesTiming: {
          currentPhase: "\xC9valuation et validation",
          nextPhaseRecommendation: "D\xE9monstration et preuve de concept",
          timeToClose: "2-3 semaines avec suivi appropri\xE9",
          urgencyIndicators: ["Co\xFBt mensuel de l'inefficacit\xE9", "Pression sur les \xE9quipes"]
        },
        keyMoments: [
          {
            moment: "R\xE9action 'Wow, vu comme \xE7a...' au calcul ROI",
            significance: "Point de bascule - le prospect r\xE9alise l'impact financier",
            action: "Capitaliser sur cette prise de conscience dans le suivi"
          }
        ],
        competitiveAnalysis: {
          competitorsDetected: ["Syst\xE8me actuel interne"],
          competitiveAdvantages: ["ROI d\xE9montr\xE9", "Garantie", "Support client"],
          threatLevel: "Faible",
          counterStrategies: ["Montrer les limites des solutions actuelles"]
        },
        prospectMaturity: {
          decisionMakingStage: "\xC9valuation active des options",
          readinessScore: 75,
          missingElements: ["Preuves sociales", "Validation technique", "Approbation budg\xE9taire"]
        },
        predictions: {
          closingProbability: 68,
          bestApproachVector: "D\xE9monstration + ROI personnalis\xE9 + t\xE9moignages",
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
            phase: "Pr\xE9sentation ROI",
            emotion: "enthousiaste",
            intensity: 8,
            triggers: ["Calcul 26 000\u20AC d'\xE9conomies", "Prise de conscience"]
          }
        ],
        overallSentiment: 0.6,
        emotionalTriggers: ["Gaspillage de temps", "Pression \xE9conomique", "Besoin de s\xE9curit\xE9"],
        recommendedEmotionalApproach: "Approche rassurante et consultative. Montrer que vous comprenez ses contraintes et que vous proposez une solution s\xE9curis\xE9e avec des preuves tangibles."
      };
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
        success_url: `${req.protocol}://${req.get("host")}/dashboard?payment=success`,
        cancel_url: `${req.protocol}://${req.get("host")}/lifetime-offer?payment=cancelled`,
        client_reference_id: userId,
        metadata: {
          userId,
          offer_type: "lifetime"
        }
      });
      res.json({ checkoutUrl: session2.url });
    } catch (error) {
      console.error("Erreur cr\xE9ation paiement:", error);
      res.status(500).json({ message: "Erreur lors de la cr\xE9ation du paiement: " + error.message });
    }
  });
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
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          metadata: { userId }
        });
        customerId = customer.id;
      }
      const price = await stripe.prices.create({
        unit_amount: 1500,
        // €15.00 in cents
        currency: "eur",
        recurring: { interval: "month" },
        product_data: {
          name: "LeadMirror Premium"
        }
      });
      const session2 = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{
          price: price.id,
          quantity: 1
        }],
        mode: "subscription",
        success_url: `${req.protocol}://${req.get("host")}/profile?success=true`,
        cancel_url: `${req.protocol}://${req.get("host")}/profile?canceled=true`,
        metadata: { userId }
      });
      res.json({
        checkoutUrl: session2.url,
        sessionId: session2.id
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });
  app2.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.created":
        const subscription = event.data.object;
        if (subscription.status === "active") {
          const user = await storage.getUserByStripeSubscriptionId(subscription.id);
          if (user) {
            await storage.updateUserPremiumStatus(user.id, true);
          }
        }
        break;
      case "customer.subscription.deleted":
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
  app2.get("/api/crm/integrations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const integrations = await storage.getUserCrmIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching CRM integrations:", error);
      res.status(500).json({ message: "Failed to fetch CRM integrations" });
    }
  });
  app2.post("/api/crm/integrations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { platform, config } = req.body;
      if (!platform || !config) {
        return res.status(400).json({ message: "Platform and config are required" });
      }
      const manager = new CRMIntegrationManager();
      try {
        if (platform === "notion") {
          manager.addNotionIntegration(config.token, config.databaseId);
        } else if (platform === "pipedrive") {
          manager.addPipedriveIntegration(config.apiToken, config.companyDomain);
        } else if (platform === "clickup") {
          manager.addClickUpIntegration(config.apiToken);
        } else if (platform === "trello") {
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
      const existingIntegration = await storage.getCrmIntegration(userId, platform);
      if (existingIntegration) {
        const updatedIntegration = await storage.updateCrmIntegration(existingIntegration.id, {
          config,
          isActive: true
        });
        res.json(updatedIntegration);
      } else {
        const integration = await storage.createCrmIntegration({
          userId,
          platform,
          config,
          isActive: true
        });
        res.json(integration);
      }
    } catch (error) {
      console.error("Error creating CRM integration:", error);
      res.status(500).json({ message: "Failed to create CRM integration" });
    }
  });
  app2.put("/api/crm/integrations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      const { config, isActive } = req.body;
      const integration = await storage.updateCrmIntegration(id, {
        config,
        isActive
      });
      res.json(integration);
    } catch (error) {
      console.error("Error updating CRM integration:", error);
      res.status(500).json({ message: "Failed to update CRM integration" });
    }
  });
  app2.delete("/api/crm/integrations/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/crm/export/:analysisId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { analysisId } = req.params;
      const { platforms, options } = req.body;
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis || analysis.userId !== userId) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      const integrations = await storage.getUserCrmIntegrations(userId);
      const activeIntegrations = integrations.filter((i) => i.isActive);
      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active CRM integrations found" });
      }
      const manager = new CRMIntegrationManager();
      for (const integration of activeIntegrations) {
        const config = integration.config;
        if (integration.platform === "notion") {
          manager.addNotionIntegration(config.token, config.databaseId);
        } else if (integration.platform === "pipedrive") {
          manager.addPipedriveIntegration(config.apiToken, config.companyDomain);
        } else if (integration.platform === "clickup") {
          manager.addClickUpIntegration(config.apiToken);
        } else if (integration.platform === "trello") {
          manager.addTrelloIntegration(config.apiKey, config.token);
        }
      }
      const exportOptions = options || {};
      const results = await manager.exportToAll(analysis, exportOptions);
      res.json({ results, message: "Export completed" });
    } catch (error) {
      console.error("Error exporting to CRM:", error);
      res.status(500).json({ message: "Failed to export to CRM" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
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
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
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
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
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
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
