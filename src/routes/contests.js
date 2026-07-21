import { Router } from 'express';
import { contestController } from '../controllers/contestController.js';
import { authenticateUser, requireTeacherOrAdmin, requireStudent } from '../middleware/auth.js';
import { parseQuery } from '../middleware/query.js';

const router = Router();

router.use(authenticateUser);

/**
 * @route   POST /api/contests
 * @desc    Create a new contest
 * @access  Teacher, Admin
 */
router.post('/', requireTeacherOrAdmin, contestController.createContest);

/**
 * @route   GET /api/contests
 * @desc    Get all contests with filters
 * @access  Student, Teacher, Admin
 */
router.get('/', parseQuery, contestController.getAllContests);

/**
 * @route   GET /api/contests/submissions
 * @desc    Get all contest submissions
 * @access  Teacher, Admin
 */
router.get('/submissions', requireTeacherOrAdmin, parseQuery, contestController.getContestSubmissions);

/**
 * @route   GET /api/contests/:contestId/submissions
 * @desc    Get contest submissions
 * @access  Teacher, Admin
 */
router.get('/:contestId/submissions', requireTeacherOrAdmin, parseQuery, contestController.getContestSubmissions);

/**
 * @route   GET /api/contests/:id
 * @desc    Get contest by ID
 * @access  Student, Teacher, Admin
 */
router.get('/:id', contestController.getContestById);

/**
 * @route   PUT /api/contests/:id
 * @desc    Update contest
 * @access  Teacher (creator), Admin
 */
router.put('/:id', requireTeacherOrAdmin, contestController.updateContest);

/**
 * @route   DELETE /api/contests/:id
 * @desc    Delete contest
 * @access  Teacher (creator), Admin
 */
router.delete('/:id', requireTeacherOrAdmin, contestController.deleteContest);

/**
 * @route   POST /api/contests/:id/questions
 * @desc    Assign questions to a contest
 * @access  Teacher (creator), Admin
 */
router.post('/:id/questions', requireTeacherOrAdmin, contestController.assignQuestions);

/**
 * @route   GET /api/contests/:id/questions
 * @desc    Get questions for a contest
 * @access  Student, Teacher, Admin
 */
router.get('/:id/questions', contestController.getContestQuestions);

/**
 * @route   POST /api/contests/:id/join
 * @desc    Join contest
 * @access  Student
 */
router.post('/:id/join', requireStudent, contestController.joinContest);

/**
 * @route   POST /api/contests/:id/start
 * @desc    Start contest for user
 * @access  Student
 */
router.post('/:id/start', requireStudent, contestController.startContest);

/**
 * @route   POST /api/contests/:id/complete
 * @desc    Complete contest for user
 * @access  Student
 */
router.post('/:id/complete', requireStudent, contestController.completeContest);

/**
 * @route   GET /api/contests/:id/participants
 * @desc    Get contest participants
 * @access  Teacher, Admin
 */
router.get('/:id/participants', requireTeacherOrAdmin, contestController.getContestParticipants);

/**
 * @route   POST /api/contests/:contestId/questions/:questionId/submit
 * @desc    Submit contest answer
 * @access  Student
 */
router.post('/:contestId/questions/:questionId/submit', requireStudent, contestController.submitContestAnswer);



/**
 * @route   PUT /api/contests/submissions/:id
 * @desc    Update/Grade contest submission
 * @access  Teacher, Admin
 */
router.put('/submissions/:id', requireTeacherOrAdmin, contestController.updateContestSubmission);

export default router;
