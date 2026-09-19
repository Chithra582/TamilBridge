import { Session, UtteranceResponse, FingerprintScores } from '../types';

const BASE_URL = '';

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
