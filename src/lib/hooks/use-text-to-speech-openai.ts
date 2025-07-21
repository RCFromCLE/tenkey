import { useState, useCallback, useRef } from 'react';

export interface OpenAITTSOptions {
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer';
  model?: 'gpt-4o-mini-tts' | 'tts-1' | 'tts-1-hd';
  instructions?: string;
}

export const useTextToSpeechOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const speak = useCallback(async (text: string, options: OpenAITTSOptions = {}, speed: number = 1.0) => {
    if (!text.trim()) {
      setError('Text is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentCharIndex(0);
    setTotalChars(text.length);

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (textIntervalRef.current) {
        clearInterval(textIntervalRef.current);
        textIntervalRef.current = null;
      }

      const response = await fetch('/api/tts/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: options.voice || 'alloy',
          model: options.model || 'gpt-4o-mini-tts',
          instructions: options.instructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to generate speech');
      }

      // Create audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set playback rate
      audio.playbackRate = speed;
      setPlaybackRate(speed);

      audio.onloadstart = () => setIsPlaying(true);
      
      audio.onplay = () => {
        // Start text synchronization - simple approach
        const duration = audio.duration || (text.length * 0.1); // Fallback: 100ms per char
        const charsPerSecond = text.length / duration;
        const intervalMs = 1000 / charsPerSecond;
        
        let charIndex = 0;
        textIntervalRef.current = setInterval(() => {
          charIndex++;
          setCurrentCharIndex(charIndex);
          
          if (charIndex >= text.length) {
            if (textIntervalRef.current) {
              clearInterval(textIntervalRef.current);
              textIntervalRef.current = null;
            }
          }
        }, Math.max(intervalMs, 50)); // Minimum 50ms per character
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentCharIndex(text.length);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        if (textIntervalRef.current) {
          clearInterval(textIntervalRef.current);
          textIntervalRef.current = null;
        }
      };
      
      audio.onerror = (e) => {
        console.warn('Audio playback error (non-critical):', e);
        setIsPlaying(false);
        setCurrentCharIndex(text.length);
        // Don't set error for user-initiated aborts
        const event = e as Event;
        if (event.type !== 'abort') {
          setError('Failed to play audio');
        }
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        if (textIntervalRef.current) {
          clearInterval(textIntervalRef.current);
          textIntervalRef.current = null;
        }
      };

      await audio.play();
    } catch (err: any) {
      console.error('OpenAI TTS Error:', err);
      setError(err.message || 'Failed to generate speech');
      setIsPlaying(false);
      setCurrentCharIndex(text.length);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
    if (textIntervalRef.current) {
      clearInterval(textIntervalRef.current);
      textIntervalRef.current = null;
    }
    setCurrentCharIndex(totalChars);
  }, [totalChars]);

  const isSupported = true; // OpenAI TTS is always supported via API

  return {
    speak,
    stop,
    isLoading,
    isPlaying,
    error,
    isSupported,
    playbackRate,
    setPlaybackRate,
    currentCharIndex,
    totalChars,
  };
};
