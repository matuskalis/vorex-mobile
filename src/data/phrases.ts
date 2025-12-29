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

  // Emergency Situations
  {
    id: 'gen_emerg_1',
    text: "I need to see a doctor. Is there a hospital nearby?",
    category: 'general',
    subcategory: 'emergency',
    difficulty: 2,
  },
  {
    id: 'gen_emerg_2',
    text: "I've lost my wallet. Can you help me?",
    category: 'general',
    subcategory: 'emergency',
    difficulty: 2,
  },
  {
    id: 'gen_emerg_3',
    text: "Could you please call an ambulance?",
    category: 'general',
    subcategory: 'emergency',
    difficulty: 2,
  },

  // Hotel Check-in/out
  {
    id: 'gen_hotel_1',
    text: "I have a reservation under the name Smith.",
    category: 'general',
    subcategory: 'hotel',
    difficulty: 1,
  },
  {
    id: 'gen_hotel_2',
    text: "What time is checkout? Can I get a late checkout?",
    category: 'general',
    subcategory: 'hotel',
    difficulty: 2,
  },
  {
    id: 'gen_hotel_3',
    text: "Could you store my luggage until my flight?",
    category: 'general',
    subcategory: 'hotel',
    difficulty: 2,
  },

  // Social Invitations
  {
    id: 'gen_social_1',
    text: "Would you like to grab a coffee sometime?",
    category: 'general',
    subcategory: 'social',
    difficulty: 1,
  },
  {
    id: 'gen_social_2',
    text: "I'm having a small get-together this weekend. You should come!",
    category: 'general',
    subcategory: 'social',
    difficulty: 2,
  },
  {
    id: 'gen_social_3',
    text: "That sounds great! I'd love to join you.",
    category: 'general',
    subcategory: 'social',
    difficulty: 1,
  },

  // Weather Small Talk
  {
    id: 'gen_weather_1',
    text: "Beautiful day today, isn't it?",
    category: 'general',
    subcategory: 'weather',
    difficulty: 1,
  },
  {
    id: 'gen_weather_2',
    text: "I heard it's supposed to rain later this week.",
    category: 'general',
    subcategory: 'weather',
    difficulty: 2,
  },
  {
    id: 'gen_weather_3',
    text: "This weather is perfect for a walk in the park.",
    category: 'general',
    subcategory: 'weather',
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

  // Email Follow-ups
  {
    id: 'biz_email_1',
    text: "I'm following up on my previous email. Have you had a chance to review it?",
    category: 'business',
    subcategory: 'email_followup',
    difficulty: 2,
  },
  {
    id: 'biz_email_2',
    text: "Just wanted to circle back and see if you have any questions.",
    category: 'business',
    subcategory: 'email_followup',
    difficulty: 2,
  },
  {
    id: 'biz_email_3',
    text: "I'll send you a summary of our discussion via email.",
    category: 'business',
    subcategory: 'email_followup',
    difficulty: 2,
  },

  // Negotiation
  {
    id: 'biz_nego_1',
    text: "We're flexible on the pricing if you can commit to a longer term.",
    category: 'business',
    subcategory: 'negotiation',
    difficulty: 3,
  },
  {
    id: 'biz_nego_2',
    text: "What would it take to close this deal today?",
    category: 'business',
    subcategory: 'negotiation',
    difficulty: 3,
  },
  {
    id: 'biz_nego_3',
    text: "I understand your budget constraints. Let's find a solution that works.",
    category: 'business',
    subcategory: 'negotiation',
    difficulty: 3,
  },

  // Networking Events
  {
    id: 'biz_network_1',
    text: "Hi, I don't think we've met. I'm from. What brings you here?",
    category: 'business',
    subcategory: 'networking',
    difficulty: 2,
  },
  {
    id: 'biz_network_2',
    text: "It was great meeting you. Let's connect on LinkedIn.",
    category: 'business',
    subcategory: 'networking',
    difficulty: 2,
  },
  {
    id: 'biz_network_3',
    text: "I'd love to hear more about your work. Can I get your card?",
    category: 'business',
    subcategory: 'networking',
    difficulty: 2,
  },

  // Interview Questions
  {
    id: 'biz_interview_1',
    text: "Can you tell me about yourself and your background?",
    category: 'business',
    subcategory: 'interview',
    difficulty: 2,
  },
  {
    id: 'biz_interview_2',
    text: "What interests you about this position and our company?",
    category: 'business',
    subcategory: 'interview',
    difficulty: 2,
  },
  {
    id: 'biz_interview_3',
    text: "Where do you see yourself in five years?",
    category: 'business',
    subcategory: 'interview',
    difficulty: 2,
  },
  {
    id: 'biz_interview_4',
    text: "Do you have any questions for me about the role?",
    category: 'business',
    subcategory: 'interview',
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
