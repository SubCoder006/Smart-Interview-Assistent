"use client";
import { motion } from "framer-motion";

const DIFF_COLOR: Record<string, string> = {
  easy: "#AAFF3C",
  medium: "#00E5C3",
  hard: "#FF6B6B",
};

interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: string;
}

interface QuestionResponse {
  questionId: string;
  answerText: string;
  answered?: boolean;
}

interface SessionCardProps {
  role: string;
  difficulty: string;
  questions: Question[];
  responses: QuestionResponse[];
  currentQuestionIndex: number;
  showFeedback: boolean;
  startTime: number;
  onQuestionClick: (idx: number) => void;
}

export default function SessionCard({
  role,
  difficulty,
  questions,
  responses,
  currentQuestionIndex,
  showFeedback,
  startTime,
  onQuestionClick,
}: SessionCardProps) {
  const totalQuestions = questions.length;
  const answeredCount = responses.length + (showFeedback ? 1 : 0);
  const progress = (answeredCount / totalQuestions) * 100;
  const totalTime = Math.round((Date.now() - startTime) / 1000);

  return (
    <div
      style={{
        width: 280,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxHeight: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Logo + Role */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "linear-gradient(135deg, var(--lime), var(--cyan))",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#070B12",
            }}
          >
            IP
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>InterPrep</span>
        </div>
        
      </div>

      {/* Progress Bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Progress</p>
          <p style={{ fontSize: 12, color: "var(--lime)", fontWeight: 600 }}>
            {answeredCount} / {totalQuestions}
          </p>
        </div>
        <div style={{ height: 6, background: "var(--card)", borderRadius: 3, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, var(--lime), var(--cyan))",
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      {/* Time & Difficulty */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Time Elapsed</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--cyan)", fontFamily: "var(--font-mono)" }}>
            {Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, "0")}
          </span>
        </div><p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{role ?? ""}</p>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Difficulty</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: difficulty ? DIFF_COLOR[difficulty] || "var(--cyan)" : "var(--cyan)" }}>
            {difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : "—"}
          </span>
        </div>
      </div>

      {/* Questions List */}
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--muted)",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Questions
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {questions.map((q, idx) => {
            const isAnswered = responses.some((r) => r.questionId === q.id);
            const isCurrent = idx === currentQuestionIndex;
            return (
              <motion.div
                key={q.id}
                whileHover={{ x: isCurrent ? 0 : 4 }}
                onClick={() => isAnswered && onQuestionClick(idx)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: isAnswered ? "pointer" : "default",
                  background: isCurrent ? "rgba(170,255,60,0.1)" : "transparent",
                  border: isCurrent ? "1px solid rgba(170,255,60,0.3)" : "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    background: isAnswered ? "rgba(170,255,60,0.2)" : "var(--card)",
                    color: isAnswered ? "var(--lime)" : "var(--muted)",
                    border: `1px solid ${isAnswered ? "rgba(170,255,60,0.3)" : "var(--border)"}`,
                  }}
                >
                  {isAnswered ? "✓" : idx + 1}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: isCurrent ? "var(--lime)" : "var(--text)",
                    fontWeight: isCurrent ? 600 : 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                  }}
                >
                  Q{idx + 1}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}