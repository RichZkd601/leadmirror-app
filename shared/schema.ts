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
} from "drizzle-orm/pg-core";
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
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analysis storage table - Enhanced for world-class features
export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  inputText: text("input_text").notNull(),
  
  // Core analysis
  interestLevel: varchar("interest_level").notNull(), // "hot", "warm", "cold"
  interestJustification: text("interest_justification").notNull(),
  confidenceScore: integer("confidence_score").notNull(), // 0-100
  
  // Advanced psychological analysis
  personalityProfile: jsonb("personality_profile").notNull(), // {type, traits, communicationStyle}
  emotionalState: jsonb("emotional_state").notNull(), // {primary, intensity, indicators}
  
  // Enhanced objections analysis
  objections: jsonb("objections").notNull(), // Array with responseStrategy and probability
  buyingSignals: jsonb("buying_signals").notNull(), // Array of detected buying signals
  
  // Strategic recommendations
  nextSteps: jsonb("next_steps").notNull(), // Array of prioritized actions
  strategicAdvice: text("strategic_advice").notNull(),
  talkingPoints: jsonb("talking_points").notNull(), // Array of key points
  
  // Follow-up optimization
  followUpSubject: text("follow_up_subject").notNull(),
  followUpMessage: text("follow_up_message").notNull(),
  alternativeApproaches: jsonb("alternative_approaches").notNull(), // Array of different strategies
  
  // Risk management
  riskFactors: jsonb("risk_factors").notNull(), // Array of risks and mitigations
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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
