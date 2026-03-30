import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  role: String,
  resumeText: String,
  questions: [String],
  answers: [String],
  feedback: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Session ||
  mongoose.model("Session", SessionSchema);