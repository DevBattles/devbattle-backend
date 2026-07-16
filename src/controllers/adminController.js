import { adminService } from '../services/adminService.js';
import { createCollegeSchema, createDepartmentSchema, approveTeacherSchema } from '../validation/admin.js';
import { sendSuccess } from '../utils/response.js';

export const adminController = {
  /**
   * Approve teacher account
   */
  async approveTeacherAccount(req, res, next) {
    try {
      const { id } = req.params;
      const validated = approveTeacherSchema.parse(req.body);

      const teacher = await adminService.approveTeacherAccount(id, validated.isApproved, req.user.id);
      return sendSuccess(res, 200, `Teacher account ${validated.isApproved ? 'approved' : 'unapproved'} successfully`, teacher);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new college
   */
  async createCollege(req, res, next) {
    try {
      const validated = createCollegeSchema.parse(req.body);
      const college = await adminService.createCollege(validated.name, req.user.id);
      return sendSuccess(res, 201, 'College created successfully', college);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new department
   */
  async createDepartment(req, res, next) {
    try {
      const validated = createDepartmentSchema.parse(req.body);
      const department = await adminService.createDepartment(validated.collegeId, validated.name, req.user.id);
      return sendSuccess(res, 201, 'Department created successfully', department);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all colleges and departments list
   */
  async getCollegesAndDepartments(req, res, next) {
    try {
      const result = await adminService.getCollegesAndDepartments();
      return sendSuccess(res, 200, 'Colleges and departments retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get pending teacher approvals
   */
  async getPendingTeachers(req, res, next) {
    try {
      const pendingTeachers = await adminService.getPendingTeachers();
      return sendSuccess(res, 200, 'Pending teachers retrieved successfully', pendingTeachers);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List all teachers
   */
  async getAllTeachers(req, res, next) {
    try {
      const pagination = req.pagination || {};
      const teachers = await adminService.getAllTeachers(pagination);
      return sendSuccess(res, 200, 'Teachers list retrieved successfully', teachers);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List all students
   */
  async getAllStudents(req, res, next) {
    try {
      const pagination = req.pagination || {};
      const students = await adminService.getAllStudents(pagination);
      return sendSuccess(res, 200, 'Students list retrieved successfully', students);
    } catch (error) {
      next(error);
    }
  }
};
