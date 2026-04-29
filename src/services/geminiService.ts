import { CohereClientV2 } from 'cohere-ai';

const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

export interface Puzzle {
  id: string;
  discipline: string;
  title: string;
  scenario: string;
  technicalData: string;
  question: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  explanation: string;
}

export interface EvaluationResult {
  isCorrect: boolean;
  scoreAwarded?: number;
  feedback: string;
}

const MODEL_NAME = 'command-a-03-2025';

function extractText(response: Awaited<ReturnType<typeof cohere.chat>>): string {
  const content = response.message.content ?? [];
  return content
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n')
    .trim();
}

function parseJsonResponse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const withoutCodeFence = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(withoutCodeFence) as T;
  }
}

export async function evaluateAnswer(puzzle: Puzzle, userAnswer: string): Promise<EvaluationResult> {
  // Try exact match first to save API calls
  const normalizedUser = userAnswer.trim().toLowerCase();
  const validAnswers = [puzzle.correctAnswer, ...puzzle.acceptableAnswers].map(a => a.trim().toLowerCase());
  
  if (validAnswers.includes(normalizedUser)) {
    return {
      isCorrect: true,
      feedback: "Access granted. Your analysis is correct."
    };
  }

  // Fallback to AI evaluation if not an exact match
  const prompt = `
Given this engineering puzzle:
Title: ${puzzle.title}
Scenario: ${puzzle.scenario}
Question: ${puzzle.question}
Expected Answer: ${puzzle.correctAnswer}
Explanation: ${puzzle.explanation}

The user provided this answer: "${userAnswer}"

Evaluate if the user's answer is fundamentally correct and demonstrates an understanding of the root cause or correct technical solution, even if phrased differently.
Be strict but fair. If it's a guess or conceptually wrong, reject it.
`;

  const response = await cohere.chat({
    model: MODEL_NAME,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'You are the Chief Engineer evaluating a subordinate technical analysis. Respond with valid JSON only and no markdown code fences.'
      },
      {
        role: 'user',
        content: `${prompt}

Return exactly this JSON object shape:
{"isCorrect": boolean, "feedback": string}`
      }
    ]
  });

  const text = extractText(response);
  if (!text) return { isCorrect: false, feedback: "Evaluation circuit failure." };

  return parseJsonResponse<EvaluationResult>(text);
}
export async function generatePuzzle(discipline: string, difficulty: number): Promise<Puzzle> {
  const prompt = `Generate a unique, highly technical puzzle for a level ${difficulty}/10 expert in the ${discipline} engineering discipline. 
The scenario should mimic a real-world problem or emergency.
Do not make it a generic trivia question. Provide specific technical data (logs, code, spec tables) that the engineer must analyze to find a specific root cause or desired value.
The answer should be a specific succinct string, number, or identifier. It should not be an open-ended essay.`;

  const response = await cohere.chat({
    model: MODEL_NAME,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'You are an elitist, hyper-competent Chief Engineer constructing brutal technical evaluation scenarios for senior engineering candidates. Accuracy is paramount. Respond with valid JSON only and no markdown code fences.'
      },
      {
        role: 'user',
        content: `${prompt}

Return exactly this JSON object shape:
{
  "title": string,
  "scenario": string,
  "technicalData": string,
  "question": string,
  "correctAnswer": string,
  "acceptableAnswers": string[],
  "explanation": string
}`
      }
    ]
  });

  const text = extractText(response);
  if (!text) throw new Error("Failed to generate puzzle");
  
  const data = parseJsonResponse<Omit<Puzzle, 'id' | 'discipline'>>(text);
  return {
    id: Math.random().toString(36).substring(2, 9),
    discipline,
    ...data
  };
}
