// models/Sessions.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { nanoid } from "nanoid";

// ─── Sub-document interfaces ──────────────────────────────────────────────────

interface IFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

interface IQuestion {
  id: string;
  text: string;
  category: "technical" | "behavioral" | "situational" | "system-design";
  difficulty: "easy" | "medium" | "hard";
  expectedKeywords: string[];
}

interface IResponse {
  questionId: string;
  answerText: string;           // from user
  timeTakenSecs: number;        // from frontend timer
  feedback: IFeedback;          // from AI
  answeredAt: Date;
}

// ─── Main Session interface ───────────────────────────────────────────────────

export interface ISession extends Document {
  // identity
  userId: mongoose.Types.ObjectId;
  sessionCode: string;

  // user provided
  role: string;
  company?: string;
  level: "junior" | "mid" | "senior" | "lead";
  resumeSnapshot: string;

  // AI generated
  questions: IQuestion[];
  responses: IResponse[];

  // computed scores (updated after each AI feedback)
  overallScore: number;
  technicalScore: number;
  behavioralScore: number;
  completionRate: number;

  // state machine
  status: "created" | "in_progress" | "completed" | "abandoned";
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;

  // AI metadata (for debugging + cost tracking)
  aiMeta: {
    provider: "ollama" | "huggingface";
    model: string;
    generationMs: number;
    totalTokensUsed: number;
  };

  createdAt: Date;
  updatedAt: Date;

  // instance methods
  recalculateScores(): void;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const FeedbackSchema = new Schema<IFeedback>(
  {
    score:        { type: Number, min: 0, max: 100, default: 0 },
    strengths:    [{ type: String }],
    improvements: [{ type: String }],
    modelAnswer:  { type: String, default: "" },
  },
  { _id: false }   // no separate _id for embedded docs
);

const QuestionSchema = new Schema<IQuestion>(
  {
    id:               { type: String, required: true },
    text:             { type: String, required: true },
    category:         { type: String, enum: ["technical", "behavioral", "situational", "system-design"], required: true },
    difficulty:       { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    expectedKeywords: [{ type: String }],
  },
  { _id: false }
);

const ResponseSchema = new Schema<IResponse>(
  {
    questionId:    { type: String, required: true },
    answerText:    { type: String, required: true },   // user
    timeTakenSecs: { type: Number, default: 0 },       // user (frontend timer)
    feedback:      { type: FeedbackSchema, default: () => ({}) },  // AI
    answeredAt:    { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const SessionSchema = new Schema<ISession>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionCode:{ type: String, unique: true, default: () => `INT-${nanoid(6).toUpperCase()}` },

    // user input
    role:           { type: String, required: true, trim: true },
    company:        { type: String, trim: true },
    level:          { type: String, enum: ["junior", "mid", "senior", "lead"], default: "mid" },
    resumeSnapshot: { type: String, required: true, maxlength: 1000 }, // trimmed version only

    // AI generated
    questions: { type: [QuestionSchema], default: [] },
    responses:  { type: [ResponseSchema], default: [] },

    // computed (recalculated after every AI feedback response)
    overallScore:    { type: Number, default: 0 },
    technicalScore:  { type: Number, default: 0 },
    behavioralScore: { type: Number, default: 0 },
    completionRate:  { type: Number, default: 0 },  // 0–100 %

    // state machine
    status:      { type: String, enum: ["created", "in_progress", "completed", "abandoned"], default: "created" },
    startedAt:   { type: Date },
    completedAt: { type: Date },
    expiresAt:   { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days

    // AI metadata
    aiMeta: {
      provider:       { type: String, enum: ["ollama", "huggingface"], default: "ollama" },
      model:          { type: String, default: "" },
      generationMs:   { type: Number, default: 0 },
      totalTokensUsed:{ type: Number, default: 0 },
    },
  },
  {
    timestamps: true,   // auto createdAt + updatedAt
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL — MongoDB auto-deletes
SessionSchema.index({ userId: 1, createdAt: -1 });                 // dashboard/history queries
SessionSchema.index({ sessionCode: 1 }, { unique: true });

// ─── Instance method: recalculate scores after AI feedback ───────────────────

SessionSchema.methods.recalculateScores = function () {
  const responses = this.responses as IResponse[];
  if (!responses.length) return;

  const answered = responses.filter((r) => r.feedback?.score > 0);

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const questionMap = Object.fromEntries(
    (this.questions as IQuestion[]).map((q) => [q.id, q.category])
  );

  const techScores = answered
    .filter((r) => questionMap[r.questionId] === "technical")
    .map((r) => r.feedback.score);

  const behavScores = answered
    .filter((r) => questionMap[r.questionId] === "behavioral")
    .map((r) => r.feedback.score);

  this.overallScore    = avg(answered.map((r) => r.feedback.score));
  this.technicalScore  = avg(techScores);
  this.behavioralScore = avg(behavScores);
  this.completionRate  = Math.round((answered.length / this.questions.length) * 100);
};

// ─── Export ───────────────────────────────────────────────────────────────────

const Sessions: Model<ISession> =
  mongoose.models.Sessions ?? mongoose.model<ISession>("Sessions", SessionSchema);

export default Sessions;