import { useState, useEffect, useCallback, useRef } from 'react';

// Extend window object to include speech recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeech = (lang = 'en-US') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const onResultCallbackRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = lang;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        if (finalTranscript && onResultCallbackRef.current) {
          onResultCallbackRef.current(finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      };
    }
  }, []);

  const startListening = useCallback((onResult?: (text: string) => void) => {
    if (recognitionRef.current) {
      if (onResult) {
        onResultCallbackRef.current = onResult;
      }
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Could not start recognition', e);
      }
    }
  }, []);

  const stopListening = useCallback((): string => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    return transcript;
  }, [transcript]);

  const getFemaleVoice = useCallback((targetLang: string): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const available = window.speechSynthesis.getVoices();
    if (!available || available.length === 0) return null;

    const langPrefix = targetLang.toLowerCase().split('-')[0];
    const femaleKeywords = [
      'female', 'woman', 'zira', 'heera', 'swara', 'veena', 'neerja', 'kavya',
      'sangeeta', 'pallavi', 'shruti', 'ananya', 'samantha', 'victoria',
      'karen', 'moira', 'tessa', 'fiona', 'google தமிழ்', 'google'
    ];

    // Priority 1: Target language voice that is explicitly female or Google Tamil
    const targetFemale = available.find(v =>
      (v.lang.toLowerCase().startsWith(langPrefix) || v.name.toLowerCase().includes('tamil')) &&
      femaleKeywords.some(k => v.name.toLowerCase().includes(k))
    );
    if (targetFemale) return targetFemale;

    // Priority 2: Any voice in the target language
    const anyTarget = available.find(v =>
      v.lang.toLowerCase().startsWith(langPrefix) || v.name.toLowerCase().includes('tamil')
    );
    if (anyTarget) return anyTarget;

    // Priority 3: Indian English Female voice (fluent pronunciation for Indian context)
    const indianFemale = available.find(v =>
      (v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase() === 'en_in') &&
      femaleKeywords.some(k => v.name.toLowerCase().includes(k))
    );
    if (indianFemale) return indianFemale;

    // Priority 4: Any system female voice
    const anyFemale = available.find(v =>
      femaleKeywords.some(k => v.name.toLowerCase().includes(k))
    );
    if (anyFemale) return anyFemale;

    return null;
  }, []);

  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const keepAliveTimerRef = useRef<any>(null);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
        keepAliveTimerRef.current = null;
      }
      activeUtterancesRef.current = [];
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const speak = useCallback((text: string, speechLang = 'ta-IN') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Text-to-Speech not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech and reset timers
    stopSpeaking();

    // Clean text for fluent natural speech:
    // Strip emojis, markdown, asterisks, brackets, and quotes that cause stuttering
    const cleanText = text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*#_`~>]/g, '')
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Split text into natural sentence chunks (by period, exclamation, question mark, or newline).
    // In Chrome, long utterances (>15s or >200 chars) cause the browser TTS buffer to freeze/get stuck.
    // Chunking ensures each sentence is spoken crisply without ever getting stuck.
    const rawChunks = cleanText.split(/(?<=[.!?:\n])\s+/);
    const chunks = rawChunks.map(c => c.trim()).filter(c => c.length > 0);

    if (chunks.length === 0) return;

    const femaleVoice = getFemaleVoice(speechLang);
    let currentIndex = 0;

    setIsSpeaking(true);

    // Keep-alive heartbeat: prevents Chrome from pausing speech synthesis midway through
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    keepAliveTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(keepAliveTimerRef.current);
        keepAliveTimerRef.current = null;
      }
    }, 10000);

    const speakChunk = (index: number) => {
      if (index >= chunks.length) {
        setIsSpeaking(false);
        if (keepAliveTimerRef.current) {
          clearInterval(keepAliveTimerRef.current);
          keepAliveTimerRef.current = null;
        }
        return;
      }

      const chunk = chunks[index];
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = speechLang;

      if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.lang = femaleVoice.lang;
      }

      // Fluent female cadence:
      // pitch: 1.12 (warm, encouraging female tone)
      // rate: 0.93 (clear, articulate, fluent phrasing)
      utterance.pitch = 1.12;
      utterance.rate = 0.93;

      // Keep strong reference in ref array so browser garbage collection doesn't stop speech
      activeUtterancesRef.current = [utterance];

      utterance.onend = () => {
        currentIndex++;
        // Small 120ms natural breathing pause between sentences
        setTimeout(() => {
          speakChunk(currentIndex);
        }, 120);
      };

      utterance.onerror = (e) => {
        console.error('Speech synthesis chunk error', e);
        currentIndex++;
        if (currentIndex < chunks.length) {
          speakChunk(currentIndex);
        } else {
          setIsSpeaking(false);
          if (keepAliveTimerRef.current) {
            clearInterval(keepAliveTimerRef.current);
            keepAliveTimerRef.current = null;
          }
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakChunk(0);
  }, [getFemaleVoice, stopSpeaking]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSpeaking
  };
};
