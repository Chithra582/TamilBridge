import { Session, UtteranceResponse, FingerprintScores } from '../types';

// In dev: empty string → Vite proxy forwards /api to localhost:8000
// In production (Render): uses VITE_API_BASE_URL if set, or defaults to backend Render URL
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://tamilbridge-backend.onrender.com' : '');

export const createSession = async (name: string): Promise<Session> => {
  const res = await fetch(`${BASE_URL}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
};

export const sendUtterance = async (learner_id: string, raw_text: string): Promise<UtteranceResponse> => {
  const res = await fetch(`${BASE_URL}/api/utterance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learner_id, raw_text })
  });
  if (!res.ok) throw new Error('Failed to send utterance');
  return res.json();
};

export const getFingerprint = async (learner_id: string): Promise<FingerprintScores> => {
  const res = await fetch(`${BASE_URL}/api/fingerprint/${learner_id}`);
  if (!res.ok) throw new Error('Failed to get fingerprint');
  return res.json();
};

export const getDemoSentences = async (): Promise<string[]> => {
  const res = await fetch(`${BASE_URL}/api/demo/sentences`);
  if (!res.ok) throw new Error('Failed to get demo sentences');
  return res.json();
};

export const getTTSAudioUrl = (text: string, lang = 'ta'): string => {
  return `${BASE_URL}/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
};
