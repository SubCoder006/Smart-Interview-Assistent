// models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  // identity
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  isVerified: boolean;
  provider: "local" | "google" | "github";

  // resume
  resumeText?: string;
  resumeUpdatedAt?: Date;
  skills?: string[];

  // interview preferences (feeds into AI prompt)
  preferences: {
    targetRole: string;
    targetLevel: "junior" | "mid" | "senior" | "lead";
    targetCompanies: string[];
    preferredDifficulty: "easy" | "medium" | "hard";
    questionCount: number;
  };

  // usage / plan
  plan: "free" | "pro";
  sessionsUsedThisMonth: number;
  monthlyLimit: number;

  // stats (updated after each session completes)
  stats: {
    totalSessions: number;
    avgOverallScore: number;
    bestScore: number;
    streak: number;
    lastSessionAt?: Date;
  };

  // security
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLoginAt?: Date;
  loginCount: number;

  createdAt: Date;
  updatedAt: Date;

  // instance methods
  comparePassword(plain: string): Promise<boolean>;
  canStartSession(): boolean;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    // identity
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false, default: "" },
    avatarUrl:    { type: String },
    isVerified:   { type: Boolean, default: false },
    provider:     { type: String, enum: ["local", "google", "github"], default: "local" },

    // resume — full raw text lives here, Session only stores a snapshot
    resumeText:      { type: String, maxlength: 10000 },
    resumeUpdatedAt: { type: Date },
    skills:          [{ type: String, trim: true, default: [] }],

    // preferences — sent to AI on every generate call
    preferences: {
      targetRole:          { type: String, default: "" },
      targetLevel:         { type: String, enum: ["junior", "mid", "senior", "lead"], default: "mid" },
      targetCompanies:     [{ type: String }],
      preferredDifficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
      questionCount:       { type: Number, min: 3, max: 15, default: 5 },
    },

    // plan / usage
    plan:                  { type: String, enum: ["free", "pro"], default: "free" },
    sessionsUsedThisMonth: { type: Number, default: 0 },
    monthlyLimit:          { type: Number, default: 10 }, // free = 10, pro = unlimited (999)

    // stats
    stats: {
      totalSessions:  { type: Number, default: 0 },
      avgOverallScore:{ type: Number, default: 0 },
      bestScore:      { type: Number, default: 0 },
      streak:         { type: Number, default: 0 },
      lastSessionAt:  { type: Date },
    },

    // security
    resetPasswordToken:   { type: String },
    resetPasswordExpires: { type: Date },
    lastLoginAt:          { type: Date },
    loginCount:           { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ "stats.lastSessionAt": -1 });

// ─── Pre-save: hash password only when modified and not already hashed ───────────────────────────────

UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  if (!this.passwordHash) return;
  if (this.passwordHash.startsWith('$2')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// ─── Instance methods ─────────────────────────────────────────────────────────

// compare plain password against stored hash
UserSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

// check if user can start a new session (plan limit)
UserSchema.methods.canStartSession = function (): boolean {
  if (this.plan === "pro") return true;
  return this.sessionsUsedThisMonth < this.monthlyLimit;
};

// ─── Export ───────────────────────────────────────────────────────────────────

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;