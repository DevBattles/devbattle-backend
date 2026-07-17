import { db } from '../db/index.js';
import { batches, users, studentProfiles, colleges, departments } from '../schema/index.js';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';

export const batchService = {
  /**
   * Get all batches with metadata
   */
  async getAllBatches(pagination = {}) {
    try {
      const { skip = 0, take = 10 } = pagination;

      const list = await db.select({
        id: batches.id,
        name: batches.name,
        collegeId: batches.collegeId,
        collegeName: colleges.name,
        departmentId: batches.departmentId,
        departmentName: departments.name,
        createdAt: batches.createdAt
      })
      .from(batches)
      .innerJoin(colleges, eq(batches.collegeId, colleges.id))
      .innerJoin(departments, eq(batches.departmentId, departments.id))
      .limit(take)
      .offset(skip);

      // Get count of students in each batch
      const result = [];
      for (const batch of list) {
        const [{ count }] = await db.select({ count: sql`count(*)` })
          .from(studentProfiles)
          .where(eq(studentProfiles.batch, batch.name));
        
        result.push({
          ...batch,
          studentCount: parseInt(count || 0)
        });
      }

      return result;
    } catch (error) {
      logger.error('Error fetching all batches', { error: error.message });
      throw error;
    }
  },

  /**
   * Create a new batch
   */
  async createBatch(batchData) {
    try {
      const [newBatch] = await db.insert(batches).values({
        name: batchData.name,
        collegeId: batchData.collegeId,
        departmentId: batchData.departmentId,
        createdBy: batchData.createdBy
      }).returning();
      return newBatch;
    } catch (error) {
      logger.error('Error creating batch', { error: error.message });
      throw new AppError('Failed to create batch: name must be unique', 400);
    }
  },

  /**
   * Delete a batch
   */
  async deleteBatch(id) {
    try {
      const [deleted] = await db.delete(batches).where(eq(batches.id, id)).returning();
      if (!deleted) throw new AppError('Batch not found', 404);
      return deleted;
    } catch (error) {
      logger.error('Error deleting batch', { id, error: error.message });
      throw error;
    }
  },

  /**
   * Get students pending batch assignment (no profile yet)
   */
  async getPendingStudents() {
    try {
      const list = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt
      })
      .from(users)
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(and(
        eq(users.role, 'student'),
        isNull(studentProfiles.id)
      ));
      
      return list;
    } catch (error) {
      logger.error('Error fetching pending students', { error: error.message });
      throw error;
    }
  },

  /**
   * Enroll a student into a batch
   */
  async enrollStudent(batchId, studentId) {
    try {
      // Get target batch details
      const [targetBatch] = await db.select().from(batches).where(eq(batches.id, batchId));
      if (!targetBatch) {
        throw new AppError('Target batch does not exist', 404);
      }

      // Check if student profile already exists
      const [existingProfile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, studentId));

      if (existingProfile) {
        // Update batch assignment
        const [updated] = await db.update(studentProfiles)
          .set({
            batch: targetBatch.name,
            collegeId: targetBatch.collegeId,
            departmentId: targetBatch.departmentId,
            updatedAt: new Date()
          })
          .where(eq(studentProfiles.id, existingProfile.id))
          .returning();
        return updated;
      } else {
        // Create student profile
        const [created] = await db.insert(studentProfiles)
          .values({
            userId: studentId,
            batch: targetBatch.name,
            collegeId: targetBatch.collegeId,
            departmentId: targetBatch.departmentId,
            batch: targetBatch.name
          })
          .returning();
        return created;
      }
    } catch (error) {
      logger.error('Error enrolling student in batch', { batchId, studentId, error: error.message });
      throw error;
    }
  },

  /**
   * Remove student from batch (deletes student profile)
   */
  async unenrollStudent(batchId, studentId) {
    try {
      const [deleted] = await db.delete(studentProfiles)
        .where(eq(studentProfiles.userId, studentId))
        .returning();
      return { success: true, studentId, deletedProfile: deleted || null };
    } catch (error) {
      logger.error('Error unenrolling student from batch', { batchId, studentId, error: error.message });
      throw error;
    }
  }
};
