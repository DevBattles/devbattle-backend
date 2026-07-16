import { workspaceService } from '../services/workspaceService.js';
import { sendSuccess } from '../utils/response.js';
import logger from '../logger/logger.js';

export const workspaceController = {
  /**
   * Create a new workspace project
   */
  async createProject(req, res, next) {
    try {
      const projectData = req.body;
      const userId = req.user.id;

      const project = await workspaceService.createProject(projectData, userId);

      return sendSuccess(res, 201, 'Project created successfully', project);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get project by ID
   */
  async getProjectById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await workspaceService.getProjectById(id, userId);

      return sendSuccess(res, 200, 'Project retrieved successfully', project);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get projects for current user
   */
  async getUserProjects(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = req.filters || {};

      const projects = await workspaceService.getUserProjects(userId, filters);

      return sendSuccess(res, 200, 'Projects retrieved successfully', projects);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update project
   */
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const updatedProject = await workspaceService.updateProject(id, updateData, userId);

      return sendSuccess(res, 200, 'Project updated successfully', updatedProject);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete project
   */
  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deletedProject = await workspaceService.deleteProject(id, userId);

      return sendSuccess(res, 200, 'Project deleted successfully', deletedProject);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new file in a project
   */
  async createFile(req, res, next) {
    try {
      const fileData = req.body;
      const userId = req.user.id;

      const file = await workspaceService.createFile(fileData, userId);

      return sendSuccess(res, 201, 'File created successfully', file);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get files for a project
   */
  async getProjectFiles(req, res, next) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const files = await workspaceService.getProjectFiles(projectId, userId);

      return sendSuccess(res, 200, 'Files retrieved successfully', files);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get file by ID
   */
  async getFileById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const file = await workspaceService.getFileById(id, userId);

      return sendSuccess(res, 200, 'File retrieved successfully', file);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update file
   */
  async updateFile(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const updatedFile = await workspaceService.updateFile(id, updateData, userId);

      return sendSuccess(res, 200, 'File updated successfully', updatedFile);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete file
   */
  async deleteFile(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deletedFile = await workspaceService.deleteFile(id, userId);

      return sendSuccess(res, 200, 'File deleted successfully', deletedFile);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update project auto-save timestamp
   */
  async updateAutoSave(req, res, next) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const updated = await workspaceService.updateAutoSave(projectId, userId);

      return sendSuccess(res, 200, 'Auto-save updated successfully', updated);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get or create project for a specific context
   */
  async getOrCreateProject(req, res, next) {
    try {
      const userId = req.user.id;
      const contextData = req.body;

      const project = await workspaceService.getOrCreateProject(userId, contextData);

      return sendSuccess(res, 200, 'Project retrieved or created successfully', project);
    } catch (error) {
      next(error);
    }
  }
};
