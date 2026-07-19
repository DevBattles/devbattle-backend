/**
 * DevBattles Database Seed Script
 * 
 * This script populates the database with initial test data for development and testing.
 * It creates:
 * - Colleges and departments
 * - Admin, teacher, and student accounts
 * - Sample questions for the question bank
 * - Homework assignments
 * - Contests and contest participants
 * - Sample submissions and evaluations
 * - Leaderboard data
 * - Notifications and certificates
 * 
 * Usage:
 *   node scripts/seed.js
 * 
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string
 *   NODE_ENV - Development/Production environment
 * 
 * Note: This script will clear all existing data before seeding.
 * Use with caution in production environments.
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { db } from '../src/db/index.js';
import { 
  users, colleges, departments, studentProfiles, teacherProfiles,
  questionBank, questionVersions, homeworks, homeworkQuestions,
  homeworkAssignments, homeworkSubmissions, contests, contestQuestions,
  contestParticipants, contestSubmissions, leaderboards, notifications, certificates
} from '../src/schema/index.js';

dotenv.config();

const seed = async () => {
  try {
    console.log('⏳ Seeding DevBattles Database...');

    // Clear existing data in reverse order of foreign keys
    console.log('🧹 Cleaning old records...');
    await db.delete(certificates);
    await db.delete(notifications);
    await db.delete(leaderboards);
    await db.delete(contestSubmissions);
    await db.delete(contestParticipants);
    await db.delete(contestQuestions);
    await db.delete(contests);
    await db.delete(homeworkSubmissions);
    await db.delete(homeworkAssignments);
    await db.delete(homeworkQuestions);
    await db.delete(homeworks);
    await db.delete(questionVersions);
    await db.delete(questionBank);
    await db.delete(studentProfiles);
    await db.delete(teacherProfiles);
    await db.delete(departments);
    await db.delete(colleges);
    await db.delete(users);

    const passwordHash = await bcrypt.hash('Password@123', 10);

    // 1. Create Colleges
    console.log('🏛️ Seeding Colleges & Departments...');
    const [college1] = await db.insert(colleges).values({ name: 'MIT College of Engineering' }).returning();
    const [college2] = await db.insert(colleges).values({ name: 'Stanford Institute of Technology' }).returning();

    // 2. Create Departments
    const [deptCS1] = await db.insert(departments).values({ collegeId: college1.id, name: 'Computer Science' }).returning();
    const [deptIT1] = await db.insert(departments).values({ collegeId: college1.id, name: 'Information Technology' }).returning();
    const [deptCS2] = await db.insert(departments).values({ collegeId: college2.id, name: 'Computer Science' }).returning();

    // 3. Create Users
    console.log('👥 Seeding Users...');
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      email: 'admin@devbattles.com',
      passwordHash,
      role: 'admin',
      status: 'ACTIVE'
    }).returning();

    const [teacher1] = await db.insert(users).values({
      username: 'teacher_smith',
      email: 'smith@devbattles.com',
      passwordHash,
      role: 'teacher',
      status: 'ACTIVE'
    }).returning();

    const [teacher2] = await db.insert(users).values({
      username: 'teacher_davis',
      email: 'davis@devbattles.com',
      passwordHash,
      role: 'teacher',
      status: 'ACTIVE'
    }).returning();

    const [student1] = await db.insert(users).values({
      username: 'student_alice',
      email: 'alice@devbattles.com',
      passwordHash,
      role: 'student',
      status: 'ACTIVE'
    }).returning();

    const [student2] = await db.insert(users).values({
      username: 'student_bob',
      email: 'bob@devbattles.com',
      passwordHash,
      role: 'student',
      status: 'ACTIVE'
    }).returning();

    // 4. Create Profiles
    await db.insert(teacherProfiles).values({
      userId: teacher1.id,
      collegeId: college1.id,
      departmentId: deptCS1.id,
      bio: 'Principal Professor of Computer Science at MIT with 15 years coding experience.'
    });

    await db.insert(teacherProfiles).values({
      userId: teacher2.id,
      collegeId: college2.id,
      departmentId: deptCS2.id,
      bio: 'Web Development Lead and Coding Mentor.'
    });

    await db.insert(studentProfiles).values({
      userId: student1.id,
      collegeId: college1.id,
      departmentId: deptCS1.id,
      batch: 'Batch-2026'
    });

    await db.insert(studentProfiles).values({
      userId: student2.id,
      collegeId: college1.id,
      departmentId: deptIT1.id,
      batch: 'Batch-2026'
    });

    // 5. Create Questions
    console.log('📝 Seeding Question Bank...');
    const [q1] = await db.insert(questionBank).values({
      title: 'Build a Responsive Navbar',
      description: 'Implement a mobile-friendly navigation header using HTML and Tailwind CSS.',
      difficulty: 'easy',
      estimatedTime: '30 mins',
      techStack: ['HTML', 'Tailwind'],
      tags: ['frontend', 'responsive'],
      requirements: ['Must toggle on mobile viewport', 'Include 4 navigation links'],
      starterFiles: { 'index.html': { content: '<nav>Navbar Code here</nav>' } },
      expectedOutput: 'A responsive sliding menu header',
      createdBy: teacher1.id,
      published: true
    }).returning();

    const [q2] = await db.insert(questionBank).values({
      title: 'REST API Todo List Handler',
      description: 'Write a Node/Express backend router for managing TODO tasks.',
      difficulty: 'medium',
      estimatedTime: '45 mins',
      techStack: ['Node', 'Express'],
      tags: ['backend', 'api'],
      requirements: ['Include GET, POST, DELETE handlers', 'Validate input objects'],
      starterFiles: { 'app.js': { content: 'const express = require("express");' } },
      expectedOutput: 'Express application running with todo handlers',
      createdBy: teacher1.id,
      published: true
    }).returning();

    const [q3] = await db.insert(questionBank).values({
      title: 'React Custom Fetch Hook',
      description: 'Implement a reusable React hook `useFetch` to handle caching and errors.',
      difficulty: 'hard',
      estimatedTime: '60 mins',
      techStack: ['React', 'JavaScript'],
      tags: ['react', 'hooks'],
      requirements: ['Return data, loading, and error states', 'Implement abort controller cleanup'],
      starterFiles: { 'useFetch.js': { content: 'export default function useFetch() {}' } },
      expectedOutput: 'Custom hook that manages API fetching states',
      createdBy: teacher2.id,
      published: true
    }).returning();

    // Add question versions
    await db.insert(questionVersions).values([
      { questionId: q1.id, version: 1, title: q1.title, description: q1.description, techStack: q1.techStack, expectedOutput: q1.expectedOutput },
      { questionId: q2.id, version: 1, title: q2.title, description: q2.description, techStack: q2.techStack, expectedOutput: q2.expectedOutput },
      { questionId: q3.id, version: 1, title: q3.title, description: q3.description, techStack: q3.techStack, expectedOutput: q3.expectedOutput }
    ]);

    // 6. Create Homeworks
    console.log('📚 Seeding Homeworks & Assignments...');
    const [hw1] = await db.insert(homeworks).values({
      title: 'Web Design Basics',
      description: 'Review responsive components and implement your first responsive page.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: teacher1.id,
      published: true
    }).returning();

    await db.insert(homeworkQuestions).values({
      homeworkId: hw1.id,
      questionId: q1.id,
      order: 1
    });

    await db.insert(homeworkAssignments).values({
      homeworkId: hw1.id,
      batch: 'Batch-2026',
      assignedBy: teacher1.id
    });

    // 7. Create Contests
    console.log('🏆 Seeding Contests & Submissions...');
    const [contest1] = await db.insert(contests).values({
      title: 'DevBattles Grand Launch Contest',
      description: 'Our launch contest containing challenges from HTML to Node REST API.',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
      published: true,
      status: 'started',
      createdBy: teacher2.id
    }).returning();

    await db.insert(contestQuestions).values([
      { contestId: contest1.id, questionId: q2.id, order: 1, points: 100 },
      { contestId: contest1.id, questionId: q3.id, order: 2, points: 150 }
    ]);

    await db.insert(contestParticipants).values({
      contestId: contest1.id,
      userId: student2.id,
      joinedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    });

    // 8. Seeding Submissions & AI evaluation
    const mockReport = {
      score: 95,
      grade: 'A',
      feedback: 'Excellent work. Perfect organization and responsive structure.',
      report: { codeQuality: 98, performance: 92, suggestions: ['Minor inline comments could be cleaner'] }
    };

    await db.insert(contestSubmissions).values({
      contestId: contest1.id,
      studentId: student2.id,
      questionId: q2.id,
      questionVersion: 1,
      files: { 'app.js': { content: 'console.log("Bob finished TODO API!")' } },
      githubRepo: 'https://github.com/bob/todo-contest',
      livePreview: 'https://todo-contest.demo.devbattles.com',
      status: 'graded',
      score: 95,
      grade: 'A',
      feedback: mockReport.feedback,
      report: mockReport.report
    });

    await db.insert(homeworkSubmissions).values({
      homeworkId: hw1.id,
      studentId: student1.id,
      questionId: q1.id,
      questionVersion: 1,
      files: { 'index.html': { content: '<nav class="flex">Alice Navbar</nav>' } },
      githubRepo: 'https://github.com/alice/navbar-hw',
      livePreview: 'https://alice.demo.devbattles.com',
      status: 'graded',
      score: 88,
      grade: 'B',
      feedback: 'Very good layout. Responsive menu works on iPad and iPhones.',
      report: { codeQuality: 88, performance: 90 }
    });

    // 9. Seeding Leaderboards
    console.log('📊 Seeding Leaderboards...');
    await db.insert(leaderboards).values([
      { userId: student1.id, score: 88, rank: 2, type: 'global', updatedAt: new Date() },
      { userId: student2.id, score: 95, rank: 1, type: 'global', updatedAt: new Date() },
      { userId: student2.id, score: 95, rank: 1, type: 'contest', contextId: contest1.id, updatedAt: new Date() },
      { userId: student1.id, score: 88, rank: 1, type: 'homework', contextId: hw1.id, updatedAt: new Date() }
    ]);

    // 10. Seeding Notifications
    console.log('🔔 Seeding Notifications...');
    await db.insert(notifications).values([
      { userId: student1.id, title: 'Welcome to DevBattles!', message: 'Explore homeworks and join active coding contests.', type: 'general', isRead: true },
      { userId: student1.id, title: 'New Homework Assigned', message: 'You have been assigned Web Design Basics.', type: 'homework_assigned', isRead: false },
      { userId: student2.id, title: 'Launch Contest Started!', message: 'The Grand Launch contest is now active.', type: 'contest_started', isRead: false }
    ]);

    // 11. Seeding Certificates
    console.log('📜 Seeding Certificates...');
    await db.insert(certificates).values({
      userId: student2.id,
      type: 'contest',
      title: 'DevBattles Grand Launch Winner',
      description: 'Issued for outstanding performance in the launch contest.',
      issuedBy: teacher2.id,
      downloadUrl: 'https://devbattles.com/api/certificates/download/CERT-LAUNCH-WIN',
      verificationCode: 'CERT-LAUNCH-WIN',
      metadata: { contestId: contest1.id }
    });

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
