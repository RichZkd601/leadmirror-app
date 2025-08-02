import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analysis storage table - Enhanced for world-class features
export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull().default("Analyse sans titre"),
  inputText: text("input_text").notNull(),
  
  // Core analysis
  interestLevel: varchar("interest_level").notNull(), // "hot", "warm", "cold"
  interestJustification: text("interest_justification").notNull(),
  confidenceScore: integer("confidence_score").notNull(), // 0-100
  
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
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// CRM Integrations table
export const crmIntegrations = pgTable("crm_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  platform: varchar("platform").notNull(), // 'notion', 'pipedrive', 'clickup', 'trello'
  isActive: boolean("is_active").default(true),
  config: jsonb("config").notNull(), // Configuration spécifique à chaque plateforme
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CrmIntegration = typeof crmIntegrations.$inferSelect;
export type InsertCrmIntegration = typeof crmIntegrations.$inferInsert;

export type InsertAnalysis = typeof analyses.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;

// Zod schemas
export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User performance metrics table pour les analytics avancées
export const userMetrics = pgTable("user_metrics", {
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
  monthlyGoals: jsonb("monthly_goals"), // Array of goal objects
  achievements: jsonb("achievements"), // Array of achievement objects
  
  // Tracking dates
  lastAnalysisDate: timestamp("last_analysis_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations pour les jointures optimisées
export const usersRelations = relations(users, ({ many }) => ({
  analyses: many(analyses),
  metrics: many(userMetrics),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  user: one(users, {
    fields: [analyses.userId],
    references: [users.id],
  }),
}));

export const userMetricsRelations = relations(userMetrics, ({ one }) => ({
  user: one(users, {
    fields: [userMetrics.userId],
    references: [users.id],
  }),
}));

// Types supplémentaires
export type InsertUserMetrics = typeof userMetrics.$inferInsert;
export type UserMetrics = typeof userMetrics.$inferSelect;

export const insertUserMetricsSchema = createInsertSchema(userMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
