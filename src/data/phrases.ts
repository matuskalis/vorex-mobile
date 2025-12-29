/**
 * Practice Phrases for Self-Assessment Flow
 * General and Business mode content
 */

export interface Phrase {
  id: string;
  text: string;
  category: 'general' | 'business';
  subcategory: string;
  difficulty: 1 | 2 | 3;
}

export const PRACTICE_PHRASES: Phrase[] = [
  // ========== GENERAL PHRASES ==========

  // Greetings & Small Talk
  {
    id: 'gen_greet_1',
    text: "Hi, how are you doing today?",
    category: 'general',
    subcategory: 'greetings',
    difficulty: 1,
  },
  {
    id: 'gen_greet_2',
    text: "Nice to meet you, I'm looking forward to working together.",
    category: 'general',
    subcategory: 'greetings',
    difficulty: 2,
  },
  {
    id: 'gen_greet_3',
    text: "It was great talking to you, let's stay in touch.",
    category: 'general',
    subcategory: 'greetings',
    difficulty: 2,
  },

  // Ordering Food & Drinks
  {
    id: 'gen_order_1',
    text: "I'd like a coffee with oat milk, please.",
    category: 'general',
    subcategory: 'ordering',
    difficulty: 1,
  },
  {
    id: 'gen_order_2',
    text: "Could I have the check when you get a chance?",
    category: 'general',
    subcategory: 'ordering',
    difficulty: 2,
  },
  {
    id: 'gen_order_3',
    text: "Is there anything you would recommend?",
    category: 'general',
    subcategory: 'ordering',
    difficulty: 1,
  },

  // Asking for Directions
  {
    id: 'gen_dir_1',
    text: "Excuse me, could you tell me how to get to the train station?",
    category: 'general',
    subcategory: 'directions',
    difficulty: 2,
  },
  {
    id: 'gen_dir_2',
    text: "Is there a pharmacy nearby?",
    category: 'general',
    subcategory: 'directions',
    difficulty: 1,
  },
  {
    id: 'gen_dir_3',
    text: "How long does it take to walk there?",
    category: 'general',
    subcategory: 'directions',
    difficulty: 1,
  },

  // Making Appointments
  {
    id: 'gen_appt_1',
    text: "I'd like to schedule an appointment for next week.",
    category: 'general',
    subcategory: 'appointments',
    difficulty: 2,
  },
  {
    id: 'gen_appt_2',
    text: "Would Thursday afternoon work for you?",
    category: 'general',
    subcategory: 'appointments',
    difficulty: 2,
  },
  {
    id: 'gen_appt_3',
    text: "I need to reschedule our meeting, something came up.",
    category: 'general',
    subcategory: 'appointments',
    difficulty: 2,
  },

  // Shopping
  {
    id: 'gen_shop_1',
    text: "Do you have this in a different size?",
    category: 'general',
    subcategory: 'shopping',
    difficulty: 1,
  },
  {
    id: 'gen_shop_2',
    text: "I'm just looking, thank you.",
    category: 'general',
    subcategory: 'shopping',
    difficulty: 1,
  },
  {
    id: 'gen_shop_3',
    text: "Can I try this on? Where are the fitting rooms?",
    category: 'general',
    subcategory: 'shopping',
    difficulty: 2,
  },

  // Phone Calls
  {
    id: 'gen_phone_1',
    text: "Hello, this is speaking. How can I help you?",
    category: 'general',
    subcategory: 'phone',
    difficulty: 1,
  },
  {
    id: 'gen_phone_2',
    text: "Could you please hold for a moment?",
    category: 'general',
    subcategory: 'phone',
    difficulty: 1,
  },

  // Travel
  {
    id: 'gen_travel_1',
    text: "What time does the next train depart?",
    category: 'general',
    subcategory: 'travel',
    difficulty: 1,
  },
  {
    id: 'gen_travel_2',
    text: "I'd like to book a room for two nights, please.",
    category: 'general',
    subcategory: 'travel',
    difficulty: 2,
  },
  {
    id: 'gen_travel_3',
    text: "Is breakfast included in the price?",
    category: 'general',
    subcategory: 'travel',
    difficulty: 2,
  },

  // ========== BUSINESS PHRASES ==========

  // Cold Calling
  {
    id: 'biz_cold_1',
    text: "Hi, this is calling from. Do you have a moment to talk?",
    category: 'business',
    subcategory: 'cold_calling',
    difficulty: 2,
  },
  {
    id: 'biz_cold_2',
    text: "I'm reaching out because I noticed your company is growing rapidly.",
    category: 'business',
    subcategory: 'cold_calling',
    difficulty: 3,
  },
  {
    id: 'biz_cold_3',
    text: "Would you be open to a quick fifteen-minute call this week?",
    category: 'business',
    subcategory: 'cold_calling',
    difficulty: 2,
  },

  // Objection Handling
  {
    id: 'biz_obj_1',
    text: "I completely understand your concern. Let me address that.",
    category: 'business',
    subcategory: 'objection_handling',
    difficulty: 2,
  },
  {
    id: 'biz_obj_2',
    text: "That's a great point. Many of our clients felt the same way initially.",
    category: 'business',
    subcategory: 'objection_handling',
    difficulty: 3,
  },
  {
    id: 'biz_obj_3',
    text: "What would need to change for this to make sense for you?",
    category: 'business',
    subcategory: 'objection_handling',
    difficulty: 3,
  },

  // Scheduling Meetings
  {
    id: 'biz_sched_1',
    text: "I'd like to schedule a follow-up call to discuss next steps.",
    category: 'business',
    subcategory: 'scheduling',
    difficulty: 2,
  },
  {
    id: 'biz_sched_2',
    text: "Does Tuesday at two work for you? I'll send a calendar invite.",
    category: 'business',
    subcategory: 'scheduling',
    difficulty: 2,
  },
  {
    id: 'biz_sched_3',
    text: "Let me check my schedule and get back to you today.",
    category: 'business',
    subcategory: 'scheduling',
    difficulty: 2,
  },

  // Closing
  {
    id: 'biz_close_1',
    text: "Based on what we've discussed, I think this would be a great fit.",
    category: 'business',
    subcategory: 'closing',
    difficulty: 3,
  },
  {
    id: 'biz_close_2',
    text: "What would be the next step to move forward?",
    category: 'business',
    subcategory: 'closing',
    difficulty: 2,
  },
  {
    id: 'biz_close_3',
    text: "I'll send over the proposal by end of day. When can we reconnect?",
    category: 'business',
    subcategory: 'closing',
    difficulty: 3,
  },

  // Presentations
  {
    id: 'biz_pres_1',
    text: "Thank you for joining today. Let me share my screen.",
    category: 'business',
    subcategory: 'presentations',
    difficulty: 2,
  },
  {
    id: 'biz_pres_2',
    text: "As you can see from this chart, the results speak for themselves.",
    category: 'business',
    subcategory: 'presentations',
    difficulty: 3,
  },
  {
    id: 'biz_pres_3',
    text: "Are there any questions before I move to the next slide?",
    category: 'business',
    subcategory: 'presentations',
    difficulty: 2,
  },
];

/**
 * Get phrases filtered by mode
 */
export function getPhrasesByMode(mode: 'general' | 'business'): Phrase[] {
  return PRACTICE_PHRASES.filter(p => p.category === mode);
}

/**
 * Get phrases by subcategory
 */
export function getPhrasesBySubcategory(subcategory: string): Phrase[] {
  return PRACTICE_PHRASES.filter(p => p.subcategory === subcategory);
}

/**
 * Get a random set of phrases for practice
 */
export function getRandomPhrases(mode: 'general' | 'business', count: number = 5): Phrase[] {
  const filtered = getPhrasesByMode(mode);
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get subcategories for a mode
 */
export function getSubcategories(mode: 'general' | 'business'): string[] {
  const phrases = getPhrasesByMode(mode);
  return [...new Set(phrases.map(p => p.subcategory))];
}
