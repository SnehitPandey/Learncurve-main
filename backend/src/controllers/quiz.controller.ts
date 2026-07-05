import { Request, Response, NextFunction } from 'express';
import * as quizService from '../services/quiz.service';
import { sendSuccess } from '../utils/response.utils';

export async function generateQuizForUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { topics, count } = req.body;
    const quiz = await quizService.generateQuizForUser(
      req.params.roomId,
      req.user!._id,
      topics,
      count
    );
    sendSuccess(res, quiz, 'Quiz generated', 201);
  } catch (err) {
    next(err);
  }
}

export async function submitQuizAnswers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await quizService.submitQuizAnswers(
      req.params.roomId,
      req.params.quizId,
      req.user!._id,
      req.body.answers
    );
    sendSuccess(res, result, 'Quiz submitted');
  } catch (err) {
    next(err);
  }
}

export async function getQuiz(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const quiz = await quizService.getQuiz(
      req.params.roomId,
      req.params.quizId,
      req.user!._id
    );
    sendSuccess(res, quiz);
  } catch (err) {
    next(err);
  }
}
