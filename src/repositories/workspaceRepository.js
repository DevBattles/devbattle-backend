import { db } from '../db/index.js';
import { workspaceProjects, workspaceFiles } from '../schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import logger from '../logger/logger.js';

export const workspaceRepository = {
  /**
   * Create a new workspace project
   */
  async createProject(projectData) {
    try {
      const [project] = await db.insert(workspaceProjects).values(projectData).returning();
      logger.info('Workspace project created successfully', { projectId: project.id });
      return project;
    } catch (error) {
      logger.error('Error creating workspace project', { error: error.message });
      throw error;
    }
  },

  /**
   * Get project by ID
   */
  async getProjectById(id) {
    try {
      const [project] = await db.select().from(workspaceProjects).where(eq(workspaceProjects.id, id));
      return project;
    } catch (error) {
      logger.error('Error fetching workspace project by ID', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Get projects by user
   */
  async getUserProjects(userId, filters = {}) {
    try {
      const { isDraft } = filters;

      let query = db.select().from(workspaceProjects).where(eq(workspaceProjects.userId, userId));

      if (isDraft !== undefined) {
        query = query.where(eq(workspaceProjects.isDraft, isDraft));
      }

      const projects = await query.orderBy(desc(workspaceProjects.updatedAt));
      return projects;
    } catch (error) {
      logger.error('Error fetching user workspace projects', { error: error.message, userId });
      throw error;
    }
  },

  /**
   * Update project
   */
  async updateProject(id, updateData) {
    try {
      const [updatedProject] = await db
        .update(workspaceProjects)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(workspaceProjects.id, id))
        .returning();
      
      logger.info('Workspace project updated successfully', { projectId: id });
      return updatedProject;
    } catch (error) {
      logger.error('Error updating workspace project', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Delete project
   */
  async deleteProject(id) {
    try {
      const [deletedProject] = await db
        .delete(workspaceProjects)
        .where(eq(workspaceProjects.id, id))
        .returning();
      
      logger.info('Workspace project deleted successfully', { projectId: id });
      return deletedProject;
    } catch (error) {
      logger.error('Error deleting workspace project', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Create a new file in a project
   */
  async createFile(fileData) {
    try {
      const [file] = await db.insert(workspaceFiles).values(fileData).returning();
      logger.info('Workspace file created successfully', { fileId: file.id });
      return file;
    } catch (error) {
      logger.error('Error creating workspace file', { error: error.message });
      throw error;
    }
  },

  /**
   * Get files for a project
   */
  async getProjectFiles(projectId) {
    try {
      const files = await db
        .select()
        .from(workspaceFiles)
        .where(eq(workspaceFiles.projectId, projectId))
        .orderBy(workspaceFiles.createdAt);
      
      return files;
    } catch (error) {
      logger.error('Error fetching workspace files', { error: error.message, projectId });
      throw error;
    }
  },

  /**
   * Get file by ID
   */
  async getFileById(id) {
    try {
      const [file] = await db.select().from(workspaceFiles).where(eq(workspaceFiles.id, id));
      return file;
    } catch (error) {
      logger.error('Error fetching workspace file by ID', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Update file
   */
  async updateFile(id, updateData) {
    try {
      const [updatedFile] = await db
        .update(workspaceFiles)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(workspaceFiles.id, id))
        .returning();
      
      logger.info('Workspace file updated successfully', { fileId: id });
      return updatedFile;
    } catch (error) {
      logger.error('Error updating workspace file', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Delete file
   */
  async deleteFile(id) {
    try {
      const [deletedFile] = await db
        .delete(workspaceFiles)
        .where(eq(workspaceFiles.id, id))
        .returning();
      
      logger.info('Workspace file deleted successfully', { fileId: id });
      return deletedFile;
    } catch (error) {
      logger.error('Error deleting workspace file', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Update project auto-save timestamp
   */
  async updateAutoSave(projectId) {
    try {
      const [updated] = await db
        .update(workspaceProjects)
        .set({ lastAutoSave: new Date() })
        .where(eq(workspaceProjects.id, projectId))
        .returning();
      
      return updated;
    } catch (error) {
      logger.error('Error updating auto-save timestamp', { error: error.message, projectId });
      throw error;
    }
  },

  /**
   * Get or create project for a specific context
   */
  async getOrCreateProject(userId, contextData) {
    try {
      const { questionId, homeworkId, contestId, name } = contextData;

      // Try to find existing project
      let existingProject;
      if (questionId) {
        [existingProject] = await db
          .select()
          .from(workspaceProjects)
          .where(
            and(
              eq(workspaceProjects.userId, userId),
              eq(workspaceProjects.questionId, questionId)
            )
          );
      } else if (homeworkId) {
        [existingProject] = await db
          .select()
          .from(workspaceProjects)
          .where(
            and(
              eq(workspaceProjects.userId, userId),
              eq(workspaceProjects.homeworkId, homeworkId)
            )
          );
      } else if (contestId) {
        [existingProject] = await db
          .select()
          .from(workspaceProjects)
          .where(
            and(
              eq(workspaceProjects.userId, userId),
              eq(workspaceProjects.contestId, contestId)
            )
          );
      }

      if (existingProject) {
        return existingProject;
      }

      // Create new project
      const newProject = await this.createProject({
        userId,
        questionId,
        homeworkId,
        contestId,
        name: name || 'Untitled Project',
        isDraft: true
      });

      return newProject;
    } catch (error) {
      logger.error('Error getting or creating workspace project', { error: error.message, userId });
      throw error;
    }
  }
};
