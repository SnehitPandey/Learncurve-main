import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Sub-schema interfaces ───────────────────────────────────────────────────

export interface IResource {
  title: string;
  url: string;
  type: 'article' | 'video' | 'docs' | 'other';
}

export interface ITopic {
  topicId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  resources: IResource[];
  isCompleted: boolean;
}

export interface IMilestone {
  milestoneId: string;
  title: string;
  description: string;
  topics: ITopic[];
  isCompleted: boolean;
}

export interface IPhase {
  phaseId: string;
  title: string;
  description: string;
  milestones: IMilestone[];
}

export interface IRoadmap {
  phases: IPhase[];
}

export interface IKanbanTask {
  taskId: string;
  title: string;
  description: string;
  topicRef: string;
  phaseRef: string;
  milestoneRef: string;
  estimatedMinutes: number;
  scheduledDate: Date;
  column: 'backlog' | 'todo' | 'inProgress' | 'done';
  completedAt?: Date;
}

export interface IKanbanBoard {
  userId: mongoose.Types.ObjectId;
  tasks: IKanbanTask[];
}

export interface IFocusSession {
  userId: mongoose.Types.ObjectId;
  topicRef: string;
  durationMinutes: number;
  aiSummary?: string | null;
  completedAt: Date;
}

export interface IChatMessage {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  content: string;
  type: 'text' | 'system';
  createdAt: Date;
}

export interface IQuizQuestion {
  questionId: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface IQuizResult {
  userId: mongoose.Types.ObjectId;
  answers: number[];
  score: number;
  submittedAt: Date;
}

export interface IQuiz {
  quizId: string;
  generatedFor: mongoose.Types.ObjectId;
  milestoneRef: string;
  questions: IQuizQuestion[];
  results: IQuizResult[];
  createdAt: Date;
}

export interface IMemberProgress {
  currentPhaseId?: string;
  currentMilestoneId?: string;
  progressPercentage: number;
  status: 'ON_TRACK' | 'AHEAD' | 'BEHIND';
}

export interface IMember {
  userId: mongoose.Types.ObjectId;
  role: 'host' | 'member';
  joinStatus: 'WAITING' | 'ACCEPTED';
  progress: IMemberProgress;
  joinedAt: Date;
}

export interface IRoom extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  topic: string;
  description?: string;
  tags: string[];
  code: string;
  hostId: mongoose.Types.ObjectId;
  status: 'active' | 'completed' | 'archived';
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';

  startDate: Date;
  expectedDurationDays: number;

  roadmap: IRoadmap;
  members: IMember[];
  kanbanBoards: IKanbanBoard[];
  focusSessions: IFocusSession[];
  quizzes: IQuiz[];
  chatMessages: IChatMessage[];

  averageProgress: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface IRoomModel extends Model<IRoom> {
  generateCode(): Promise<string>;
}

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String },
    url: { type: String },
    type: { type: String, enum: ['article', 'video', 'docs', 'other'], default: 'article' },
  },
  { _id: false }
);

const TopicSchema = new Schema<ITopic>(
  {
    topicId: { type: String },
    title: { type: String },
    description: { type: String },
    estimatedMinutes: { type: Number },
    resources: [ResourceSchema],
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const MilestoneSchema = new Schema<IMilestone>(
  {
    milestoneId: { type: String },
    title: { type: String },
    description: { type: String },
    topics: [TopicSchema],
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const PhaseSchema = new Schema<IPhase>(
  {
    phaseId: { type: String },
    title: { type: String },
    description: { type: String },
    milestones: [MilestoneSchema],
  },
  { _id: false }
);

const RoadmapSchema = new Schema<IRoadmap>(
  {
    phases: [PhaseSchema],
  },
  { _id: false }
);

const KanbanTaskSchema = new Schema<IKanbanTask>(
  {
    taskId: { type: String },
    title: { type: String },
    description: { type: String },
    topicRef: { type: String },
    phaseRef: { type: String },
    milestoneRef: { type: String },
    estimatedMinutes: { type: Number },
    scheduledDate: { type: Date },
    column: {
      type: String,
      enum: ['backlog', 'todo', 'inProgress', 'done'],
      default: 'todo',
    },
    completedAt: { type: Date },
  },
  { _id: false }
);

const KanbanBoardSchema = new Schema<IKanbanBoard>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    tasks: [KanbanTaskSchema],
  },
  { _id: false }
);

const FocusSessionSchema = new Schema<IFocusSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    topicRef: { type: String },
    durationMinutes: { type: Number },
    aiSummary: { type: String },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String },
    content: { type: String },
    type: { type: String, enum: ['text', 'system'], default: 'text' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionId: { type: String },
    text: { type: String },
    options: [{ type: String }],
    correctIndex: { type: Number },
  },
  { _id: false }
);

const QuizResultSchema = new Schema<IQuizResult>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    answers: [{ type: Number }],
    score: { type: Number },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
  {
    quizId: { type: String },
    generatedFor: { type: Schema.Types.ObjectId, ref: 'User' },
    milestoneRef: { type: String },
    questions: [QuizQuestionSchema],
    results: [QuizResultSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MemberProgressSchema = new Schema<IMemberProgress>(
  {
    currentPhaseId: { type: String },
    currentMilestoneId: { type: String },
    progressPercentage: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ON_TRACK', 'AHEAD', 'BEHIND'],
      default: 'ON_TRACK',
    },
  },
  { _id: false }
);

const MemberSchema = new Schema<IMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['host', 'member'], default: 'member' },
    joinStatus: { type: String, enum: ['WAITING', 'ACCEPTED'], default: 'WAITING' },
    progress: { type: MemberProgressSchema, default: () => ({}) },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Root Room Schema ────────────────────────────────────────────────────────

const roomSchema = new Schema<IRoom, IRoomModel>(
  {
    title: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String },
    tags: [{ type: String }],
    code: { type: String, unique: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },

    startDate: { type: Date, default: Date.now },
    expectedDurationDays: { type: Number, default: 30 },

    roadmap: { type: RoadmapSchema, default: () => ({ phases: [] }) },
    members: [MemberSchema],
    kanbanBoards: [KanbanBoardSchema],
    focusSessions: [FocusSessionSchema],
    quizzes: [QuizSchema],
    chatMessages: [ChatMessageSchema],

    averageProgress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── Pre-save hook: recalculate progress & statuses ──────────────────────────

roomSchema.pre('save', function (next) {
  if (!this.isModified('members') && !this.isModified('kanbanBoards')) {
    return next();
  }

  const acceptedMembers = this.members.filter((m) => m.joinStatus === 'ACCEPTED');
  if (acceptedMembers.length === 0) {
    this.averageProgress = 0;
    return next();
  }

  // Recalculate averageProgress
  const totalProgress = acceptedMembers.reduce(
    (sum, m) => sum + (m.progress?.progressPercentage ?? 0),
    0
  );
  this.averageProgress = Math.round(totalProgress / acceptedMembers.length);

  // Recalculate each member's status
  const daysSinceStart = Math.max(
    0,
    Math.floor((Date.now() - new Date(this.startDate).getTime()) / 86_400_000)
  );
  const expectedProgress = this.expectedDurationDays > 0
    ? (daysSinceStart / this.expectedDurationDays) * 100
    : 0;

  for (const member of acceptedMembers) {
    const actual = member.progress?.progressPercentage ?? 0;
    if (actual > expectedProgress + 10) {
      member.progress.status = 'AHEAD';
    } else if (actual < expectedProgress - 10) {
      member.progress.status = 'BEHIND';
    } else {
      member.progress.status = 'ON_TRACK';
    }
  }

  next();
});

// ─── Static: generate unique 6-char room code ───────────────────────────────

roomSchema.statics.generateCode = async function (): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.findOne({ code });
    if (!existing) return code;
  }

  throw new Error('Failed to generate a unique room code after 5 attempts');
};

const Room = mongoose.model<IRoom, IRoomModel>('Room', roomSchema);

export default Room;
