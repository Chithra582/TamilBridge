export interface FingerprintScores {
  article_absence: number;
  tense_marking: number;
  preposition_transfer: number;
  word_order: number;
  pluralization: number;
  gender_pronoun: number;
}

export interface UtteranceResponse {
  utterance_id: string;
  corrected_text: string;
  tamil_response: string;
  fingerprint: FingerprintScores;
  root_cause_tags: string[];
  top_root_cause: string;
  practice_mode: boolean;
  practice_sentences: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  tamilText?: string;
  rootCauseTags?: string[];
  topRootCause?: string;
  correctedText?: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  name: string;
  session_count: number;
}

export type ErrorCategory = 
  | 'article_absence'
  | 'tense_marking'
  | 'preposition_transfer'
  | 'word_order'
  | 'pluralization'
  | 'gender_pronoun';

export const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  article_absence: '🅰️ Articles (a/an/the)',
  tense_marking: '⏳ Tense (Past/Present)',
  preposition_transfer: '📍 Prepositions (in/on/at)',
  word_order: '🔄 Word Order (SOV vs SVO)',
  pluralization: '🔢 Pluralization',
  gender_pronoun: '🚻 Pronouns (he/she)'
};

export const CATEGORY_COLORS: Record<ErrorCategory, string> = {
  article_absence: '#ef4444', // red
  tense_marking: '#f97316', // orange
  preposition_transfer: '#eab308', // yellow
  word_order: '#22c55e', // green
  pluralization: '#3b82f6', // blue
  gender_pronoun: '#a855f7' // purple
};
