import React, { useState, useEffect, useRef } from 'react';
import { Session, ChatMessage, FingerprintScores, CATEGORY_LABELS, ErrorCategory } from '../types';
import { sendUtterance, getDemoSentences } from '../api/client';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  session: Session;
  onFingerprintUpdate: (scores: FingerprintScores) => void;
  onPracticeMode: (sentences: string[], cause: string) => void;
}

export const ChatPanel: React.FC<Props> = ({ session, onFingerprintUpdate, onPracticeMode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoSentences, setDemoSentences] = useState<string[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, startListening, stopListening, speak } = useSpeech();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, transcript]);

  // Sync speech transcript to input
  useEffect(() => {
    if (isListening && transcript) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      text,
      timestamp: new Date()
    }]);
    
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await sendUtterance(session.id, text);
      
      onFingerprintUpdate(res.fingerprint);
      
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'ai',
        text: res.corrected_text,
        tamilText: res.tamil_response,
        rootCauseTags: res.root_cause_tags,
        topRootCause: res.top_root_cause,
        correctedText: res.corrected_text !== text ? res.corrected_text : undefined,
        timestamp: new Date()
      }]);

      if (res.tamil_response) {
        speak(res.tamil_response);
      }

      if (res.practice_mode && res.practice_sentences && res.practice_sentences.length > 0) {
        // slight delay to let user read message before interrupting
        setTimeout(() => {
          onPracticeMode(res.practice_sentences, res.top_root_cause);
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const toggleMic = () => {
    if (isListening) {
      const finalTranscript = stopListening();
      if (finalTranscript || inputValue) {
        handleSend(finalTranscript || inputValue);
      }
    } else {
      setInputValue('');
      startListening();
    }
  };

  const startDemo = async () => {
    try {
      setDemoMode(true);
      const sentences = await getDemoSentences();
      setDemoSentences(sentences);
      
      // Auto run demo
      let i = 0;
      const runNext = async () => {
        if (i < sentences.length) {
          const sent = sentences[i];
          setInputValue(sent);
          await new Promise(r => setTimeout(r, 1000));
          await handleSend(sent);
          i++;
          setTimeout(runNext, 2000);
        } else {
          setDemoMode(false);
          setDemoSentences([]);
        }
      };
      runNext();
    } catch (e) {
      console.error(e);
      setDemoMode(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>Conversation</h2>
        <button className="demo-btn" onClick={startDemo} disabled={isLoading || demoMode}>
          🎬 Demo Mode
        </button>
      </div>
      
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className="empty-chat">
            <p className="tamil-text">வணக்கம்! Speak or type in English, and I'll help you improve.</p>
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`message-wrapper ${msg.role}`}>
            <div className={`message-bubble ${msg.role}`}>
              {msg.role === 'user' ? (
                <p className="msg-text">{msg.text}</p>
              ) : (
                <div className="ai-content">
                  {msg.tamilText && <p className="tamil-text ai-tamil">{msg.tamilText}</p>}
                  
                  {msg.correctedText && msg.correctedText !== msg.text && (
                    <div className="correction-box">
                      <span className="correction-label">Suggestion:</span>
                      <p>{msg.correctedText}</p>
                    </div>
                  )}
                  
                  {msg.rootCauseTags && msg.rootCauseTags.length > 0 && (
                    <div className="tags-container">
                      {msg.rootCauseTags.map((tag, idx) => {
                        const cat = tag as ErrorCategory;
                        const label = CATEGORY_LABELS[cat] || tag;
                        return (
                          <span key={idx} className="tag-pill">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper ai">
            <div className="message-bubble ai loading">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        {demoMode && demoSentences.length > 0 && (
          <div className="demo-chip">
            Auto-playing Demo...
          </div>
        )}
        <form onSubmit={onSubmit} className="input-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type or say something..."
            disabled={isLoading || demoMode}
            className="text-input"
          />
          <button 
            type="button" 
            className={`mic-button main-mic ${isListening ? 'recording' : ''}`}
            onClick={toggleMic}
            disabled={isLoading || demoMode}
            title={isListening ? "Stop & Send" : "Start Speaking"}
          >
            {isListening ? '🛑' : '🎤'}
          </button>
          <button 
            type="submit" 
            className="send-button"
            disabled={!inputValue.trim() || isLoading || demoMode}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
