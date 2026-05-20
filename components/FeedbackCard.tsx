"use client";
import { motion } from "framer-motion";

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

interface FeedbackCardProps {
  answer: string;
  feedback: Feedback;
}

export default function FeedbackCard({ answer, feedback }: FeedbackCardProps) {
  return (
    <>
      {/* Your Answer */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--cyan)",
            marginBottom: 12,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
          }}
        >
          YOUR ANSWER
        </p>
        <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{answer}</p>
      </div>

      {/* Model Answer */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--lime)",
            marginBottom: 12,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
          }}
        >
          REFINED ANSWER
        </p>
        <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{feedback.modelAnswer}</p>
      </div>

      {/* Score + Strengths + Improvements */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
        }}
      >
        {/* Score header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--coral)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
            }}
          >
            FEEDBACK & SCORE
          </p>
          <div
            style={{
              padding: "8px 16px",
              background: "rgba(170, 255, 60, 0.15)",
              border: "1px solid rgba(170, 255, 60, 0.3)",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--lime)",
            }}
          >
            {Math.round(feedback.score)}/100
          </div>
        </div>

        {/* Strengths */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--lime)", marginBottom: 10 }}>
            Strengths
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {feedback.strengths.map((strength, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  background: "rgba(170, 255, 60, 0.08)",
                  borderRadius: 8,
                  border: "1px solid rgba(170, 255, 60, 0.15)",
                }}
              >
                <span style={{ color: "var(--lime)", fontWeight: 700, minWidth: 20 }}>✓</span>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{strength}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--coral)", marginBottom: 10 }}>
            Areas to Improve
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {feedback.improvements.map((improvement, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  background: "rgba(255, 107, 107, 0.08)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 107, 107, 0.15)",
                }}
              >
                <span style={{ color: "var(--coral)", fontWeight: 700, minWidth: 20 }}>→</span>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{improvement}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}