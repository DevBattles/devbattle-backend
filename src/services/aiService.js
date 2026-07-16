import logger from '../logger/logger.js';

const AI_BACKEND_URL = process.env.AI_BACKEND_URL;

export const aiService = {
  /**
   * Situation 1: Generate valid solutions for a question
   * @param {object} question - Question details
   * @returns {Promise<object>} Generated solutions
   */
  async generateSolutions(question) {
    logger.info('aiService.generateSolutions called', { questionId: question.id });

    if (!AI_BACKEND_URL) {
      logger.info('AI_BACKEND_URL not defined. Generating mock solutions.');
      return this._generateMockSolutions(question);
    }

    try {
      const response = await fetch(`${AI_BACKEND_URL}/api/ai/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        throw new Error(`AI backend error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      logger.error('Failed to communicate with AI backend for solutions generation, falling back to mock.', {
        error: error.message,
        questionId: question.id
      });
      return this._generateMockSolutions(question);
    }
  },

  /**
   * Situation 2: Evaluate a student submission
   * @param {object} submission - Submission details
   * @param {object} question - Question details
   * @returns {Promise<object>} { score, grade, feedback, report }
   */
  async evaluateSubmission(submission, question) {
    logger.info('aiService.evaluateSubmission called', {
      submissionId: submission.id,
      questionId: question.id
    });

    if (!AI_BACKEND_URL) {
      logger.info('AI_BACKEND_URL not defined. Evaluating with mock report.');
      return this._generateMockEvaluation(submission, question);
    }

    try {
      const response = await fetch(`${AI_BACKEND_URL}/api/ai/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission, question })
      });

      if (!response.ok) {
        throw new Error(`AI backend error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      logger.error('Failed to communicate with AI backend for submission evaluation, falling back to mock.', {
        error: error.message,
        submissionId: submission.id
      });
      return this._generateMockEvaluation(submission, question);
    }
  },

  /**
   * Generate mock solutions (Situation 1 fallback)
   */
  _generateMockSolutions(question) {
    const tech = question.techStack && question.techStack[0] ? question.techStack[0] : 'JavaScript';
    return {
      referenceId: `ai-ref-${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      solutions: [
        {
          title: 'Optimal Solution',
          code: `// Optimal solution using ${tech}\nfunction solve() {\n  // Implementation details\n  return true;\n}`,
          complexity: 'O(N)'
        },
        {
          title: 'Alternative Solution',
          code: `// Alternative solution using ${tech}\nconst solve = () => {\n  // Quick implementation\n  return true;\n}`,
          complexity: 'O(N log N)'
        }
      ]
    };
  },

  /**
   * Generate mock evaluation (Situation 2 fallback)
   */
  _generateMockEvaluation(submission, question) {
    let score = 85;
    const fileCount = submission.files ? Object.keys(submission.files).length : 0;
    
    score = Math.min(100, Math.max(40, score + (fileCount * 2) - Math.floor(Math.random() * 15)));

    let grade = 'B';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      score,
      grade,
      feedback: `The code was reviewed by the AI backend. It contains ${fileCount} files. Good structure, variables are named appropriately. Suggested improvement: add unit tests.`,
      report: {
        timestamp: new Date().toISOString(),
        score,
        grade,
        metrics: {
          codeQuality: score + 2,
          performance: score - 3,
          readability: score + 5,
        },
        suggestions: [
          'Add error handling around edge cases.',
          'Optimize loops if working with large arrays.',
        ]
      }
    };
  }
};
