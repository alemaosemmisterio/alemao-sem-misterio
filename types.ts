export type GermanLevel = 'A1' | 'A2' | 'B1';

export type ScenarioType = 'conversation' | 'writing';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  level: GermanLevel;
  emoji: string;
  type: ScenarioType;
  persona: string; // e.g., "a friendly waiter", "a new colleague"
}

export type PracticeMode = 'chat' | 'conversation' | 'pronunciation';

export interface Persona {
  name: string;
  voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  formality: 'formal' | 'informal';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  avatar?: string;
  audio_base64?: string;
  isAudioLoading?: boolean;
  feedback?: Feedback;
  suggestion?: string;
  suggestionError?: boolean;
  translation?: string;
  isTranslating?: boolean;
}

export interface Correction {
  erroneous: string;
  correct: string;
  explanation: string;
}

export interface Feedback {
  summary: string;
  corrections: Correction[];
  suggestions: string[];
}

export interface OverallFeedback {
  summary: string;
  strengths: string;
  errorPatterns: string;
  tips: string;
  newExpressions: string; // Added field for new expressions
}

// Types for Pronunciation Trainer
export type WordFeedbackScore = 'correct' | 'partial' | 'incorrect' | 'unrecognized';

export interface WordFeedback {
  word: string;
  score: WordFeedbackScore;
  tip?: string;
}

export interface PronunciationFeedback {
  overallScore: number; // Percentage, e.g., 85
  feedbackSummary: string;
  words: WordFeedback[];
}