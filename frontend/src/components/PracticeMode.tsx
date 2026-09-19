import React, { useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  sentences: string[];
  topRootCause: string;
  onComplete: () => void;
}

export const PracticeMode: React.FC<Props> = ({ sentences, topRootCause, onComplete }) => {
  const { isListening, startListening, stopListening } = useSpeech();
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Record<number, string>>({});

  const handleMicClick = (index: number) => {
    if (isListening && activeSentenceIndex === index) {
      const transcript = stopListening();
      setAttempts(prev => ({ ...prev, [index]: transcript || '(No audio detected)' }));
      setActiveSentenceIndex(null);
    } else {
      if (isListening) stopListening();
      setActiveSentenceIndex(index);
      startListening((text) => {
        setAttempts(prev => ({ ...prev, [index]: text }));
      });
    }
  };

  return (
    <div className="practice-overlay">
      <div className="practice-panel">
        <h2 className="practice-title tamil-text">இதை மட்டும் கொஞ்சம் பிராக்டீஸ் பண்ணலாமா?</h2>
        <p className="practice-subtitle">Focusing on: <strong>{topRootCause.replace('_', ' ')}</strong></p>
        
        <div className="practice-list">
          {sentences.map((sentence, idx) => (
            <div key={idx} className="practice-item">
              <div className="practice-item-header">
                <span className="practice-sentence">{sentence}</span>
                <button 
                  className={`mic-button ${isListening && activeSentenceIndex === idx ? 'recording' : ''}`}
                  onClick={() => handleMicClick(idx)}
                >
                  {isListening && activeSentenceIndex === idx ? '🛑' : '🎤'}
                </button>
              </div>
              {attempts[idx] && (
                <div className="practice-attempt">
                  <span className="attempt-label">You said:</span>
                  <span className="attempt-text">{attempts[idx]}</span>
                  {/* Basic string matching for feedback, real app would use better NLP */}
                  {attempts[idx].toLowerCase().replace(/[^a-z0-9]/gi, '') === sentence.toLowerCase().replace(/[^a-z0-9]/gi, '') ? (
                    <span className="feedback-icon success">✅ Perfect!</span>
                  ) : (
                    <span className="feedback-icon try-again">Try closer to the text!</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="btn-primary complete-btn" onClick={onComplete}>
          Done Practicing
        </button>
      </div>
    </div>
  );
};
