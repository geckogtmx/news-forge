import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type User, type InsertUser } from '../db/schema';

/**
 * UserService - Handles all user-related database operations
 */
export class UserService {
    /**
     * Create a new user
     */
    async createUser(data: Omit<InsertUser, 'id' | 'createdAt' | 'updatedAt' | 'lastSignedIn'>): Promise<User> {
        const result = await db.insert(users).values(data).returning();
        return result[0];
    }

    /**
     * Get user by ID
     */
    async getUserById(id: number): Promise<User | undefined> {
        const result = await db.select().from(users).where(eq(users.id, id));
        return result[0];
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | undefined> {
        const result = await db.select().from(users).where(eq(users.email, email));
        return result[0];
    }

    /**
     * Get user by openId
     */
    async getUserByOpenId(openId: string): Promise<User | undefined> {
        const result = await db.select().from(users).where(eq(users.openId, openId));
        return result[0];
    }

    /**
     * Update user details
     */
    async updateUser(id: number, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
        const result = await db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return result[0];
    }

    /**
     * Update last signed in timestamp
     */
    async updateLastSignedIn(id: number): Promise<User | undefined> {
        const result = await db
            .update(users)
            .set({ lastSignedIn: new Date() })
            .where(eq(users.id, id))
            .returning();
        return result[0];
    }

    /**
     * Delete user (soft delete - for now, actual delete)
     * In the future, you may want to add a deletedAt field for soft deletes
     */
    async deleteUser(id: number): Promise<boolean> {
        const result = await db.delete(users).where(eq(users.id, id)).returning();
        return result.length > 0;
    }

    /**
     * Get all users (mainly for admin purposes)
     */
    async getAllUsers(): Promise<User[]> {
        return await db.select().from(users);
    }

    /**
     * Check if user exists by email
     */
    async userExistsByEmail(email: string): Promise<boolean> {
        const user = await this.getUserByEmail(email);
        return !!user;
    }

    /**
     * Check if user exists by openId
     */
    async userExistsByOpenId(openId: string): Promise<boolean> {
        const user = await this.getUserByOpenId(openId);
        return !!user;
    }
}

// Export singleton instance
export const userService = new UserService();
