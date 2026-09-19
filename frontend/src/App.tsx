import React, { useState, useEffect } from 'react';
import { Session, FingerprintScores } from './types';
import { createSession } from './api/client';
import { FingerprintChart } from './components/FingerprintChart';
import { RootCauseInsight } from './components/RootCauseInsight';
import { ChatPanel } from './components/ChatPanel';
import { PracticeMode } from './components/PracticeMode';
import './App.css';

const INITIAL_SCORES: FingerprintScores = {
  article_absence: 0,
  tense_marking: 0,
  preposition_transfer: 0,
  word_order: 0,
  pluralization: 0,
  gender_pronoun: 0
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [nameInput, setNameInput] = useState('');
  
  const [fingerprint, setFingerprint] = useState<FingerprintScores>(INITIAL_SCORES);
  const [previousFingerprint, setPreviousFingerprint] = useState<FingerprintScores | undefined>(undefined);
  
  const [practiceMode, setPracticeMode] = useState<{ active: boolean, sentences: string[], cause: string }>({
    active: false,
    sentences: [],
    cause: ''
  });

  // Top root cause for insight
  const [topRootCause, setTopRootCause] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem('tamilbridge_session_id');
    const savedName = localStorage.getItem('tamilbridge_session_name');
    if (savedId && savedName) {
      setSession({ id: savedId, name: savedName, session_count: 1 });
    }
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    try {
      const newSession = await createSession(nameInput);
      setSession(newSession);
      localStorage.setItem('tamilbridge_session_id', newSession.id);
      localStorage.setItem('tamilbridge_session_name', newSession.name);
    } catch (err) {
      console.error('Error starting session', err);
      // Fallback for UI if backend is not available
      const fallback = { id: Date.now().toString(), name: nameInput, session_count: 1 };
      setSession(fallback);
    }
  };

  const handleFingerprintUpdate = (scores: FingerprintScores) => {
    setPreviousFingerprint(fingerprint);
    setFingerprint(scores);
    
    let max = 0;
    let top: string | null = null;
    Object.entries(scores).forEach(([key, val]) => {
      if (val > max) {
        max = val;
        top = key;
      }
    });
    setTopRootCause(top);
  };

  const handlePracticeMode = (sentences: string[], cause: string) => {
    setPracticeMode({ active: true, sentences, cause });
  };

  const closePractice = () => {
    setPracticeMode({ active: false, sentences: [], cause: '' });
  };

  if (!session) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h1>TamilBridge 2.0</h1>
          <p className="subtitle tamil-text">தமிழ் கற்போர்க்கான AI ஆசிரியர்</p>
          <form onSubmit={handleStart}>
            <input 
              type="text" 
              placeholder="Enter your name" 
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary">Start Learning</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TamilBridge 2.0</h1>
        <div className="user-badge">
          Welcome, {session.name}
        </div>
      </header>
      
      <main className="main-content">
        <div className="left-column">
          <FingerprintChart scores={fingerprint} previousScores={previousFingerprint} />
          <RootCauseInsight topRootCause={topRootCause} scores={fingerprint} />
        </div>
        
        <div className="right-column">
          <ChatPanel 
            session={session} 
            onFingerprintUpdate={handleFingerprintUpdate}
            onPracticeMode={handlePracticeMode}
          />
        </div>
      </main>

      {practiceMode.active && (
        <PracticeMode 
          sentences={practiceMode.sentences} 
          topRootCause={practiceMode.cause}
          onComplete={closePractice}
        />
      )}
    </div>
  );
}

export default App;
