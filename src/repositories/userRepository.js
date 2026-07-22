import { db } from '../db/index.js';
import { users, colleges, departments, teacherProfiles, studentProfiles, batches, batchJoinRequests } from '../schema/index.js';
import { eq, and, desc, asc, sql, isNull, or } from 'drizzle-orm';
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
   * Find a user by Google ID
   */
  async findByGoogleId(googleId) {
    try {
      const [user] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
      return user || null;
    } catch (error) {
      logger.error('Error in userRepository.findByGoogleId', { googleId, error: error.message });
      throw error;
    }
  },

  /**
   * Create a new user
   */
  async createUser(userData) {
    try {
      const [user] = await db.insert(users).values({
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash || null,
        role: userData.role,
        status: userData.status || (userData.role === 'teacher' ? 'PENDING_APPROVAL' : 'ACTIVE'),
        isEmailVerified: userData.isEmailVerified ?? false,
        otpCode: userData.otpCode || null,
        otpExpiresAt: userData.otpExpiresAt || null,
        otpLastSentAt: userData.otpLastSentAt || null,
        googleId: userData.googleId || null,
      }).returning();
      
      return user;
    } catch (error) {
      logger.error('Error in userRepository.createUser', { username: userData.username, error: error.message });
      throw error;
    }
  },

  /**
   * Update user profile information
   */
  async updateUserProfile(userId, profileData) {
    const [user] = await db.update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  },

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, preferences) {
    const [user] = await db.update(users)
      .set({
        preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  },

  /**
   * Update user avatar
   */
  async updateUserAvatar(userId, avatarUrl) {
    const [user] = await db.update(users)
      .set({
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  },

  /**
   * Get full user profile with related roles (student/teacher)
   */
  async getFullUserProfile(userId) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return null;

    let profile = null;
    if (user.role === 'teacher') {
      const [tProfile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1);
      profile = tProfile || null;
    } else if (user.role === 'student') {
      const [sProfile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
      profile = sProfile || null;
    }

    return { ...user, profile };
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
    const [user] = await db.update(users).set({ status: isApproved ? 'ACTIVE' : 'PENDING_APPROVAL', updatedAt: new Date() }).where(eq(users.id, userId)).returning();
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
      .where(and(eq(users.role, 'teacher'), eq(users.status, 'PENDING_APPROVAL')))
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
  },

  /**
   * Create a new batch join request
   */
  async createBatchJoinRequest(data) {
    const [request] = await db.insert(batchJoinRequests).values({
      batchId: data.batchId,
      studentId: data.studentId,
      status: 'pending'
    }).returning();
    return request;
  },

  /**
   * Get pending join requests for a teacher's batches (or all if teacherId is null)
   */
  async getPendingJoinRequestsForTeacher(teacherId = null) {
    let query = db.select({
      id: batchJoinRequests.id,
      batchId: batchJoinRequests.batchId,
      studentId: batchJoinRequests.studentId,
      status: batchJoinRequests.status,
      createdAt: batchJoinRequests.createdAt,
      studentName: users.username,
      studentEmail: users.email,
      batchName: batches.name,
      collegeName: colleges.name,
      departmentName: departments.name
    })
    .from(batchJoinRequests)
    .innerJoin(users, eq(batchJoinRequests.studentId, users.id))
    .innerJoin(batches, eq(batchJoinRequests.batchId, batches.id))
    .innerJoin(colleges, eq(batches.collegeId, colleges.id))
    .innerJoin(departments, eq(batches.departmentId, departments.id));

    if (teacherId) {
      query = query.where(and(eq(batches.createdBy, teacherId), eq(batchJoinRequests.status, 'pending')));
    } else {
      query = query.where(eq(batchJoinRequests.status, 'pending'));
    }

    return await query.orderBy(desc(batchJoinRequests.createdAt));
  },

  /**
   * Get student's pending join requests
   */
  async getStudentPendingJoinRequests(studentId) {
    const list = await db.select({
      id: batchJoinRequests.id,
      batchId: batchJoinRequests.batchId,
      batchName: batches.name,
      status: batchJoinRequests.status,
      createdAt: batchJoinRequests.createdAt
    })
    .from(batchJoinRequests)
    .innerJoin(batches, eq(batchJoinRequests.batchId, batches.id))
    .where(and(eq(batchJoinRequests.studentId, studentId), eq(batchJoinRequests.status, 'pending')));

    return list;
  },

  /**
   * Check if a student has an existing pending join request for a batch
   */
  async findPendingJoinRequest(batchId, studentId) {
    const [existing] = await db.select()
      .from(batchJoinRequests)
      .where(and(
        eq(batchJoinRequests.batchId, batchId),
        eq(batchJoinRequests.studentId, studentId),
        eq(batchJoinRequests.status, 'pending')
      ));
    return existing || null;
  },

  /**
   * Get join request by ID
   */
  async getJoinRequestById(requestId) {
    const [request] = await db.select().from(batchJoinRequests).where(eq(batchJoinRequests.id, requestId));
    return request || null;
  },

  /**
   * Update join request status
   */
  async updateJoinRequestStatus(requestId, status) {
    const [updated] = await db.update(batchJoinRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(batchJoinRequests.id, requestId))
      .returning();
    return updated;
  },

  /**
   * Delete join request
   */
  async deleteJoinRequest(requestId) {
    const [deleted] = await db.delete(batchJoinRequests).where(eq(batchJoinRequests.id, requestId)).returning();
    return deleted;
  },

  /**
   * Get students who have registered but have not joined any batch
   */
  async getStudentsWithoutBatch() {
    const list = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt,
      status: users.status
    })
    .from(users)
    .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .where(and(
      eq(users.role, 'student'),
      or(isNull(studentProfiles.id), isNull(studentProfiles.batch), eq(studentProfiles.batch, ''))
    ))
    .orderBy(desc(users.createdAt));

    return list;
  }
};

