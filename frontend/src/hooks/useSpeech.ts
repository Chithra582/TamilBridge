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

  const speak = useCallback((text: string, speechLang = 'ta-IN') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Text-to-Speech not supported in this browser.');
      return;
    }

    // Cancel any previous utterance to avoid overlapping speech
    window.speechSynthesis.cancel();

    // Clean text for fluent, natural speech:
    // Strip markdown formatting, symbols, double-quotes, and emojis that cause choppy pauses
    const cleanText = text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*#_`~>]/g, '')
      .replace(/"/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = speechLang;

    // Select the best available fluent female voice
    const femaleVoice = getFemaleVoice(speechLang);
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      utterance.lang = femaleVoice.lang;
    }

    // Fluent & natural female cadence tuning:
    // pitch 1.15 produces a clear, friendly, feminine tone (like an encouraging tutor)
    // rate 0.95 gives a clear, unhurried, natural speaking pace
    utterance.pitch = 1.15;
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [getFemaleVoice]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    isSpeaking
  };
};
