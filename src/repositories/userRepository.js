import { db } from '../db/index.js';
import { users, colleges, departments, teacherProfiles, studentProfiles } from '../schema/index.js';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const userRepository = {
  /**
   * Find a user by their email address
   */
  async findByEmail(email) {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return user || null;
    } catch (error) {
      logger.error('Error in userRepository.findByEmail', { email, error: error.message });
      throw error;
    }
  },

  /**
   * Find a user by their username
   */
  async findByUsername(username) {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return user || null;
    } catch (error) {
      logger.error('Error in userRepository.findByUsername', { username, error: error.message });
      throw error;
    }
  },

  /**
   * Find a user by their ID
   */
  async findById(id) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return user || null;
    } catch (error) {
      logger.error('Error in userRepository.findById', { id, error: error.message });
      throw error;
    }
  },

  async getUserById(id) {
    return this.findById(id);
  },

  /**
   * Create a new user
   */
  async createUser(userData) {
    try {
      const [user] = await db.insert(users).values({
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash,
        role: userData.role,
        isApproved: userData.role === 'teacher' ? false : true,
      }).returning();
      
      return user;
    } catch (error) {
      logger.error('Error in userRepository.createUser', { username: userData.username, error: error.message });
      throw error;
    }
  },

  /**
   * Create teacher profile
   */
  async createTeacherProfile(profileData) {
    const [profile] = await db.insert(teacherProfiles).values(profileData).returning();
    return profile;
  },

  /**
   * Create student profile
   */
  async createStudentProfile(profileData) {
    const [profile] = await db.insert(studentProfiles).values(profileData).returning();
    return profile;
  },

  /**
   * Get teacher profile
   */
  async getTeacherProfileByUserId(userId) {
    const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
    return profile || null;
  },

  /**
   * Get student profile
   */
  async getStudentProfileByUserId(userId) {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
    return profile || null;
  },

  /**
   * Update teacher profile
   */
  async updateTeacherProfile(userId, updateData) {
    const [profile] = await db.update(teacherProfiles).set(updateData).where(eq(teacherProfiles.userId, userId)).returning();
    return profile;
  },

  /**
   * Update student profile
   */
  async updateStudentProfile(userId, updateData) {
    const [profile] = await db.update(studentProfiles).set(updateData).where(eq(studentProfiles.userId, userId)).returning();
    return profile;
  },

  /**
   * Approve teacher account
   */
  async updateTeacherApproval(userId, isApproved) {
    const [user] = await db.update(users).set({ isApproved, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    return user;
  },

  /**
   * Create college
   */
  async createCollege(name) {
    const [college] = await db.insert(colleges).values({ name }).returning();
    return college;
  },

  /**
   * Get college by ID
   */
  async findCollegeById(id) {
    const [college] = await db.select().from(colleges).where(eq(colleges.id, id));
    return college || null;
  },

  /**
   * Get all colleges
   */
  async getAllColleges() {
    return db.select().from(colleges).orderBy(asc(colleges.name));
  },

  /**
   * Create department
   */
  async createDepartment(collegeId, name) {
    const [dept] = await db.insert(departments).values({ collegeId, name }).returning();
    return dept;
  },

  /**
   * Get department by ID
   */
  async findDepartmentById(id) {
    const [dept] = await db.select().from(departments).where(eq(departments.id, id));
    return dept || null;
  },

  /**
   * Get all departments
   */
  async getAllDepartments() {
    return db.select().from(departments).orderBy(asc(departments.name));
  },

  /**
   * Get departments by college
   */
  async getDepartmentsByCollege(collegeId) {
    return db.select().from(departments).where(eq(departments.collegeId, collegeId)).orderBy(asc(departments.name));
  },

  /**
   * Admin lists all teachers
   */
  async getAllTeachers(skip = 0, take = 10) {
    const list = await db.select()
      .from(users)
      .leftJoin(teacherProfiles, eq(users.id, teacherProfiles.userId))
      .where(eq(users.role, 'teacher'))
      .limit(take)
      .offset(skip);
    return list.map(item => ({ ...item.users, profile: item.teacher_profiles }));
  },

  /**
   * Get pending teacher approvals
   */
  async getPendingTeachers() {
    const list = await db.select()
      .from(users)
      .leftJoin(teacherProfiles, eq(users.id, teacherProfiles.userId))
      .where(and(eq(users.role, 'teacher'), eq(users.isApproved, false)))
      .orderBy(desc(users.createdAt));
    return list.map(item => ({ ...item.users, profile: item.teacher_profiles }));
  },

  /**
   * Admin lists all students
   */
  async getAllStudents(skip = 0, take = 10) {
    const list = await db.select()
      .from(users)
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(eq(users.role, 'student'))
      .limit(take)
      .offset(skip);
    return list.map(item => ({ ...item.users, profile: item.student_profiles }));
  }
};
