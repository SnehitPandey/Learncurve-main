import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  });
}

export function sendError(
  res: Response,
  message: string | any = 'Internal Server Error',
  statusCode: number = 500
): void {
  res.status(statusCode).json({
    success: false,
    message,
  });
}
