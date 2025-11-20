import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface SessionData {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  lastActivity?: number;
  [key: string]: any;
}

@Injectable()
export class SessionService {
  private readonly SESSION_PREFIX = 'session:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Create a new session
   */
  async createSession(sessionId: string, data: SessionData, ttl?: number): Promise<void> {
    const key = this.getSessionKey(sessionId);
    const sessionData = {
      ...data,
      lastActivity: Date.now(),
    };
    await this.redisService.set(key, sessionData, ttl || 86400);
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = this.getSessionKey(sessionId);
    return await this.redisService.get<SessionData>(key);
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, data: Partial<SessionData>, ttl?: number): Promise<void> {
    const key = this.getSessionKey(sessionId);
    const existingSession = await this.getSession(sessionId);

    if (existingSession) {
      const updatedSession = { 
        ...existingSession, 
        ...data,
        lastActivity: Date.now(),
      };
      await this.redisService.set(key, updatedSession, ttl || 86400);
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = this.getSessionKey(sessionId);
    await this.redisService.del(key);
  }

  /**
   * Refresh session TTL
   */
  async refreshSession(sessionId: string, ttl?: number): Promise<void> {
    const key = this.getSessionKey(sessionId);
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      await this.redisService.set(key, session, ttl || 86400);
    }
  }

  /**
   * Check if session is idle
   */
  async isSessionIdle(sessionId: string, idleTimeout: number): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session || !session.lastActivity) {
      return true;
    }
    const idleTime = Date.now() - session.lastActivity;
    return idleTime > idleTimeout * 1000;
  }

  /**
   * Check if session exists
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    const key = this.getSessionKey(sessionId);
    return await this.redisService.exists(key);
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<string[]> {
    const pattern = `${this.SESSION_PREFIX}*`;
    const client = this.redisService.getClient();
    const keys = await client.keys(pattern);

    const userSessions: string[] = [];

    for (const key of keys) {
      const session = await this.redisService.get<SessionData>(
        key.replace(`whatscrm:${this.SESSION_PREFIX}`, '')
      );
      if (session && session.userId === userId) {
        userSessions.push(key);
      }
    }

    return userSessions;
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    for (const sessionKey of sessions) {
      await this.redisService.del(sessionKey.replace('whatscrm:', ''));
    }
  }

  /**
   * Get session key with prefix
   */
  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }
}
