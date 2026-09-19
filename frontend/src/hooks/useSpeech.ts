import { useState, useEffect, useCallback, useRef } from 'react';
import { getTTSAudioUrl } from '../api/client';

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

  // Audio & Cancellation references
  const isCancelledRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioTimerRef = useRef<any>(null);
  const keepAliveTimerRef = useRef<any>(null);
  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  const getFemaleVoice = useCallback((targetLang: string): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const available = window.speechSynthesis.getVoices();
    if (!available || available.length === 0) return null;

    const langPrefix = targetLang.toLowerCase().split('-')[0];
    const femaleKeywords = [
      'female', 'woman', 'zira', 'heera', 'swara', 'veena', 'neerja', 'kavya',
      'sangeeta', 'pallavi', 'shruti', 'ananya', 'samantha', 'victoria',
      'karen', 'moira', 'tessa', 'fiona', 'vani', 'google தமிழ்'
    ];
    const maleKeywords = ['valluvar', 'david', 'mark', 'george', 'ravi', 'male', 'man'];

    // Safe voices that are NOT male
    const nonMale = available.filter(v => 
      !maleKeywords.some(m => v.name.toLowerCase().includes(m))
    );

    // Priority 1: Target language female voice
    const targetFemale = nonMale.find(v =>
      (v.lang.toLowerCase().startsWith(langPrefix) || v.name.toLowerCase().includes('tamil')) &&
      femaleKeywords.some(k => v.name.toLowerCase().includes(k))
    );
    if (targetFemale) return targetFemale;

    // Priority 2: Indian English Female voice (fluent pronunciation)
    const indianFemale = nonMale.find(v =>
      (v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase() === 'en_in') &&
      femaleKeywords.some(k => v.name.toLowerCase().includes(k))
    );
    if (indianFemale) return indianFemale;

    // Priority 3: Any non-male target language voice
    const anyTargetNonMale = nonMale.find(v =>
      v.lang.toLowerCase().startsWith(langPrefix) || v.name.toLowerCase().includes('tamil')
    );
    if (anyTargetNonMale) return anyTargetNonMale;

    // Priority 4: Any female voice
    const anyFemale = nonMale.find(v =>
      femaleKeywords.some(k => v.name.toLowerCase().includes(k))
    );
    if (anyFemale) return anyFemale;

    return null;
  }, []);

  const stopSpeaking = useCallback(() => {
    isCancelledRef.current = true;

    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current);
      audioTimerRef.current = null;
    }

    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }

    // Instantly pause and drop any running HTML Audio element
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = '';
      } catch (_) {}
      currentAudioRef.current = null;
    }

    // Cancel Web Speech API immediately
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }

    activeUtterancesRef.current = [];
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const fallbackBrowserSpeak = useCallback((cleanText: string, speechLang: string) => {
    if (isCancelledRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const femaleVoice = getFemaleVoice(speechLang);
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      utterance.lang = femaleVoice.lang;
    } else {
      utterance.lang = speechLang;
    }

    utterance.pitch = 1.15;
    utterance.rate = 0.95;
    activeUtterancesRef.current = [utterance];

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      setIsSpeaking(false);
    }
  }, [getFemaleVoice]);

  const speak = useCallback((text: string, speechLang = 'ta-IN') => {
    // 1. Immediately cancel any ongoing speech
    stopSpeaking();
    isCancelledRef.current = false;

    // Clean text: remove markdown symbols, emojis, brackets, asterisks
    const cleanText = text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*#_`~>]/g, '')
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    setIsSpeaking(true);

    const tlParam = speechLang.toLowerCase().startsWith('en') ? 'en-IN' : 'ta';
    const audioUrl = getTTSAudioUrl(cleanText, tlParam);
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.onplay = () => {
      if (isCancelledRef.current) {
        audio.pause();
        return;
      }
      setIsSpeaking(true);
    };

    audio.onended = () => {
      setIsSpeaking(false);
      currentAudioRef.current = null;
    };

    audio.onerror = (e) => {
      console.warn('Backend TTS error, falling back to browser speech synthesis', e);
      if (isCancelledRef.current) return;
      fallbackBrowserSpeak(cleanText, speechLang);
    };

    audio.play().catch(e => {
      console.warn('Audio play error, falling back to browser speech synthesis', e);
      if (isCancelledRef.current) return;
      fallbackBrowserSpeak(cleanText, speechLang);
    });
  }, [fallbackBrowserSpeak, stopSpeaking]);

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
