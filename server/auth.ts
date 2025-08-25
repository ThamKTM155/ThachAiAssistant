import { db } from "./db";
import { users, userSessions, auditLogs } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, validatePassword, generateToken } from "./middleware/auth";
import crypto from "crypto";

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export class AuthService {
  async register(userData: RegisterRequest, ipAddress: string, userAgent: string) {
    try {
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email));
      
      if (existingUser.length > 0) {
        throw new Error("User with this email already exists");
      }

      // Create user
      const userId = crypto.randomUUID();
      const passwordHash = await hashPassword(userData.password);
      
      const newUser = {
        id: userId,
        email: userData.email,
        passwordHash,
        name: userData.name,
        role: "user",
        emailVerified: false,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.insert(users).values(newUser);

      // Log registration
      await this.logAuditEvent(userId, "USER_REGISTER", "AUTH", ipAddress, userAgent, true);

      // Generate token
      const token = generateToken({ id: userId, email: userData.email, role: "user" });
      
      // Create session
      await this.createSession(userId, token, ipAddress, userAgent);

      return {
        user: {
          id: userId,
          email: userData.email,
          name: userData.name,
          role: "user"
        },
        token
      };
    } catch (error) {
      await this.logAuditEvent(null, "USER_REGISTER_FAILED", "AUTH", ipAddress, userAgent, false, { error: error.message });
      throw error;
    }
  }

  async login(credentials: LoginRequest, ipAddress: string, userAgent: string) {
    try {
      // Find user
      const userResult = await db.select().from(users).where(eq(users.email, credentials.email));
      
      if (userResult.length === 0) {
        throw new Error("Invalid email or password");
      }

      const user = userResult[0];

      // Validate password
      const isValidPassword = await validatePassword(credentials.password, user.passwordHash);
      
      if (!isValidPassword) {
        await this.logAuditEvent(user.id, "LOGIN_FAILED", "AUTH", ipAddress, userAgent, false, { reason: "invalid_password" });
        throw new Error("Invalid email or password");
      }

      // Update last login
      await db.update(users)
        .set({ lastLogin: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id));

      // Generate token
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      
      // Create session
      await this.createSession(user.id, token, ipAddress, userAgent);

      // Log successful login
      await this.logAuditEvent(user.id, "LOGIN_SUCCESS", "AUTH", ipAddress, userAgent, true);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      };
    } catch (error) {
      await this.logAuditEvent(null, "LOGIN_FAILED", "AUTH", ipAddress, userAgent, false, { error: error.message });
      throw error;
    }
  }

  async logout(userId: string, token: string, ipAddress: string, userAgent: string) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Remove session
      await db.delete(userSessions).where(eq(userSessions.tokenHash, tokenHash));
      
      // Log logout
      await this.logAuditEvent(userId, "LOGOUT", "AUTH", ipAddress, userAgent, true);
      
      return { success: true };
    } catch (error) {
      await this.logAuditEvent(userId, "LOGOUT_FAILED", "AUTH", ipAddress, userAgent, false, { error: error.message });
      throw error;
    }
  }

  async validateSession(token: string): Promise<any> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const sessionResult = await db.select()
        .from(userSessions)
        .innerJoin(users, eq(userSessions.userId, users.id))
        .where(
          and(
            eq(userSessions.tokenHash, tokenHash),
            gt(userSessions.expiresAt, new Date())
          )
        );

      if (sessionResult.length === 0) {
        return null;
      }

      return {
        id: sessionResult[0].users.id,
        email: sessionResult[0].users.email,
        name: sessionResult[0].users.name,
        role: sessionResult[0].users.role
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return null;
    }
  }

  private async createSession(userId: string, token: string, ipAddress: string, userAgent: string) {
    const sessionId = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(userSessions).values({
      id: sessionId,
      userId,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
      createdAt: new Date()
    });
  }

  private async logAuditEvent(
    userId: string | null,
    action: string,
    resource: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details?: any
  ) {
    try {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        userId,
        action,
        resource,
        ipAddress,
        userAgent: userAgent || '',
        success,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Audit logging failed:", error);
    }
  }

  async cleanupExpiredSessions() {
    try {
      await db.delete(userSessions).where(
        and(
          eq(userSessions.expiresAt, new Date())
        )
      );
    } catch (error) {
      console.error("Session cleanup failed:", error);
    }
  }
}

export const authService = new AuthService();