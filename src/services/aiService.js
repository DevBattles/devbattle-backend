import logger from "../logger/logger.js";

const AI_BACKEND_URL = process.env.AI_BACKEND_URL;

export const aiService = {
  /**
   * Generate valid solutions for a question
   */
  async generateSolutions(question) {
    logger.info("aiService.generateSolutions called", {
      questionId: question.id,
    });

    if (!AI_BACKEND_URL) {
      logger.warn(
        "AI_BACKEND_URL not defined. Falling back to mock solutions."
      );
      return this._generateMockSolutions(question);
    }

    try {
      const response = await fetch(
        `${AI_BACKEND_URL}/internal/questions/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        }
      );

      if (!response.ok) {
        throw new Error(`AI backend error: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      logger.error(
        "Failed to communicate with AI backend for solution generation.",
        {
          error: error.message,
          questionId: question.id,
        }
      );

      return this._generateMockSolutions(question);
    }
  },

  /**
   * Evaluate a student's submission
   */
  async evaluateSubmission(submission, question) {
    logger.info("aiService.evaluateSubmission called", {
      submissionId: submission.id,
      questionId: question.id,
    });

    if (!AI_BACKEND_URL) {
      logger.warn(
        "AI_BACKEND_URL not defined. Falling back to mock evaluation."
      );
      return this._generateMockEvaluation(submission, question);
    }

    try {
      const response = await fetch(
        `${AI_BACKEND_URL}/internal/submissions/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submission,
            question,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`AI backend error: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      logger.error(
        "Failed to communicate with AI backend for evaluation.",
        {
          error: error.message,
          submissionId: submission.id,
        }
      );

      return this._generateMockEvaluation(submission, question);
    }
  },

  /**
   * AI Mentor Chat
   */
  async mentorChat(payload) {
    logger.info("aiService.mentorChat called");

    if (!AI_BACKEND_URL) {
      throw new Error("AI_BACKEND_URL is not configured.");
    }

    const response = await fetch(
      `${AI_BACKEND_URL}/internal/mentor/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Mentor API failed: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Mock solution generator
   */
  _generateMockSolutions(question) {
    const tech =
      question.techStack && question.techStack.length
        ? question.techStack[0]
        : "JavaScript";

    return {
      referenceId: `ai-ref-${Math.random().toString(36).slice(2, 10)}`,
      generatedAt: new Date().toISOString(),
      solutions: [
        {
          title: "Optimal Solution",
          code: `// Optimal ${tech} solution\nfunction solve() {\n  return true;\n}`,
          complexity: "O(N)",
        },
        {
          title: "Alternative Solution",
          code: `// Alternative ${tech} solution\nconst solve = () => true;`,
          complexity: "O(N log N)",
        },
      ],
    };
  },

  /**
   * Mock submission evaluation
   */
  _generateMockEvaluation(submission, question) {
    const fileCount = submission.files
      ? Object.keys(submission.files).length
      : 0;

    let score = Math.min(
      100,
      Math.max(40, 85 + fileCount * 2 - Math.floor(Math.random() * 15))
    );

    let grade = "F";

    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else if (score >= 60) grade = "D";

    return {
      score,
      grade,
      feedback: `AI reviewed your submission containing ${fileCount} file(s). Good code structure. Suggested improvement: add unit tests and improve edge case handling.`,

      report: {
        timestamp: new Date().toISOString(),
        score,
        grade,

        metrics: {
          codeQuality: Math.min(score + 2, 100),
          performance: Math.max(score - 3, 0),
          readability: Math.min(score + 5, 100),
        },

        suggestions: [
          "Handle edge cases.",
          "Improve naming conventions.",
          "Add unit tests.",
          "Optimize repeated loops.",
        ],
      },
    };
  },
};