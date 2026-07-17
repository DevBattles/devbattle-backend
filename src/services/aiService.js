import logger from "../logger/logger.js";
import { db } from "../db/index.js";
import { workspaceProjects, workspaceFiles, homeworkSubmissions, questionBank } from "../schema/index.js";
import { and, eq, desc } from "drizzle-orm";

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Robust fetch utility supporting timeouts and exponential backoff retries.
 */
async function fetchWithRetry(url, options = {}, retries = 3, baseDelay = 1000) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout per call

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      const errMsg = await response.text().catch(() => "");
      throw new Error(`AI Backend returned ${response.status}: ${errMsg || response.statusText}`);
    } catch (err) {
      clearTimeout(timeoutId);
      logger.warn(`AI backend request failed (attempt ${i + 1}/${retries}): ${err.message}`);

      if (i === retries - 1) {
        throw err;
      }

      // Exponential backoff delay
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export const aiService = {
  /**
   * Generate valid solutions for a question
   */
  async generateSolutions(question) {
    logger.info("aiService.generateSolutions called", {
      questionId: question.id,
    });

    if (!AI_BACKEND_URL) {
      logger.warn("AI_BACKEND_URL not defined. Falling back to mock solutions.");
      return this._generateMockSolutions(question, "AI_BACKEND_URL not configured");
    }

    // Align exactly with GenerateQuestionRequest schema
    const payload = {
      questionId: question.id,
      version: question.version || 1,
      title: question.title,
      description: question.description,
      requirements: question.requirements || [],
      starterFiles: question.starterFiles || {},
      expectedOutput: question.expectedOutput || "",
    };

    try {
      const response = await fetchWithRetry(
        `${AI_BACKEND_URL}/internal/questions/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      const rawData = result.data || result;

      // Normalize output format to match database expectedOutput JSON schema
      return {
        referenceId: rawData.questionId || question.id,
        solutions_count: rawData.solutions_count || 0,
        rubric: rawData.rubric || {},
        solutions: [], // solutions are embedded and index stored in pgvector
        aiBackendAvailable: true,
      };
    } catch (error) {
      logger.error(
        "Failed to generate solutions via AI backend. Falling back to mock.",
        {
          error: error.message,
          questionId: question.id,
          errorType: error.name,
        }
      );

      return this._generateMockSolutions(question, `AI backend unavailable: ${error.message}`);
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
      logger.warn("AI_BACKEND_URL not defined. Falling back to mock evaluation.");
      return this._generateMockEvaluation(submission, question, "AI_BACKEND_URL not configured");
    }

    // Align exactly with EvaluateSubmissionRequest schema
    const payload = {
      questionId: question.id || submission.questionId,
      version: submission.questionVersion || question.version || 1,
      studentFiles: submission.files || {},
      githubUrl: submission.githubRepo || null,
    };

    try {
      const response = await fetchWithRetry(
        `${AI_BACKEND_URL}/internal/submissions/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      const rawData = result.data || result;

      // Extract generalFeedback as a plain string text for the db column type match
      let feedbackText = "";
      if (typeof rawData.feedback === "string") {
        feedbackText = rawData.feedback;
      } else if (rawData.feedback && typeof rawData.feedback.generalFeedback === "string") {
        feedbackText = rawData.feedback.generalFeedback;
      } else {
        feedbackText = "AI Evaluation completed successfully.";
      }

      return {
        score: typeof rawData.score === "number" ? rawData.score : 0,
        grade: rawData.grade || "F",
        feedback: feedbackText,
        report: rawData.feedback || rawData.report || rawData,
        aiBackendAvailable: true,
      };
    } catch (error) {
      logger.error(
        "Failed to evaluate submission via AI backend. Falling back to mock.",
        {
          error: error.message,
          submissionId: submission.id,
          errorType: error.name,
        }
      );

      return this._generateMockEvaluation(submission, question, `AI backend unavailable: ${error.message}`);
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

    let studentCode = "";
    let evaluationReport = "";
    let category = "";
    let difficulty = "";
    let starterFiles = "";
    let hints = "";

    const questionId = payload.currentQuestion?.id || payload.questionId;
    const userId = payload.userId;

    if (userId && questionId) {
      try {
        // Find workspace project
        const [project] = await db.select().from(workspaceProjects).where(
          and(
            eq(workspaceProjects.userId, userId),
            eq(workspaceProjects.questionId, questionId)
          )
        );
        if (project) {
          const filesList = await db.select().from(workspaceFiles).where(eq(workspaceFiles.projectId, project.id));
          studentCode = filesList.map(f => `File: ${f.fileName}\nCode:\n${f.content}`).join("\n\n");
        }

        // Find last submission
        const [lastSubmission] = await db.select().from(homeworkSubmissions).where(
          and(
            eq(homeworkSubmissions.studentId, userId),
            eq(homeworkSubmissions.questionId, questionId)
          )
        ).orderBy(desc(homeworkSubmissions.submittedAt)).limit(1);
        
        if (lastSubmission) {
          evaluationReport = `Score: ${lastSubmission.score}%\nFeedback: ${lastSubmission.feedback}\nReport: ${lastSubmission.report}`;
        }

        // Find question details
        const [question] = await db.select().from(questionBank).where(eq(questionBank.id, questionId));
        if (question) {
          category = question.category || "";
          difficulty = question.difficulty || "";
          starterFiles = JSON.stringify(question.starterFiles || {});
          hints = question.requirements ? JSON.stringify(question.requirements) : "";
        }
      } catch (err) {
        logger.warn("Failed to enrich mentor chat details from database, proceeding with request", err);
      }
    }

    // Align exactly with MentorChatRequest schema
    const formattedPayload = {
      currentRole: payload.currentRole || "student",
      currentQuestion: {
        id: questionId,
        title: payload.currentQuestion?.title || "",
        description: payload.currentQuestion?.description || "",
        category: category || payload.currentQuestion?.category || "",
        difficulty: difficulty || payload.currentQuestion?.difficulty || "",
        starterFiles: starterFiles || JSON.stringify(payload.currentQuestion?.starterFiles || {}),
        studentCode: studentCode || "",
        evaluationReport: evaluationReport || "",
        hints: hints || ""
      },
      currentContext: payload.currentContext || {},
      chatHistory: payload.chatHistory || [],
      message: payload.message || "",
    };

    const response = await fetchWithRetry(
      `${AI_BACKEND_URL}/internal/mentor/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedPayload),
      }
    );

    const result = await response.json();
    return result.data || result;
  },

  /**
   * Mock solution generator
   */
  _generateMockSolutions(question, errorMessage = "") {
    const tech =
      question.techStack && question.techStack.length
        ? question.techStack[0]
        : "JavaScript";

    return {
      referenceId: `ai-ref-${Math.random().toString(36).slice(2, 10)}`,
      generatedAt: new Date().toISOString(),
      aiBackendAvailable: false,
      fallbackReason: errorMessage,
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
  _generateMockEvaluation(submission, question, errorMessage = "") {
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
      feedback: errorMessage 
        ? `AI backend unavailable (${errorMessage}). Using fallback evaluation. Your submission contains ${fileCount} file(s). Good code structure.`
        : `AI reviewed your submission containing ${fileCount} file(s). Good code structure. Suggested improvement: add unit tests and improve edge case handling.`,
      report: {
        timestamp: new Date().toISOString(),
        score,
        grade,
        aiBackendAvailable: false,
        fallbackReason: errorMessage,
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