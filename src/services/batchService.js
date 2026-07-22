import { db } from '../db/index.js';
import { batches, users, studentProfiles, colleges, departments } from '../schema/index.js';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';
import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository.js';
import { notificationService } from './notificationService.js';

function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  return result;
}

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
        joinCode: batches.joinCode,
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
      const creator = await userRepository.findById(batchData.createdBy);
      if (!creator || (creator.role === 'teacher' && creator.status !== 'ACTIVE')) {
        throw new AppError('Your teacher account is pending approval or rejected. You cannot create batches.', 403);
      }

      let joinCode;
      let isUnique = false;
      while (!isUnique) {
        joinCode = generateJoinCode();
        const [existing] = await db.select().from(batches).where(eq(batches.joinCode, joinCode));
        if (!existing) {
          isUnique = true;
        }
      }

      const [newBatch] = await db.insert(batches).values({
        name: batchData.name,
        joinCode,
        collegeId: batchData.collegeId,
        departmentId: batchData.departmentId,
        createdBy: batchData.createdBy
      }).returning();
      return newBatch;
    } catch (error) {
      logger.error('Error creating batch', { error: error.message });
      if (error instanceof AppError) throw error;
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

      // Update student status to ACTIVE
      await db.update(users).set({ status: 'ACTIVE', updatedAt: new Date() }).where(eq(users.id, studentId));

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
  },

  /**
   * Regenerate the join code for a batch
   */
  async regenerateJoinCode(batchId) {
    try {
      const [batch] = await db.select().from(batches).where(eq(batches.id, batchId));
      if (!batch) {
        throw new AppError('Batch not found', 404);
      }

      let newCode;
      let isUnique = false;
      while (!isUnique) {
        newCode = generateJoinCode();
        const [existing] = await db.select().from(batches).where(eq(batches.joinCode, newCode));
        if (!existing) {
          isUnique = true;
        }
      }

      const [updated] = await db.update(batches)
        .set({
          joinCode: newCode,
          updatedAt: new Date()
        })
        .where(eq(batches.id, batchId))
        .returning();

      return updated;
    } catch (error) {
      logger.error('Error regenerating join code', { batchId, error: error.message });
      throw error;
    }
  },

  /**
   * Submit join batch request using a join code (for students)
   */
  async joinBatchByCode(studentId, joinCode) {
    try {
      if (!joinCode) {
        throw new AppError('Join code is required', 400);
      }

      const [targetBatch] = await db.select().from(batches).where(eq(batches.joinCode, joinCode.toUpperCase().trim()));
      if (!targetBatch) {
        throw new AppError('Invalid join code: Batch not found', 404);
      }

      // Check if student is already enrolled in this batch
      const [existingProfile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, studentId));
      if (existingProfile && existingProfile.batch === targetBatch.name) {
        throw new AppError('You are already enrolled in this batch', 400);
      }

      // Check if student already has a pending join request for this batch
      const existingRequest = await userRepository.findPendingJoinRequest(targetBatch.id, studentId);
      if (existingRequest) {
        throw new AppError('You already have a pending join request for this batch', 400);
      }

      // Create pending join request
      const joinRequest = await userRepository.createBatchJoinRequest({
        batchId: targetBatch.id,
        studentId
      });

      const student = await userRepository.findById(studentId);

      // Notify the teacher who created the batch
      await notificationService.createNotification({
        userId: targetBatch.createdBy,
        title: 'New Batch Join Request',
        message: `Student "${student?.username || 'A student'}" has requested to join your batch "${targetBatch.name}".`,
        type: 'general',
        metadata: { requestId: joinRequest.id, batchId: targetBatch.id }
      });

      return {
        success: true,
        pending: true,
        message: 'Join request submitted! Awaiting teacher approval.',
        batch: targetBatch
      };
    } catch (error) {
      logger.error('Error submitting batch join request', { studentId, joinCode, error: error.message });
      throw error;
    }
  },

  /**
   * Get pending join requests for teacher/admin
   */
  async getJoinRequests(userId, role) {
    if (role === 'admin') {
      return await userRepository.getPendingJoinRequestsForTeacher(null);
    }
    return await userRepository.getPendingJoinRequestsForTeacher(userId);
  },

  /**
   * Accept student's batch join request
   */
  async acceptJoinRequest(requestId, userId, role) {
    const request = await userRepository.getJoinRequestById(requestId);
    if (!request) throw new AppError('Join request not found', 404);
    if (request.status !== 'pending') throw new AppError('Join request has already been processed', 400);

    const [targetBatch] = await db.select().from(batches).where(eq(batches.id, request.batchId));
    if (!targetBatch) throw new AppError('Batch not found', 404);

    if (role !== 'admin' && targetBatch.createdBy !== userId) {
      throw new AppError('Forbidden: Only the batch creator can approve join requests', 403);
    }

    // Enroll student in batch
    await this.enrollStudent(targetBatch.id, request.studentId);

    // Update request status to accepted / remove
    await userRepository.deleteJoinRequest(requestId);

    // Notify student
    await notificationService.createNotification({
      userId: request.studentId,
      title: 'Batch Join Request Accepted',
      message: `Your request to join batch "${targetBatch.name}" has been accepted!`,
      type: 'general',
      metadata: { batchId: targetBatch.id }
    });

    return { success: true, message: `Approved join request for batch ${targetBatch.name}` };
  },

  /**
   * Reject student's batch join request
   */
  async rejectJoinRequest(requestId, userId, role) {
    const request = await userRepository.getJoinRequestById(requestId);
    if (!request) throw new AppError('Join request not found', 404);
    if (request.status !== 'pending') throw new AppError('Join request has already been processed', 400);

    const [targetBatch] = await db.select().from(batches).where(eq(batches.id, request.batchId));
    if (!targetBatch) throw new AppError('Batch not found', 404);

    if (role !== 'admin' && targetBatch.createdBy !== userId) {
      throw new AppError('Forbidden: Only the batch creator can reject join requests', 403);
    }

    // Delete request record
    await userRepository.deleteJoinRequest(requestId);

    // Notify student
    await notificationService.createNotification({
      userId: request.studentId,
      title: 'Batch Join Request Rejected',
      message: `Your request to join batch "${targetBatch.name}" was rejected by the teacher.`,
      type: 'general',
      metadata: { batchId: targetBatch.id }
    });

    return { success: true, message: `Rejected join request for batch ${targetBatch.name}` };
  },

  /**
   * Get student's pending join requests
   */
  async getStudentPendingRequests(studentId) {
    return await userRepository.getStudentPendingJoinRequests(studentId);
  },

  /**
   * Get all students who joined a batch
   */
  async getStudentsInBatch(batchId) {
    try {
      const [targetBatch] = await db.select().from(batches).where(eq(batches.id, batchId));
      if (!targetBatch) {
        throw new AppError('Batch not found', 404);
      }

      const list = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: studentProfiles.createdAt
      })
      .from(users)
      .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(eq(studentProfiles.batch, targetBatch.name));

      return list;
    } catch (error) {
      logger.error('Error fetching students in batch', { batchId, error: error.message });
      throw error;
    }
  }
};

