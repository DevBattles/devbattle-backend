import { Router } from 'express';
import { workspaceController } from '../controllers/workspaceController.js';
import { authenticateUser } from '../middleware/auth.js';
import { parseQuery } from '../middleware/query.js';

const router = Router();

// All workspace routes require authentication
router.use(authenticateUser);

/**
 * @route   POST /api/workspace/projects
 * @desc    Create a new workspace project
 * @access  Student, Teacher
 */
router.post('/projects', workspaceController.createProject);

/**
 * @route   GET /api/workspace/projects
 * @desc    Get projects for current user
 * @access  Student, Teacher
 */
router.get('/projects', parseQuery, workspaceController.getUserProjects);

/**
 * @route   POST /api/workspace/projects/get-or-create
 * @desc    Get or create project for a specific context
 * @access  Student, Teacher
 */
router.post('/projects/get-or-create', workspaceController.getOrCreateProject);

/**
 * @route   GET /api/workspace/projects/:id
 * @desc    Get project by ID
 * @access  Student, Teacher (only owner)
 */
router.get('/projects/:id', workspaceController.getProjectById);

/**
 * @route   PUT /api/workspace/projects/:id
 * @desc    Update project
 * @access  Student, Teacher (only owner)
 */
router.put('/projects/:id', workspaceController.updateProject);

/**
 * @route   DELETE /api/workspace/projects/:id
 * @desc    Delete project
 * @access  Student, Teacher (only owner)
 */
router.delete('/projects/:id', workspaceController.deleteProject);

/**
 * @route   POST /api/workspace/projects/:projectId/auto-save
 * @desc    Update project auto-save timestamp
 * @access  Student, Teacher (only owner)
 */
router.post('/projects/:projectId/auto-save', workspaceController.updateAutoSave);

/**
 * @route   GET /api/workspace/projects/:projectId/files
 * @desc    Get files for a project
 * @access  Student, Teacher (only owner)
 */
router.get('/projects/:projectId/files', workspaceController.getProjectFiles);

/**
 * @route   POST /api/workspace/files
 * @desc    Create a new file in a project
 * @access  Student, Teacher (only owner)
 */
router.post('/files', workspaceController.createFile);

/**
 * @route   GET /api/workspace/files/:id
 * @desc    Get file by ID
 * @access  Student, Teacher (only owner)
 */
router.get('/files/:id', workspaceController.getFileById);

/**
 * @route   PUT /api/workspace/files/:id
 * @desc    Update file
 * @access  Student, Teacher (only owner)
 */
router.put('/files/:id', workspaceController.updateFile);

/**
 * @route   DELETE /api/workspace/files/:id
 * @desc    Delete file
 * @access  Student, Teacher (only owner)
 */
router.delete('/files/:id', workspaceController.deleteFile);

export default router;
