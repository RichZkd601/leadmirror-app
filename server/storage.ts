import {
  users,
  analyses,
  userMetrics,
  type User,
  type UpsertUser,
  type Analysis,
  type InsertAnalysis,
  type UserMetrics,
  type InsertUserMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Metrics operations
  createUserMetrics(userId: string): Promise<UserMetrics>;
  getUserMetrics(userId: string): Promise<UserMetrics | undefined>;
  updateUserMetrics(userId: string, updates: Partial<InsertUserMetrics>): Promise<UserMetrics>;
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

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
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

  async updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isPremium,
        subscriptionStatus: isPremium ? "active" : "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
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
        subscriptionStatus: "active",
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

  // Metrics operations
  async createUserMetrics(userId: string): Promise<UserMetrics> {
    const [metrics] = await db
      .insert(userMetrics)
      .values({ userId })
      .returning();
    return metrics;
  }

  async getUserMetrics(userId: string): Promise<UserMetrics | undefined> {
    const [metrics] = await db
      .select()
      .from(userMetrics)
      .where(eq(userMetrics.userId, userId));
    return metrics;
  }

  async updateUserMetrics(userId: string, updates: Partial<InsertUserMetrics>): Promise<UserMetrics> {
    const [metrics] = await db
      .update(userMetrics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userMetrics.userId, userId))
      .returning();
    return metrics;
  }
}

// Memory storage for development mode
class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private analyses = new Map<string, Analysis>();
  private userMetrics = new Map<string, UserMetrics>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: any): Promise<User> {
    const user: User = {
      id: userData.id || `user_${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      password: userData.password,
      isPremium: false,
      monthlyAnalysesUsed: 0,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: 'inactive',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastResetDate: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      const updatedUser = { ...existingUser, ...userData, updatedAt: new Date() };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      return this.createUser(userData);
    }
  }

  async updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    const updatedUser = { ...user, isPremium, subscriptionStatus: isPremium ? 'active' : 'cancelled', updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    const updatedUser = { 
      ...user, 
      stripeCustomerId, 
      stripeSubscriptionId, 
      isPremium: true, 
      subscriptionStatus: 'active',
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async incrementAnalysisCount(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    const updatedUser = { 
      ...user, 
      monthlyAnalysesUsed: (user.monthlyAnalysesUsed || 0) + 1,
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async resetMonthlyAnalyses(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    const updatedUser = { 
      ...user, 
      monthlyAnalysesUsed: 0,
      lastResetDate: new Date(),
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const newAnalysis: Analysis = {
      ...analysis,
      id: analysis.id || `analysis_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.analyses.set(newAnalysis.id, newAnalysis);
    return newAnalysis;
  }

  async getUserAnalyses(userId: string, limit = 10): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.stripeSubscriptionId === subscriptionId);
  }

  async createUserMetrics(userId: string): Promise<UserMetrics> {
    const metrics: UserMetrics = {
      id: `metrics_${Date.now()}`,
      userId,
      totalAnalyses: 0,
      premiumAnalyses: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userMetrics.set(metrics.id, metrics);
    return metrics;
  }

  async getUserMetrics(userId: string): Promise<UserMetrics | undefined> {
    return Array.from(this.userMetrics.values()).find(metrics => metrics.userId === userId);
  }

  async updateUserMetrics(userId: string, updates: Partial<InsertUserMetrics>): Promise<UserMetrics> {
    const existingMetrics = await this.getUserMetrics(userId);
    if (!existingMetrics) {
      return this.createUserMetrics(userId);
    }
    const updatedMetrics = { ...existingMetrics, ...updates, updatedAt: new Date() };
    this.userMetrics.set(existingMetrics.id, updatedMetrics);
    return updatedMetrics;
  }
}

// Use memory storage in development, database storage in production
export const storage = process.env.NODE_ENV === 'development' 
  ? new MemoryStorage() 
  : new DatabaseStorage();
