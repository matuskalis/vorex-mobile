/**
 * Sample vocabulary data for testing and demonstration
 * This can be used to populate the vocabulary system with example words
 */

export const sampleVocabularyWords = [
  {
    word: 'Serendipity',
    translation: 'The occurrence of events by chance in a happy or beneficial way',
    example: 'Finding that book was pure serendipity - it was exactly what I needed.',
    phonetic: '/ˌserənˈdɪpɪti/',
  },
  {
    word: 'Eloquent',
    translation: 'Fluent or persuasive in speaking or writing',
    example: 'She gave an eloquent speech that moved the entire audience.',
    phonetic: '/ˈeləkwənt/',
  },
  {
    word: 'Inevitable',
    translation: 'Certain to happen; unavoidable',
    example: 'Change is inevitable, so we must learn to adapt.',
    phonetic: '/ɪnˈevɪtəbl/',
  },
  {
    word: 'Perseverance',
    translation: 'Persistence in doing something despite difficulty or delay',
    example: 'Success requires hard work and perseverance.',
    phonetic: '/ˌpɜːrsəˈvɪrəns/',
  },
  {
    word: 'Benevolent',
    translation: 'Well-meaning and kindly',
    example: 'The benevolent king was loved by all his subjects.',
    phonetic: '/bəˈnevələnt/',
  },
  {
    word: 'Diligent',
    translation: 'Having or showing care and conscientiousness',
    example: 'She is a diligent student who always completes her homework.',
    phonetic: '/ˈdɪlɪdʒənt/',
  },
  {
    word: 'Ambiguous',
    translation: 'Open to more than one interpretation; unclear',
    example: 'The instructions were ambiguous and caused confusion.',
    phonetic: '/æmˈbɪɡjuəs/',
  },
  {
    word: 'Ephemeral',
    translation: 'Lasting for a very short time',
    example: 'Fame can be ephemeral, so enjoy it while it lasts.',
    phonetic: '/ɪˈfemərəl/',
  },
  {
    word: 'Resilient',
    translation: 'Able to withstand or recover quickly from difficult conditions',
    example: 'Children are remarkably resilient and adapt quickly to change.',
    phonetic: '/rɪˈzɪliənt/',
  },
  {
    word: 'Profound',
    translation: 'Very great or intense; having deep insight',
    example: 'His words had a profound impact on my life.',
    phonetic: '/prəˈfaʊnd/',
  },
];

/**
 * Function to add sample vocabulary to the context
 * Use this for testing and demonstration purposes
 */
export function addSampleVocabulary(
  addWord: (word: string, translation: string, example: string, phonetic: string) => void,
  count: number = 5
) {
  const wordsToAdd = sampleVocabularyWords.slice(0, Math.min(count, sampleVocabularyWords.length));

  wordsToAdd.forEach(({ word, translation, example, phonetic }) => {
    addWord(word, translation, example, phonetic);
  });

  return wordsToAdd.length;
}
