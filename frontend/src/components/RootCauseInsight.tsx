import React from 'react';
import { FingerprintScores, CATEGORY_LABELS, ErrorCategory } from '../types';

interface Props {
  topRootCause: string | null;
  scores: FingerprintScores;
}

const INSIGHTS: Record<ErrorCategory, string> = {
  article_absence: "'a', 'an', 'the' போன்ற articles பயன்படுத்த மறக்கிறோம்",
  tense_marking: "நேரத்தை (past/present/future) சரியாக காட்டவில்லை",
  preposition_transfer: "'to', 'at', 'in' போன்ற prepositions தவறாக பயன்படுத்துகிறோம்",
  word_order: "வார்த்தைகளை தமிழ் வரிசையில் (SOV) வைக்கிறோம்",
  pluralization: "பன்மை (plural) சரியாக பயன்படுத்தவில்லை",
  gender_pronoun: "he/she pronoun குழப்பமாக இருக்கிறது"
};

export const RootCauseInsight: React.FC<Props> = ({ topRootCause, scores }) => {
  const isAllZero = Object.values(scores).every(val => val === 0);

  if (isAllZero || !topRootCause) {
    return (
      <div className="insight-card empty-insight">
        <p>Practice to see your pattern emerge! 🌱</p>
      </div>
    );
  }

  const category = topRootCause as ErrorCategory;
  const label = CATEGORY_LABELS[category] || topRootCause;
  const description = INSIGHTS[category] || '';

  return (
    <div className="insight-card">
      <h4 className="insight-header">Top Area for Improvement</h4>
      <div className="insight-badge pulse-animation">
        {label}
      </div>
      <p className="insight-description tamil-text">
        {description}
      </p>
    </div>
  );
};
