import { workspaceRepository } from '../repositories/workspaceRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';
import logger from '../logger/logger.js';

export const workspaceService = {
  /**
   * Create a new workspace project
   */
  async createProject(projectData, userId) {
    try {
      // Validate required fields
      if (!projectData.name) {
        throw new AppError('Missing required field: name', 400);
      }

      // Set user
      projectData.userId = userId;

      const project = await workspaceRepository.createProject(projectData);
      return project;
    } catch (error) {
      logger.error('Error in workspaceService.createProject', { error: error.message });
      throw error;
    }
  },

  /**
   * Get project by ID
   */
  async getProjectById(id, userId) {
    try {
      const project = await workspaceRepository.getProjectById(id);
      
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Only owner can view
      if (project.userId !== userId) {
        throw new AppError('You do not have permission to access this project', 403);
      }

      return project;
    } catch (error) {
      logger.error('Error in workspaceService.getProjectById', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Get projects by user
   */
  async getUserProjects(userId, filters = {}) {
    try {
      const projects = await workspaceRepository.getUserProjects(userId, filters);
      return projects;
    } catch (error) {
      logger.error('Error in workspaceService.getUserProjects', { error: error.message, userId });
      throw error;
    }
  },

  /**
   * Update project
   */
  async updateProject(id, updateData, userId) {
    try {
      const existingProject = await workspaceRepository.getProjectById(id);
      
      if (!existingProject) {
        throw new AppError('Project not found', 404);
      }

      // Only owner can update
      if (existingProject.userId !== userId) {
        throw new AppError('You do not have permission to update this project', 403);
      }

      const updatedProject = await workspaceRepository.updateProject(id, updateData);
      return updatedProject;
    } catch (error) {
      logger.error('Error in workspaceService.updateProject', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Delete project
   */
  async deleteProject(id, userId) {
    try {
      const existingProject = await workspaceRepository.getProjectById(id);
      
      if (!existingProject) {
        throw new AppError('Project not found', 404);
      }

      // Only owner can delete
      if (existingProject.userId !== userId) {
        throw new AppError('You do not have permission to delete this project', 403);
      }

      const deletedProject = await workspaceRepository.deleteProject(id);
      return deletedProject;
    } catch (error) {
      logger.error('Error in workspaceService.deleteProject', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Create a new file in a project
   */
  async createFile(fileData, userId) {
    try {
      // Validate required fields
      if (!fileData.projectId || !fileData.fileName || !fileData.language || !fileData.content) {
        throw new AppError('Missing required fields: projectId, fileName, language, content', 400);
      }

      // Check if user owns the project
      const project = await workspaceRepository.getProjectById(fileData.projectId);
      if (!project || project.userId !== userId) {
        throw new AppError('Project not found or access denied', 404);
      }

      const file = await workspaceRepository.createFile(fileData);
      return file;
    } catch (error) {
      logger.error('Error in workspaceService.createFile', { error: error.message });
      throw error;
    }
  },

  /**
   * Get files for a project
   */
  async getProjectFiles(projectId, userId) {
    try {
      // Check if user owns the project
      const project = await workspaceRepository.getProjectById(projectId);
      if (!project || project.userId !== userId) {
        throw new AppError('Project not found or access denied', 404);
      }

      const files = await workspaceRepository.getProjectFiles(projectId);
      return files;
    } catch (error) {
      logger.error('Error in workspaceService.getProjectFiles', { error: error.message, projectId });
      throw error;
    }
  },

  /**
   * Get file by ID
   */
  async getFileById(id, userId) {
    try {
      const file = await workspaceRepository.getFileById(id);
      
      if (!file) {
        throw new AppError('File not found', 404);
      }

      // Check if user owns the project
      const project = await workspaceRepository.getProjectById(file.projectId);
      if (!project || project.userId !== userId) {
        throw new AppError('You do not have permission to access this file', 403);
      }

      return file;
    } catch (error) {
      logger.error('Error in workspaceService.getFileById', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Update file
   */
  async updateFile(id, updateData, userId) {
    try {
      const existingFile = await workspaceRepository.getFileById(id);
      
      if (!existingFile) {
        throw new AppError('File not found', 404);
      }

      // Check if user owns the project
      const project = await workspaceRepository.getProjectById(existingFile.projectId);
      if (!project || project.userId !== userId) {
        throw new AppError('You do not have permission to update this file', 403);
      }

      const updatedFile = await workspaceRepository.updateFile(id, updateData);
      return updatedFile;
    } catch (error) {
      logger.error('Error in workspaceService.updateFile', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Delete file
   */
  async deleteFile(id, userId) {
    try {
      const existingFile = await workspaceRepository.getFileById(id);
      
      if (!existingFile) {
        throw new AppError('File not found', 404);
      }

      // Check if user owns the project
      const project = await workspaceRepository.getProjectById(existingFile.projectId);
      if (!project || project.userId !== userId) {
        throw new AppError('You do not have permission to delete this file', 403);
      }

      const deletedFile = await workspaceRepository.deleteFile(id);
      return deletedFile;
    } catch (error) {
      logger.error('Error in workspaceService.deleteFile', { error: error.message, id });
      throw error;
    }
  },

  /**
   * Update project auto-save timestamp
   */
  async updateAutoSave(projectId, userId) {
    try {
      // Check if user owns the project
      const project = await workspaceRepository.getProjectById(projectId);
      if (!project || project.userId !== userId) {
        throw new AppError('Project not found or access denied', 404);
      }

      const updated = await workspaceRepository.updateAutoSave(projectId);
      return updated;
    } catch (error) {
      logger.error('Error in workspaceService.updateAutoSave', { error: error.message, projectId });
      throw error;
    }
  },

  /**
   * Get or create project for a specific context
   */
  async getOrCreateProject(userId, contextData) {
    try {
      // Verify user exists in database
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new AppError('User not found in database', 404);
      }

      const project = await workspaceRepository.getOrCreateProject(userId, contextData);
      return project;
    } catch (error) {
      logger.error('Error in workspaceService.getOrCreateProject', { error: error.message, userId });
      throw error;
    }
  }
};
