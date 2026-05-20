"use client";

const DIFF_COLOR: Record<string, string> = {
  easy: "#AAFF3C",
  medium: "#00E5C3",
  hard: "#FF6B6B",
};

interface QuestionCardProps {
  questionIndex: number;
  totalQuestions: number;
  text: string;
  category: string;
  difficulty: string;
}

export default function QuestionCard({
  questionIndex,
  totalQuestions,
  text,
  category,
  difficulty,
}: QuestionCardProps) {
  return (
    <>
      {/* Header bar */}
      <div
        style={{
          padding: "24px 40px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(7, 11, 18, 0.5)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p
              style={{
                fontSize: 11,
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
                marginBottom: 4,
              }}
            >
              QUESTION {questionIndex + 1} OF {totalQuestions}
            </p>
            <h2
              style={{
                fontFamily: "var(--font-head)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)} Question
            </h2>
          </div>
          <div
            style={{
              padding: "8px 16px",
              background: DIFF_COLOR[difficulty] + "20",
              border: `1px solid ${DIFF_COLOR[difficulty]}`,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: DIFF_COLOR[difficulty],
            }}
          >
            {difficulty.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Question body card */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 32,
          marginBottom: 32,
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: "var(--muted)",
            marginBottom: 12,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
          }}
        >
          THE QUESTION
        </p>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", lineHeight: 1.6 }}>
          {text}
        </h3>
      </div>
    </>
  );
}