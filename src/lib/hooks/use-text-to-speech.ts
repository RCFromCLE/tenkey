import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export const useTextToSpeech = () => {
  const { data: session } = useSession();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasGoogleTTS, setHasGoogleTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueue = useRef<string[]>([]);
  const isPlayingQueue = useRef(false);

  useEffect(() => {
    // Check for browser Speech Synthesis API
    const browserTTSAvailable = 'speechSynthesis' in window;
    
    const checkGoogleTTS = async () => {
      if (!session) {
        setIsAvailable(browserTTSAvailable);
        return;
      }
      
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.hasGoogleCredentials) {
            setHasGoogleTTS(true);
            setIsAvailable(true);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking Google TTS availability:', error);
      }
      
      // Fallback to browser TTS
      setIsAvailable(browserTTSAvailable);
    };

    checkGoogleTTS();
  }, [session]);

  const splitText = (text: string): string[] => {
    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    for (const sentence of sentences) {
      if (new TextEncoder().encode(currentChunk + sentence).length > 4800) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    return chunks;
  };

  const playQueue = async (voice: string, speakingRate: number) => {
    if (audioQueue.current.length === 0) {
      isPlayingQueue.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingQueue.current = true;
    const text = audioQueue.current.shift();

    if (!text) {
      playQueue(voice, speakingRate);
      return;
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speakingRate }),
      });

      if (!response.ok) {
        console.warn('TTS API failed, falling back to browser TTS');
        // Fallback to browser TTS
        speakWithBrowserTTS(text, speakingRate);
        playQueue(voice, speakingRate); // Continue with next item
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = url;
      audioRef.current.play();
      audioRef.current.onended = () => {
        playQueue(voice, speakingRate);
      };
    } catch (error) {
      console.warn('TTS error, falling back to browser TTS:', error);
      // Fallback to browser TTS
      speakWithBrowserTTS(text, speakingRate);
      playQueue(voice, speakingRate); // Continue with next item
    }
  };

  const speakWithBrowserTTS = (text: string, speakingRate: number) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speakingRate;
    utterance.volume = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text: string, voice: string, speakingRate: number) => {
    if (isSpeaking) {
      cancel();
    }

    // Use Google TTS if available, otherwise fallback to browser TTS
    if (hasGoogleTTS && session) {
      setIsSpeaking(true);
      audioQueue.current = splitText(text);
      playQueue(voice, speakingRate);
    } else {
      // Use browser TTS as fallback
      speakWithBrowserTTS(text, speakingRate);
    }
  };

  const cancel = () => {
    // Cancel Google TTS
    audioQueue.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    isPlayingQueue.current = false;
    
    // Cancel browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  };

  return {
    isSpeaking,
    isAvailable,
    speak,
    cancel,
  };
};
