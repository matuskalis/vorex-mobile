/**
 * Pronunciation Drill Phrases
 * Common English phrases with challenging pronunciations
 */

export type PronunciationPhrase = {
  id: string;
  text: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focus: string; // What pronunciation aspect this targets (e.g., "th sound", "r vs l")
  phonetic?: string; // IPA transcription (optional for now)
};

export const PRONUNCIATION_PHRASES: PronunciationPhrase[] = [
  {
    id: 'phrase_1',
    text: 'The weather is getting better.',
    difficulty: 'beginner',
    focus: 'th sound & consonant clusters',
    phonetic: 'ðə ˈwɛðər ɪz ˈɡɛtɪŋ ˈbɛtər',
  },
  {
    id: 'phrase_2',
    text: 'She sells seashells by the seashore.',
    difficulty: 'intermediate',
    focus: 's and sh sounds',
    phonetic: 'ʃi sɛlz ˈsiˌʃɛlz baɪ ðə ˈsiˌʃɔr',
  },
  {
    id: 'phrase_3',
    text: 'I thought I saw a three-headed cat.',
    difficulty: 'intermediate',
    focus: 'th sound & voiced consonants',
    phonetic: 'aɪ θɔt aɪ sɔ ə θri-ˈhɛdɪd kæt',
  },
  {
    id: 'phrase_4',
    text: 'Red lorry, yellow lorry.',
    difficulty: 'advanced',
    focus: 'r and l distinction',
    phonetic: 'rɛd ˈlɔri, ˈjɛloʊ ˈlɔri',
  },
  {
    id: 'phrase_5',
    text: 'How now brown cow.',
    difficulty: 'beginner',
    focus: 'ow diphthong',
    phonetic: 'haʊ naʊ braʊn kaʊ',
  },
  {
    id: 'phrase_6',
    text: 'A proper copper coffee pot.',
    difficulty: 'advanced',
    focus: 'p sound & consonant clusters',
    phonetic: 'ə ˈprɑpər ˈkɑpər ˈkɔfi pɑt',
  },
  {
    id: 'phrase_7',
    text: 'Can you hand me the scissors?',
    difficulty: 'beginner',
    focus: 'common phrase & s sounds',
    phonetic: 'kæn ju hænd mi ðə ˈsɪzərz',
  },
  {
    id: 'phrase_8',
    text: 'The sixth sick sheikh\'s sixth sheep\'s sick.',
    difficulty: 'advanced',
    focus: 's, th, and sh sounds',
    phonetic: 'ðə sɪksθ sɪk ʃiks sɪksθ ʃips sɪk',
  },
  {
    id: 'phrase_9',
    text: 'Peter Piper picked a peck of pickled peppers.',
    difficulty: 'intermediate',
    focus: 'p sound & alliteration',
    phonetic: 'ˈpitər ˈpaɪpər pɪkt ə pɛk əv ˈpɪkəld ˈpɛpərz',
  },
  {
    id: 'phrase_10',
    text: 'I scream, you scream, we all scream for ice cream.',
    difficulty: 'intermediate',
    focus: 'consonant clusters & rhythm',
    phonetic: 'aɪ skrim, ju skrim, wi ɔl skrim fɔr aɪs krim',
  },
];

/**
 * Get phrases filtered by difficulty
 */
export function getPhrasesByDifficulty(difficulty: PronunciationPhrase['difficulty']) {
  return PRONUNCIATION_PHRASES.filter(phrase => phrase.difficulty === difficulty);
}

/**
 * Get a random subset of phrases
 */
export function getRandomPhrases(count: number): PronunciationPhrase[] {
  const shuffled = [...PRONUNCIATION_PHRASES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
