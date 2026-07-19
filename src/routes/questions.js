import { Router } from 'express';
import { questionController } from '../controllers/questionController.js';
import { authenticateUser, requireTeacherOrAdmin } from '../middleware/auth.js';
import { parseQuery } from '../middleware/query.js';

const router = Router();

router.use(authenticateUser);

/**
 * @route   POST /api/questions
 * @desc    Create a new question
 * @access  Teacher, Admin
 */
router.post('/', requireTeacherOrAdmin, questionController.createQuestion);

/**
 * @route   GET /api/questions
 * @desc    Get all questions with filters
 * @access  Student, Teacher, Admin
 */
router.get('/', parseQuery, questionController.getAllQuestions);

/**
 * @route   GET /api/questions/search/:searchTerm
 * @desc    Search questions
 * @access  Student, Teacher, Admin
 */
router.get('/search/:searchTerm', parseQuery, questionController.searchQuestions);

/**
 * @route   GET /api/questions/my-questions
 * @desc    Get questions created by current user
 * @access  Teacher, Admin
 */
router.get('/my-questions', requireTeacherOrAdmin, parseQuery, questionController.getQuestionsByCreator);

/**
 * @route   GET /api/questions/:id
 * @desc    Get question by ID
 * @access  Student, Teacher, Admin
 */
router.get('/:id', questionController.getQuestionById);

/**
 * @route   PUT /api/questions/:id
 * @desc    Update question
 * @access  Teacher (creator), Admin
 */
router.put('/:id', requireTeacherOrAdmin, questionController.updateQuestion);

/**
 * @route   DELETE /api/questions/:id
 * @desc    Delete question
 * @access  Teacher (creator), Admin
 */
router.delete('/:id', requireTeacherOrAdmin, questionController.deleteQuestion);

/**
 * @route   POST /api/questions/:id/publish
 * @desc    Publish question
 * @access  Teacher (creator), Admin
 */
router.post('/:id/publish', requireTeacherOrAdmin, questionController.publishQuestion);

/**
 * @route   POST /api/questions/:id/unpublish
 * @desc    Unpublish question
 * @access  Teacher (creator), Admin
 */
router.post('/:id/unpublish', requireTeacherOrAdmin, questionController.unpublishQuestion);

/**
 * @route   GET /api/questions/:questionId/progress
 * @desc    Get user's progress on a question
 * @access  Student, Teacher, Admin
 */
router.get('/:questionId/progress', questionController.getUserQuestionProgress);

/**
 * @route   PUT /api/questions/:questionId/progress
 * @desc    Update user's progress on a question
 * @access  Student, Teacher, Admin
 */
router.put('/:questionId/progress', questionController.updateQuestionProgress);

/**
 * @route   POST /api/questions/:questionId/submit
 * @desc    Submit and evaluate practice question solution
 * @access  Student, Teacher, Admin
 */
router.post('/:questionId/submit', questionController.submitPracticeQuestion);

export default router;
