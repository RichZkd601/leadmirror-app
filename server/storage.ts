import {
  users,
  analyses,
  type User,
  type UpsertUser,
  type Analysis,
  type InsertAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<User>;
  incrementAnalysisCount(userId: string): Promise<User>;
  resetMonthlyAnalyses(userId: string): Promise<User>;
  
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getUserAnalyses(userId: string, limit?: number): Promise<Analysis[]>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  
  // Stripe operations
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        isPremium: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isPremium,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async incrementAnalysisCount(userId: string): Promise<User> {
    // Check if we need to reset monthly count (new month)
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const now = new Date();
    const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : new Date();
    const shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

    if (shouldReset) {
      const [updatedUser] = await db
        .update(users)
        .set({
          monthlyAnalysesUsed: 1,
          lastResetDate: now,
          updatedAt: now,
        })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        monthlyAnalysesUsed: (user.monthlyAnalysesUsed || 0) + 1,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async resetMonthlyAnalyses(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        monthlyAnalysesUsed: 0,
        lastResetDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Analysis operations
  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [newAnalysis] = await db
      .insert(analyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getUserAnalyses(userId: string, limit = 10): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt))
      .limit(limit);
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id));
    return analysis;
  }

  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeSubscriptionId, subscriptionId));
    return user;
  }
}

export const storage = new DatabaseStorage();
