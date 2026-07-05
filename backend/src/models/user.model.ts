import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRefreshToken {
  token: string;
  createdAt: Date;
}

export interface IDuoStreak {
  count: number;
  lastUpdated?: Date;
}

export interface IFocusStreak {
  count: number;
  lastUpdated?: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  avatar?: string;
  googleId: string;

  partnerId?: mongoose.Types.ObjectId;
  partnerStatus: 'none' | 'pending' | 'accepted';

  duoStreak: IDuoStreak;
  focusStreak: IFocusStreak;

  isOnline: boolean;
  lastActive?: Date;

  refreshTokens: IRefreshToken[];

  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    avatar: { type: String },
    googleId: { type: String, required: true, unique: true },

    partnerId: { type: Schema.Types.ObjectId, ref: 'User' },
    partnerStatus: {
      type: String,
      enum: ['none', 'pending', 'accepted'],
      default: 'none',
    },

    duoStreak: {
      count: { type: Number, default: 0 },
      lastUpdated: { type: Date },
    },

    focusStreak: {
      count: { type: Number, default: 0 },
      lastUpdated: { type: Date },
    },

    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date },

    refreshTokens: [RefreshTokenSchema],
  },
  { timestamps: true }
);

// Never return sensitive fields in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.googleId;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
