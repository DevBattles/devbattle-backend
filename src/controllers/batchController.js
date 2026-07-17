import { batchService } from '../services/batchService.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';

export const batchController = {
  /**
   * List all batches
   */
  async getAllBatches(req, res, next) {
    try {
      const pagination = req.pagination || {};
      const result = await batchService.getAllBatches(pagination);
      return sendSuccess(res, 200, 'Batches retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new batch
   */
  async createBatch(req, res, next) {
    try {
      const { name, collegeId, departmentId } = req.body;
      if (!name || !collegeId || !departmentId) {
        throw new AppError('Name, collegeId, and departmentId are required', 400);
      }

      const batch = await batchService.createBatch({
        name,
        collegeId,
        departmentId,
        createdBy: req.user.id
      });

      return sendSuccess(res, 201, 'Batch created successfully', batch);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a batch
   */
  async deleteBatch(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await batchService.deleteBatch(id);
      return sendSuccess(res, 200, 'Batch deleted successfully', deleted);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get students pending batch assignment (no profile yet)
   */
  async getPendingStudents(req, res, next) {
    try {
      const students = await batchService.getPendingStudents();
      return sendSuccess(res, 200, 'Pending students list retrieved successfully', students);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Enroll student in a batch
   */
  async enrollStudent(req, res, next) {
    try {
      const { batchId } = req.params;
      const { studentId } = req.body;
      if (!studentId) {
        throw new AppError('studentId is required', 400);
      }

      const profile = await batchService.enrollStudent(batchId, studentId);
      return sendSuccess(res, 200, 'Student successfully enrolled in batch', profile);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove student from batch
   */
  async unenrollStudent(req, res, next) {
    try {
      const { batchId } = req.params;
      const { studentId } = req.body;
      if (!studentId) {
        throw new AppError('studentId is required', 400);
      }

      const result = await batchService.unenrollStudent(batchId, studentId);
      return sendSuccess(res, 200, 'Student unenrolled from batch successfully', result);
    } catch (error) {
      next(error);
    }
  }
};
