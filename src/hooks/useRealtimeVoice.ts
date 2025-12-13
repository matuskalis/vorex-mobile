import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

const API_BASE_URL = 'https://speaksharp-core-production.up.railway.app';
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type RealtimeEvent = {
  type: string;
  [key: string]: any;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

interface LatencyMetrics {
  speechEndToFirstAudio: number; // ms from speech end to first audio chunk
  totalRoundTrip: number; // ms from audio send to first audio received
}

interface UseRealtimeVoiceOptions {
  onMessage?: (message: Message) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (state: ConnectionState) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onLatency?: (metrics: LatencyMetrics) => void;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  // Latency tracking refs
  const speechEndTimeRef = useRef<number | null>(null);
  const audioSendTimeRef = useRef<number | null>(null);
  const firstAudioReceivedRef = useRef(false);
  const [lastLatency, setLastLatency] = useState<LatencyMetrics | null>(null);

  // Update connection state and notify
  const updateConnectionState = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    options.onConnectionChange?.(state);
  }, [options]);

  // Get ephemeral token from backend
  const getRealtimeToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/realtime-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Token request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.client_secret;
    } catch (error) {
      console.error('Failed to get realtime token:', error);
      options.onError?.(error instanceof Error ? error.message : 'Failed to get token');
      return null;
    }
  };

  // Play queued audio
  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    options.onSpeechStart?.();

    try {
      const base64Audio = audioQueueRef.current.shift();
      if (!base64Audio) {
        isPlayingRef.current = false;
        setIsSpeaking(false);
        return;
      }

      // Write base64 audio to temp file
      const filename = `realtime_audio_${Date.now()}.wav`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      // Create WAV header for PCM16 24kHz mono (OpenAI Realtime outputs 24kHz)
      const wavHeader = createWavHeader(base64Audio.length);
      const fullAudio = wavHeader + base64Audio;

      await FileSystem.writeAsStringAsync(fileUri, fullAudio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Unload previous sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          isPlayingRef.current = false;
          options.onSpeechEnd?.();
          // Play next in queue
          playNextAudio();
        }
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      playNextAudio(); // Try next in queue
    }
  }, [options]);

  // Create WAV header for PCM16 audio
  const createWavHeader = (dataLength: number): string => {
    // Calculate actual byte length from base64
    const byteLength = Math.floor((dataLength * 3) / 4);
    const sampleRate = 24000; // OpenAI Realtime uses 24kHz
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + byteLength, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, byteLength, true);

    // Convert to base64
    const headerBytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < headerBytes.length; i++) {
      binary += String.fromCharCode(headerBytes[i]);
    }
    return btoa(binary);
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: RealtimeEvent = JSON.parse(event.data);

      switch (data.type) {
        case 'session.created':
          sessionIdRef.current = data.session?.id;
          console.log('Realtime session created:', data.session?.id);
          break;

        case 'session.updated':
          console.log('Session updated');
          break;

        case 'input_audio_buffer.speech_started':
          console.log('User started speaking');
          setIsListening(true);
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('User stopped speaking');
          setIsListening(false);
          // Record speech end time for latency measurement
          speechEndTimeRef.current = Date.now();
          firstAudioReceivedRef.current = false;
          break;

        case 'input_audio_buffer.committed':
          console.log('Audio buffer committed');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          // User's transcribed speech
          const userText = data.transcript;
          if (userText) {
            setCurrentTranscript(userText);
            options.onTranscript?.(userText, true);

            const userMessage: Message = {
              id: data.item_id || `user-${Date.now()}`,
              role: 'user',
              text: userText,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMessage]);
            options.onMessage?.(userMessage);
          }
          break;

        case 'response.audio_transcript.delta':
          // Streaming AI transcript
          if (data.delta) {
            options.onTranscript?.(data.delta, false);
          }
          break;

        case 'response.audio_transcript.done':
          // Complete AI transcript
          const assistantText = data.transcript;
          if (assistantText) {
            const assistantMessage: Message = {
              id: data.item_id || `assistant-${Date.now()}`,
              role: 'assistant',
              text: assistantText,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            options.onMessage?.(assistantMessage);
          }
          break;

        case 'response.audio.delta':
          // Streaming audio from AI
          if (data.delta) {
            // Calculate latency on first audio chunk
            if (!firstAudioReceivedRef.current) {
              firstAudioReceivedRef.current = true;
              const now = Date.now();
              const metrics: LatencyMetrics = {
                speechEndToFirstAudio: speechEndTimeRef.current ? now - speechEndTimeRef.current : 0,
                totalRoundTrip: audioSendTimeRef.current ? now - audioSendTimeRef.current : 0,
              };
              setLastLatency(metrics);
              options.onLatency?.(metrics);
              console.log(`[Latency] Speech→Audio: ${metrics.speechEndToFirstAudio}ms, Total: ${metrics.totalRoundTrip}ms`);
            }
            audioQueueRef.current.push(data.delta);
            playNextAudio();
          }
          break;

        case 'response.audio.done':
          console.log('AI audio complete');
          if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
            setIsSpeaking(false);
          }
          break;

        case 'response.done':
          console.log('Response complete');
          break;

        case 'error':
          console.error('Realtime API error:', data.error);
          options.onError?.(data.error?.message || 'Realtime API error');
          break;

        default:
          // Log unhandled events for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('Unhandled event:', data.type);
          }
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }, [options, playNextAudio]);

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    updateConnectionState('connecting');

    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission required');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Get ephemeral token
      const clientSecret = await getRealtimeToken();
      if (!clientSecret) {
        throw new Error('Failed to get realtime token');
      }

      // Connect to WebSocket with token
      // Note: React Native WebSocket doesn't support custom headers directly
      // We pass the token via URL query param (supported by OpenAI Realtime API)
      const ws = new WebSocket(
        `${OPENAI_REALTIME_URL}?model=gpt-4o-realtime-preview-2024-12-17`,
        ['realtime', `openai-insecure-api-key.${clientSecret}`, 'openai-beta.realtime-v1']
      );

      ws.onopen = () => {
        console.log('WebSocket connected');
        updateConnectionState('connected');
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionState('error');
        options.onError?.('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        updateConnectionState('disconnected');
        wsRef.current = null;
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Connection failed:', error);
      updateConnectionState('error');
      options.onError?.(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [handleMessage, options, updateConnectionState]);

  // Disconnect from WebSocket
  const disconnect = useCallback(async () => {
    // Stop recording
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // Ignore
      }
      recordingRef.current = null;
    }

    // Stop audio playback
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        // Ignore
      }
      soundRef.current = null;
    }

    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsListening(false);
    setIsSpeaking(false);
    updateConnectionState('disconnected');
  }, [updateConnectionState]);

  // Start recording and streaming audio
  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      // Create recording with PCM16 settings
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      recordingRef.current = recording;
      setIsListening(true);

      // Note: For true streaming, we'd need to read audio chunks periodically
      // Since expo-av doesn't support real streaming, we use the server VAD
      // The server will detect speech end and process the full buffer
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      options.onError?.('Failed to start recording');
    }
  }, [options]);

  // Stop recording and send audio buffer
  const stopListening = useCallback(async () => {
    if (!recordingRef.current) {
      return;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsListening(false);

      if (!uri || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      // Read audio file and convert to base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Reset latency tracking for this turn
      firstAudioReceivedRef.current = false;
      speechEndTimeRef.current = Date.now();
      audioSendTimeRef.current = Date.now();

      // Send audio to WebSocket
      // First, append audio to buffer
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      }));

      // Then commit the buffer to trigger processing
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit',
      }));

      // Request a response
      wsRef.current.send(JSON.stringify({
        type: 'response.create',
      }));

      console.log('Audio sent to realtime API');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      options.onError?.('Failed to process recording');
    }
  }, [options]);

  // Send text message directly
  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // Add text message to conversation
    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    }));

    // Request response
    wsRef.current.send(JSON.stringify({
      type: 'response.create',
    }));

    // Add to local messages
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    options.onMessage?.(userMessage);
  }, [options]);

  // Interrupt current AI response
  const interrupt = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'response.cancel',
    }));

    // Clear audio queue and stop playback
    audioQueueRef.current = [];
    if (soundRef.current) {
      soundRef.current.stopAsync();
    }
    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    connectionState,
    isListening,
    isSpeaking,
    messages,
    currentTranscript,
    lastLatency,

    // Actions
    connect,
    disconnect,
    startListening,
    stopListening,
    sendMessage,
    interrupt,
  };
}
