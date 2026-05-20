// ─── Configuration ────────────────────────────────────────────────────────────

const AI_PROVIDER  = (process.env.AI_PROVIDER ?? "ollama") as "ollama" | "huggingface";
const OLLAMA_URL   = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL    ?? "llama3.2";
const HF_TOKEN     = process.env.HF_API_TOKEN;
const HF_MODEL     = process.env.HF_MODEL        ?? "meta-llama/Meta-Llama-3-8B-Instruct";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionCategory = "technical" | "behavioral" | "situational" | "system-design";
export type Difficulty       = "easy" | "medium" | "hard";

export interface GeneratedQuestion {
  id:               string;
  text:             string;
  category:         QuestionCategory;
  difficulty:       Difficulty;
  expectedKeywords: string[];
}

export interface AIFeedback {
  score:        number;       // 0–100
  strengths:    string[];
  improvements: string[];
  modelAnswer:  string;
}

export interface GenerateQuestionsInput {
  role:        string;
  level:       string;
  resumeText:  string;
  difficulty:  Difficulty;
  count:       number;
  skills?:     string[];
}

// ─── System persona ───────────────────────────────────────────────────────────
// Shared system instruction injected into every AI call.
// Keeps the model in "JSON API mode" and prevents conversational drift.

const SYSTEM_PROMPT = `\
You are a structured JSON API used by an AI-powered interview platform.
Your sole purpose is to return valid, parseable JSON objects — nothing else.

STRICT RULES:
- Output ONLY raw JSON. No markdown. No backticks. No code fences.
- Do NOT include any explanation, preamble, commentary, or trailing text.
- Do NOT ask questions back. Do NOT roleplay. Do NOT converse.
- Your entire response must be a single JSON object that can be passed directly to JSON.parse().
- If you are uncertain about any field, use a reasonable default rather than omitting it.`;

// ─── Safe JSON parser ─────────────────────────────────────────────────────────

function safeParse<T>(raw: string): T {
  // Strip markdown fences if the model disobeys
  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Find the first JSON object or array boundary
  const start = cleaned.search(/[{[]/);
  if (start === -1) {
    throw new Error(`AI returned no JSON. Raw response:\n${raw.slice(0, 300)}`);
  }

  cleaned = cleaned.slice(start);

  // Find the matching closing bracket
  const isArray  = cleaned[0] === "[";
  const open     = isArray ? "[" : "{";
  const close    = isArray ? "]" : "}";
  let depth      = 0;
  let end        = -1;

  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === open)  depth++;
    if (cleaned[i] === close) depth--;
    if (depth === 0) { end = i + 1; break; }
  }

  const jsonStr = end > 0 ? cleaned.slice(0, end) : cleaned;

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(`JSON.parse failed. Extracted:\n${jsonStr.slice(0, 400)}`);
  }
}

// ─── Schema validators ────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set(["technical", "behavioral", "situational", "system-design"]);
const VALID_DIFFICULTY  = new Set(["easy", "medium", "hard"]);

function validateQuestions(raw: unknown, expectedCount: number): GeneratedQuestion[] {
  const data = raw as { questions?: unknown[] };

  if (!data?.questions || !Array.isArray(data.questions)) {
    throw new Error("Response missing 'questions' array");
  }

  return data.questions.slice(0, expectedCount).map((q: any, i: number) => {
    if (typeof q.text !== "string" || !q.text.trim()) {
      throw new Error(`Question ${i + 1} has no valid 'text' field`);
    }

    return {
      id:               q.id               ?? `q${i + 1}`,
      text:             q.text.trim(),
      category:         VALID_CATEGORIES.has(q.category) ? q.category : "technical",
      difficulty:       VALID_DIFFICULTY.has(q.difficulty) ? q.difficulty : "medium",
      expectedKeywords: Array.isArray(q.expectedKeywords) ? q.expectedKeywords : [],
    } satisfies GeneratedQuestion;
  });
}

function validateFeedback(raw: unknown): AIFeedback {
  const f = raw as any;

  const score = typeof f?.score === "number"
    ? Math.min(100, Math.max(0, Math.round(f.score)))
    : 50;

  return {
    score,
    strengths:    Array.isArray(f?.strengths)    ? f.strengths.filter(Boolean)    : ["Answer provided"],
    improvements: Array.isArray(f?.improvements) ? f.improvements.filter(Boolean) : ["Could not evaluate"],
    modelAnswer:  typeof f?.modelAnswer === "string" && f.modelAnswer.trim()
      ? f.modelAnswer.trim()
      : "No model answer available.",
  };
}

// ─── Retry with exponential backoff ──────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 2000,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isLast = attempt === retries;
      const msg    = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️  AI attempt ${attempt}/${retries}: ${msg}`);
      if (isLast) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
    }
  }
  throw new Error("AI call exhausted all retries");
}

// ─── Ollama provider ──────────────────────────────────────────────────────────

async function callOllama(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:  OLLAMA_MODEL,
      stream: false,
      format: "json",
      options: {
        temperature: 0.2,   // low temp = more deterministic, fewer hallucinations
        top_p:       0.9,
        num_predict: 2048,
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ollama ${res.status}: ${body || res.statusText}`);
  }

  const data = await res.json();
  const content = data?.message?.content ?? data?.response;

  if (!content) throw new Error("Ollama returned empty content");
  return content;
}

// ─── HuggingFace provider ─────────────────────────────────────────────────────

async function callHuggingFace(prompt: string): Promise<string> {
  if (!HF_TOKEN) throw new Error("HF_API_TOKEN is not set");

  const res = await fetch(
    `https://api-inference.huggingface.co/models/${HF_MODEL}/v1/chat/completions`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: prompt },
        ],
        max_tokens:  2048,
        temperature: 0.2,
        top_p:       0.9,
      }),
    },
  );

  if (res.status === 503) throw new Error("HuggingFace model cold-starting — retrying");

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HuggingFace ${res.status}: ${body || res.statusText}`);
  }

  const data    = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) throw new Error("HuggingFace returned empty content");
  return content;
}

// ─── Provider router ──────────────────────────────────────────────────────────

async function callAI(prompt: string): Promise<string> {
  const caller = AI_PROVIDER === "huggingface" ? callHuggingFace : callOllama;
  return withRetry(() => caller(prompt));
}

// ─── Generate interview questions ─────────────────────────────────────────────

export async function generateQuestions(
  input: GenerateQuestionsInput,
): Promise<GeneratedQuestion[]> {
  const { role, level, resumeText, difficulty, count, skills = [] } = input;

  const skillsSection = skills.length > 0
    ? `Candidate's detected skills: ${skills.slice(0, 12).join(", ")}.`
    : "";

  const categoryGuide =
    difficulty === "easy"   ? "Focus on fundamentals and basic concepts. Use mostly technical and behavioral questions." :
    difficulty === "medium" ? "Mix technical depth, behavioral scenarios, and one situational problem-solving question." :
                              "Include complex system-design, deep technical, and high-stakes behavioral questions.";

  const prompt = `\
TASK: Generate exactly ${count} interview questions.

CANDIDATE PROFILE:
- Role: ${role}
- Experience Level: ${level}
- Difficulty: ${difficulty}
${skillsSection}
- Resume excerpt: "${resumeText.slice(0, 600).replace(/\n+/g, " ").trim()}"

QUESTION STRATEGY:
${categoryGuide}
- Each question must directly relate to the role and resume context.
- Questions must be specific, not generic. Avoid clichés like "Tell me about yourself."
- Each question should reveal real depth of knowledge or genuine character.
- expectedKeywords should be 3–6 concepts a strong answer would mention.

OUTPUT FORMAT (return this exact JSON structure, nothing else):
{
  "questions": [
    {
      "id": "q1",
      "text": "<the interview question>",
      "category": "<technical|behavioral|situational|system-design>",
      "difficulty": "${difficulty}",
      "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

Generate exactly ${count} items in the "questions" array.`;

  const raw     = await callAI(prompt);
  const parsed  = safeParse<unknown>(raw);
  return validateQuestions(parsed, count);
}

// ─── Get AI feedback on an answer ─────────────────────────────────────────────

export async function getFeedback(
  question: string,
  answer:   string,
): Promise<AIFeedback> {

  const wordCount = answer.trim().split(/\s+/).length;
  const answerQuality =
    wordCount < 10  ? "very short / incomplete" :
    wordCount < 40  ? "brief" :
    wordCount < 120 ? "moderate length" :
                      "detailed";

  const prompt = `\
TASK: Evaluate a candidate's interview answer and return structured feedback.

QUESTION: "${question}"

CANDIDATE'S ANSWER (${answerQuality}, ~${wordCount} words):
"${answer.trim()}"

EVALUATION CRITERIA:
- Relevance: Does the answer directly address the question?
- Depth: Are concepts explained with appropriate technical or contextual detail?
- Clarity: Is the answer well-structured and easy to follow?
- Completeness: Are key aspects covered without unnecessary padding?
- Confidence: Does the answer reflect genuine understanding?

SCORING GUIDE:
- 90–100: Exceptional. Covers all key points with insight and precision.
- 75–89:  Strong. Solid answer with minor gaps.
- 55–74:  Average. Covers basics but lacks depth or misses key points.
- 35–54:  Weak. Partially relevant but significantly incomplete.
- 0–34:   Poor. Off-topic, too vague, or factually incorrect.

OUTPUT FORMAT (return this exact JSON, nothing else):
{
  "score": <integer 0-100>,
  "strengths": [
    "<specific strength observed in the answer>",
    "<another strength>"
  ],
  "improvements": [
    "<specific, actionable improvement with reasoning>",
    "<another improvement>"
  ],
  "modelAnswer": "<A concise, exemplary answer in 3–5 sentences that a top candidate would give. Be concrete and insightful.>"
}

Be honest, constructive, and specific. Do not be lenient with incomplete answers.`;

  const raw    = await callAI(prompt);
  const parsed = safeParse<unknown>(raw);
  return validateFeedback(parsed);
}

// ─── Health check ─────────────────────────────────────────────────────────────

export async function checkAIHealth(): Promise<{
  provider: string;
  model:    string;
  status:   "ok" | "error";
  message?: string;
}> {
  const model = AI_PROVIDER === "huggingface" ? HF_MODEL : OLLAMA_MODEL;
  try {
    const raw    = await callAI('Output this JSON exactly: {"status":"ok"}');
    const parsed = safeParse<{ status: string }>(raw);
    if (parsed?.status !== "ok") throw new Error("Unexpected health response");
    return { provider: AI_PROVIDER, model, status: "ok" };
  } catch (err) {
    return {
      provider: AI_PROVIDER,
      model,
      status:   "error",
      message:  err instanceof Error ? err.message : "Unknown error",
    };
  }
}