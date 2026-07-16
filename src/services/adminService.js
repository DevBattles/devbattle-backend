import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';
import { UserDTO } from '../dto/index.js';

export const adminService = {
  /**
   * Toggle teacher approval status
   */
  async approveTeacherAccount(teacherId, isApproved) {
    try {
      const teacher = await userRepository.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        throw new AppError('Teacher account not found', 404);
      }

      const updated = await userRepository.updateTeacherApproval(teacherId, isApproved);
      return UserDTO.toResponse(updated);
    } catch (error) {
      logger.error('Error approving teacher account', { teacherId, error: error.message });
      throw error;
    }
  },

  /**
   * Create a new college
   */
  async createCollege(name) {
    try {
      if (!name) throw new AppError('College name is required', 400);
      const college = await userRepository.createCollege(name);
      return college;
    } catch (error) {
      logger.error('Error creating college', { name, error: error.message });
      throw error;
    }
  },

  /**
   * Create a new department
   */
  async createDepartment(collegeId, name) {
    try {
      if (!collegeId || !name) throw new AppError('College ID and Department name are required', 400);
      
      const college = await userRepository.findCollegeById(collegeId);
      if (!college) throw new AppError('College not found', 404);

      const dept = await userRepository.createDepartment(collegeId, name);
      return dept;
    } catch (error) {
      logger.error('Error creating department', { name, error: error.message });
      throw error;
    }
  },

  /**
   * Get all colleges and departments setup in the app
   */
  async getCollegesAndDepartments() {
    const collegesList = await userRepository.getAllColleges();
    const departmentsList = await userRepository.getAllDepartments();
    return { colleges: collegesList, departments: departmentsList };
  },

  /**
   * Get list of all teachers for admin view
   */
  async getAllTeachers(pagination = {}) {
    const skip = pagination.skip || 0;
    const take = pagination.take || 10;
    const teachersList = await userRepository.getAllTeachers(skip, take);
    return teachersList.map(t => ({
      id: t.id,
      username: t.username,
      email: t.email,
      isApproved: t.isApproved,
      profile: t.profile
    }));
  },

  /**
   * Get list of all students for admin view
   */
  async getAllStudents(pagination = {}) {
    const skip = pagination.skip || 0;
    const take = pagination.take || 10;
    const studentsList = await userRepository.getAllStudents(skip, take);
    return studentsList.map(s => ({
      id: s.id,
      username: s.username,
      email: s.email,
      profile: s.profile
    }));
  }
};
