import React, { useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  sentences: string[];
  topRootCause: string;
  onComplete: () => void;
}

export const PracticeMode: React.FC<Props> = ({ sentences, topRootCause, onComplete }) => {
  const { isListening, startListening, stopListening, speak, stopSpeaking } = useSpeech();
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Record<number, string>>({});
  const [typedInputs, setTypedInputs] = useState<Record<number, string>>({});

  const handleMicClick = (index: number) => {
    stopSpeaking();
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

  const handleTypeSubmit = (e: React.FormEvent, index: number) => {
    e.preventDefault();
    const text = typedInputs[index];
    if (!text || !text.trim()) return;
    setAttempts(prev => ({ ...prev, [index]: text.trim() }));
  };

  const handleDone = () => {
    stopSpeaking();
    if (isListening) stopListening();
    onComplete();
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
                <div className="practice-actions">
                  <button
                    type="button"
                    className="speak-btn practice-speak-btn"
                    onClick={() => speak(sentence, 'en-US')}
                    title="Listen to pronunciation"
                  >
                    🔊
                  </button>
                  <button 
                    type="button"
                    className={`mic-button ${isListening && activeSentenceIndex === idx ? 'recording' : ''}`}
                    onClick={() => handleMicClick(idx)}
                    title={isListening && activeSentenceIndex === idx ? "Stop recording" : "Speak into mic"}
                  >
                    {isListening && activeSentenceIndex === idx ? '🛑' : '🎤'}
                  </button>
                </div>
              </div>

              {/* Type Option for users whose mic is not working or unavailable */}
              <form onSubmit={(e) => handleTypeSubmit(e, idx)} className="practice-type-form">
                <input
                  type="text"
                  className="practice-type-input"
                  placeholder="Or type the sentence here..."
                  value={typedInputs[idx] || ''}
                  onChange={(e) => setTypedInputs({ ...typedInputs, [idx]: e.target.value })}
                />
                <button type="submit" className="practice-check-btn">
                  Check
                </button>
              </form>

              {attempts[idx] && (
                <div className="practice-attempt">
                  <span className="attempt-label">Your attempt:</span>
                  <span className="attempt-text">{attempts[idx]}</span>
                  {attempts[idx].toLowerCase().replace(/[^a-z0-9]/gi, '') === sentence.toLowerCase().replace(/[^a-z0-9]/gi, '') ? (
                    <span className="feedback-icon success">✅ Perfect! Very well done!</span>
                  ) : (
                    <span className="feedback-icon try-again">Try closer to the text! Check spelling/words above.</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="btn-primary complete-btn" onClick={handleDone}>
          Done Practicing
        </button>
      </div>
    </div>
  );
};
