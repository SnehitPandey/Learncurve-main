import { Router, Request, Response, NextFunction } from 'express';
import * as partnerService from '../services/partner.service';
import { authenticateJWT } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response.utils';
import Room from '../models/room.model';
import User from '../models/user.model';

const router = Router();

// GET /users/dashboard — aggregated dashboard data
router.get(
  '/dashboard',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;

      // Fetch only ACCEPTED rooms where user is a member, active only
      const rooms = await Room.find({
        members: { $elemMatch: { userId, joinStatus: 'ACCEPTED' } },
        status: 'active',
      })
        .select(
          'title code roadmap members kanbanBoards averageProgress startDate expectedDurationDays'
        )
        .populate('members.userId', 'name');

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Collect activity items across all rooms
      const roomActivity: Array<{
        type: string;
        roomTitle: string;
        roomId: any;
        text: string;
        timestamp: Date;
        color: string;
      }> = [];

      const dashboardRooms = rooms.map((room) => {
        const member = room.members.find((m) => {
          const mid = (m.userId as any)?._id ?? m.userId;
          return mid.equals(userId);
        });
        const board = room.kanbanBoards.find((b) => b.userId.equals(userId));

        const allTasks = board?.tasks ?? [];

        // Active tasks = todo or inProgress, scheduledDate <= end of today
        const todaysTasks = allTasks.filter((task) => {
          const scheduled =
            task.scheduledDate instanceof Date
              ? task.scheduledDate
              : new Date(task.scheduledDate);
          return (
            (task.column === 'todo' || task.column === 'inProgress') &&
            !isNaN(scheduled.getTime()) &&
            scheduled <= endOfToday
          );
        });

        // Count completed today (done + scheduledDate within today)
        const completedTodayCount = allTasks.filter((task) => {
          const scheduled =
            task.scheduledDate instanceof Date
              ? task.scheduledDate
              : new Date(task.scheduledDate);
          return (
            task.column === 'done' &&
            !isNaN(scheduled.getTime()) &&
            scheduled >= startOfToday &&
            scheduled <= endOfToday
          );
        }).length;

        // Resolve current phase + milestone titles from roadmap
        const currentPhase = room.roadmap?.phases?.find(
          (p) => p.phaseId === member?.progress?.currentPhaseId
        );
        const currentMilestone = currentPhase?.milestones?.find(
          (m) => m.milestoneId === member?.progress?.currentMilestoneId
        );

        // --- Collect room activity ---
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        );

        // Recent member joins (last 7 days, not self)
        for (const m of room.members) {
          const mid = (m.userId as any)?._id ?? m.userId;
          if (mid.equals(userId)) continue;
          if (m.joinStatus !== 'ACCEPTED') continue;
          const joined = m.joinedAt ? new Date(m.joinedAt) : null;
          if (joined && joined >= sevenDaysAgo) {
            const memberName =
              (m.userId as any)?.name ?? 'Someone';
            roomActivity.push({
              type: 'join',
              roomTitle: room.title,
              roomId: room._id,
              text: `${memberName} joined "${room.title}"`,
              timestamp: joined,
              color: 'green',
            });
          }
        }

        // Members behind schedule
        for (const m of room.members) {
          const mid = (m.userId as any)?._id ?? m.userId;
          if (mid.equals(userId)) continue;
          if (m.joinStatus !== 'ACCEPTED') continue;
          if (m.progress?.status === 'BEHIND') {
            const memberName =
              (m.userId as any)?.name ?? 'A member';
            roomActivity.push({
              type: 'behind',
              roomTitle: room.title,
              roomId: room._id,
              text: `${memberName} is falling behind in "${room.title}"`,
              timestamp: new Date(),
              color: 'orange',
            });
          }
        }

        // Your own completions today
        const doneTodayCount = allTasks.filter((t) => {
          if (t.column !== 'done') return false;
          const completed = t.completedAt
            ? new Date(t.completedAt)
            : null;
          return completed && completed >= startOfToday;
        }).length;

        if (doneTodayCount > 0) {
          roomActivity.push({
            type: 'complete',
            roomTitle: room.title,
            roomId: room._id,
            text: `You completed ${doneTodayCount} task${doneTodayCount > 1 ? 's' : ''} in "${room.title}" today`,
            timestamp: new Date(),
            color: 'teal',
          });
        }

        return {
          roomId: room._id,
          roomTitle: room.title,
          roomCode: room.code,
          progressPercentage: member?.progress?.progressPercentage ?? 0,
          paceStatus: member?.progress?.status ?? 'ON_TRACK',
          averageProgress: room.averageProgress,
          currentPhase: currentPhase?.title ?? null,
          currentMilestone: currentMilestone?.title ?? null,
          todaysTasks: todaysTasks.map((t) => ({
            taskId: t.taskId,
            title: t.title,
            column: t.column,
            estimatedMinutes: t.estimatedMinutes,
            topicRef: t.topicRef,
            milestoneRef: t.milestoneRef,
            phaseRef: t.phaseRef,
            scheduledDate: t.scheduledDate,
          })),
          completedTodayCount,
          totalTodayCount: todaysTasks.length + completedTodayCount,
        };
      });

      // Sort activity by most recent first, cap at 5
      const sortedActivity = roomActivity
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        )
        .slice(0, 5);

      // Fetch streak data
      const user = await User.findById(userId).select(
        'focusStreak duoStreak partnerId'
      );

      sendSuccess(res, {
        rooms: dashboardRooms,
        roomActivity: sortedActivity,
        focusStreak: user?.focusStreak ?? { count: 0 },
        duoStreak: user?.duoStreak ?? { count: 0 },
        hasPartner: !!user?.partnerId,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /users/partner/invite
router.post(
  '/partner/invite',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await partnerService.sendPartnerInvite(
        req.user!._id,
        req.body.email
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /users/partner/accept
router.post(
  '/partner/accept',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await partnerService.acceptPartnerInvite(req.user!._id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /users/partner
router.delete(
  '/partner',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await partnerService.dissolvePartnership(req.user!._id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /users/partner
router.get(
  '/partner',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await partnerService.getPartnerInfo(req.user!._id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
