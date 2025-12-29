/**
 * Feature Flags for SpeakSharp Mobile
 *
 * These flags control experimental or in-development features.
 * Set to false to disable features in production.
 */

export const FEATURES = {
  /**
   * Ultra-low-latency real-time voice AI using OpenAI Realtime API.
   * When DISABLED: All exercises use record → upload → analyze flow.
   * When ENABLED: Role-play uses WebSocket streaming for real-time conversations.
   *
   * TEMPORARILY DISABLED for testability - forces consistent record-upload-analyze.
   */
  REALTIME_VOICE_AI: false,
};
