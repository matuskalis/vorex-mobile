import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RolePlayScenario } from '../data/rolePlayScenarios';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

interface ConversationSession {
  scenarioId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
  }>;
  startedAt: string;
  lastUpdated: string;
  durationSeconds: number;
}

const STORAGE_KEY_PREFIX = 'roleplay_session_';

export function useRolePlayMemory(scenarioId: string) {
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Load previous conversation history for this scenario
  useEffect(() => {
    loadConversationHistory();
  }, [scenarioId]);

  const loadConversationHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const storageKey = `${STORAGE_KEY_PREFIX}${scenarioId}`;
      const storedData = await AsyncStorage.getItem(storageKey);

      if (storedData) {
        const session: ConversationSession = JSON.parse(storedData);
        const messages = session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setConversationHistory(messages);
        setSessionStartTime(new Date(session.startedAt));
      } else {
        setSessionStartTime(new Date());
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      setSessionStartTime(new Date());
    } finally {
      setIsLoadingHistory(false);
    }
  }, [scenarioId]);

  const saveConversationHistory = useCallback(async (messages: Message[]) => {
    try {
      const session: ConversationSession = {
        scenarioId,
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
        startedAt: sessionStartTime?.toISOString() || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        durationSeconds: sessionStartTime
          ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
          : 0,
      };

      const storageKey = `${STORAGE_KEY_PREFIX}${scenarioId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }, [scenarioId, sessionStartTime]);

  const addMessage = useCallback((message: Message) => {
    const newMessages = [...conversationHistory, message];
    setConversationHistory(newMessages);
    saveConversationHistory(newMessages);
  }, [conversationHistory, saveConversationHistory]);

  const clearConversationHistory = useCallback(async () => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${scenarioId}`;
      await AsyncStorage.removeItem(storageKey);
      setConversationHistory([]);
      setSessionStartTime(new Date());
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
    }
  }, [scenarioId]);

  const getSessionDuration = useCallback(() => {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
  }, [sessionStartTime]);

  return {
    conversationHistory,
    isLoadingHistory,
    addMessage,
    clearConversationHistory,
    saveConversationHistory,
    getSessionDuration,
    sessionStartTime,
  };
}
