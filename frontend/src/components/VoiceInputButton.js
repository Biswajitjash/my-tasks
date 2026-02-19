import { useState, useRef, useCallback } from 'react';

/**
 * VoiceInputButton
 * Props:
 *   fieldName   - the form field name this mic targets (for handleChange simulation)
 *   onTranscript - (text) => void  — called with final transcript (appends or replaces)
 *   mode        - 'append' | 'replace'  (default: 'append')
 *   disabled    - optional boolean
 */
const VoiceInputButton = ({ fieldName, onTranscript, mode = 'append', disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognitionRef = useRef(null);
  const [pulse, setPulse] = useState(false);

  const startListening = useCallback(() => {
    if (!isSupported || disabled) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setPulse(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript, mode);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      setPulse(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setPulse(false);
    };

    recognition.start();
  }, [isSupported, disabled, onTranscript, mode]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      title={isListening ? 'Stop listening' : `Speak to fill ${fieldName}`}
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      style={{
        background: isListening
          ? 'linear-gradient(135deg, #ff6b6b, #ff4444)'
          : 'linear-gradient(135deg, rgba(88,166,255,0.15), rgba(188,140,255,0.15))',
        border: `1px solid ${isListening ? '#ff6b6b' : 'rgba(88,166,255,0.4)'}`,
        borderRadius: '8px',
        padding: '0.35rem 0.55rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: isListening ? '0 0 12px rgba(255,107,107,0.5)' : 'none',
        animation: pulse && isListening ? 'micPulse 1s infinite' : 'none',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isListening ? '#fff' : '#58a6ff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </button>
  );
};

export default VoiceInputButton;
