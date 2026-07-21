export class UserDTO {
  static toResponse(user) {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isApproved: user.status === 'ACTIVE',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toResponseList(users) {
    if (!users) return [];
    return users.map(user => this.toResponse(user));
  }
}

export class QuestionDTO {
  static toResponse(question) {
    if (!question) return null;
    return {
      id: question.id,
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      estimatedTime: question.estimatedTime,
      techStack: question.techStack,
      tags: question.tags || [],
      requirements: question.requirements || [],
      starterFiles: question.starterFiles || {},
      assets: question.assets || [],
      attachments: question.attachments || [],
      expectedOutput: question.expectedOutput,
      version: question.version,
      createdBy: question.createdBy,
      published: question.published,
      category: question.category,
      workspaceType: question.workspaceType,
      evaluationStrategy: question.evaluationStrategy,
      supportedLanguage: question.supportedLanguage,
      previewRequired: question.previewRequired,
      executionMode: question.executionMode,
      options: question.options,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  static toResponseList(questions) {
    if (!questions) return [];
    return questions.map(q => this.toResponse(q));
  }
}

export class HomeworkDTO {
  static toResponse(homework, questions = []) {
    if (!homework) return null;
    return {
      id: homework.id,
      title: homework.title,
      description: homework.description,
      dueDate: homework.dueDate,
      createdBy: homework.createdBy,
      published: homework.published,
      createdAt: homework.createdAt,
      updatedAt: homework.updatedAt,
      questions: questions.map(q => QuestionDTO.toResponse(q)),
    };
  }

  static toResponseList(homeworks) {
    if (!homeworks) return [];
    return homeworks.map(h => this.toResponse(h));
  }
}

export class ContestDTO {
  static toResponse(contest, questions = []) {
    if (!contest) return null;
    return {
      id: contest.id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      published: contest.published,
      status: contest.status,
      createdBy: contest.createdBy,
      createdAt: contest.createdAt,
      updatedAt: contest.updatedAt,
      questions: questions.map(q => ({
        ...QuestionDTO.toResponse(q.question),
        order: q.order,
        points: q.points,
      })),
    };
  }

  static toResponseList(contests) {
    if (!contests) return [];
    return contests.map(c => this.toResponse(c));
  }
}

export class SubmissionDTO {
  static toResponse(submission) {
    if (!submission) return null;
    return {
      id: submission.id,
      homeworkId: submission.homeworkId || null,
      contestId: submission.contestId || null,
      studentId: submission.studentId,
      questionId: submission.questionId,
      questionVersion: submission.questionVersion,
      files: submission.files,
      githubRepo: submission.githubRepo,
      livePreview: submission.livePreview,
      submittedAt: submission.submittedAt,
      status: submission.status,
      score: submission.score,
      grade: submission.grade,
      feedback: submission.feedback,
      report: submission.report,
      createdAt: submission.createdAt,
      student: submission.student || null,
      homework: submission.homework || null,
      contest: submission.contest || null,
    };
  }

  static toResponseList(submissions) {
    if (!submissions) return [];
    return submissions.map(s => this.toResponse(s));
  }
}
