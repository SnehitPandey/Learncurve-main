import { Request, Response, NextFunction } from 'express';
import * as focusService from '../services/focus.service';
import { sendSuccess } from '../utils/response.utils';

export async function completeFocusSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await focusService.completeFocusSession(
      req.params.roomId,
      req.user!._id,
      req.body.topicId,
      req.body.durationMinutes
    );
    sendSuccess(res, result, 'Focus session completed', 201);
  } catch (err) {
    next(err);
  }
}

export async function getUserFocusSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessions = await focusService.getUserFocusSessions(
      req.params.roomId,
      req.user!._id
    );
    sendSuccess(res, sessions);
  } catch (err) {
    next(err);
  }
}
