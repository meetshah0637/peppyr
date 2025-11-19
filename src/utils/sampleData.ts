/**
 * Sample template data for seeding the application
 * Provides 8 example templates across different categories
 */

import { Template, SampleTemplate } from '../types';

export const sampleTemplates: SampleTemplate[] = [
  {
    title: "Cold Outreach - Value Proposition",
    body: "Hi [Name],\n\nI hope this email finds you well. I noticed that [Company] has been growing rapidly, and I wanted to reach out because I believe there's an opportunity to help you scale even more effectively.\n\nI specialize in helping companies like yours optimize their sales processes and increase conversion rates by 25-40%. I've worked with similar companies in your industry and have seen remarkable results.\n\nWould you be open to a brief 15-minute call this week to discuss how we might be able to help [Company] achieve its growth goals?\n\nBest regards,\n[Your Name]",
    tags: ["intro", "cold-outreach", "value-proposition"],
    category: "Intro"
  },
  {
    title: "Follow-up - No Response",
    body: "Hi [Name],\n\nI wanted to follow up on my previous email about helping [Company] optimize its sales processes.\n\nI understand you're likely busy, but I believe the insights I could share about increasing conversion rates by 25-40% would be valuable for your team.\n\nIf now isn't the right time, I'd be happy to connect in a few months. Alternatively, if you'd prefer not to receive these emails, just let me know and I'll remove you from my list.\n\nThanks for your time,\n[Your Name]",
    tags: ["follow-up", "no-response", "respectful"],
    category: "Follow up 1"
  },
  {
    title: "Follow-up - Social Proof",
    body: "Hi [Name],\n\nI wanted to share a quick update since my last email. I just finished working with [Similar Company] and helped them increase their conversion rate by 35% in just 6 weeks.\n\nI thought you might be interested in the specific strategies we implemented, especially since [Company] seems to be in a similar growth phase.\n\nWould you be interested in a brief call to discuss how these same strategies might apply to your situation?\n\nBest,\n[Your Name]",
    tags: ["follow-up", "social-proof", "results"],
    category: "Follow up 2"
  },
  {
    title: "Meeting Request - Calendar Link",
    body: "Hi [Name],\n\nThanks for your interest in discussing how we can help [Company] optimize its sales processes.\n\nI've attached a calendar link below where you can book a time that works best for you:\n\n[Calendar Link]\n\nDuring our 15-minute call, I'll share:\n- 3 specific strategies that have helped similar companies increase conversion rates by 25-40%\n- A quick analysis of your current sales process\n- Next steps if you're interested in moving forward\n\nLooking forward to speaking with you!\n\nBest regards,\n[Your Name]",
    tags: ["meeting-request", "calendar", "agenda"],
    category: "Meeting Request"
  },
  {
    title: "LinkedIn Connection Request",
    body: "Hi [Name],\n\nI came across your profile and was impressed by your work at [Company]. I specialize in helping companies like yours optimize their sales processes and increase conversion rates.\n\nI'd love to connect and share some insights that might be valuable for your team's growth goals.\n\nBest regards,\n[Your Name]",
    tags: ["linkedin", "connection", "brief"],
    category: "Intro"
  },
  {
    title: "Referral Request",
    body: "Hi [Name],\n\nI hope you're doing well! I wanted to reach out because I'm looking to connect with other professionals in the [Industry] space who might benefit from sales optimization services.\n\nDo you know anyone who might be interested in learning about strategies that have helped companies increase their conversion rates by 25-40%?\n\nI'd be happy to return the favor if you ever need referrals for [Your Service/Product].\n\nThanks for considering!\n\nBest,\n[Your Name]",
    tags: ["referral", "networking", "reciprocal"],
    category: "Follow up 1"
  },
  {
    title: "Event Follow-up",
    body: "Hi [Name],\n\nIt was great meeting you at [Event Name] yesterday! I enjoyed our conversation about [Company]'s growth challenges.\n\nAs promised, I'm attaching the case study I mentioned about how we helped [Similar Company] increase their conversion rate by 35% in 6 weeks.\n\nI'd love to schedule a brief call to discuss how these strategies might apply to your situation. Are you available for a 15-minute call this week?\n\nLooking forward to continuing our conversation!\n\nBest regards,\n[Your Name]",
    tags: ["event-follow-up", "case-study", "personal"],
    category: "Follow up 2"
  },
  {
    title: "Demo Invitation",
    body: "Hi [Name],\n\nThanks for your interest in our sales optimization services. I'd love to show you exactly how we've helped companies like [Company] increase their conversion rates by 25-40%.\n\nI've scheduled a 30-minute demo for [Date/Time] where I'll walk you through:\n- Our proven methodology\n- Real case studies from similar companies\n- A customized strategy for your specific situation\n- Q&A session\n\nHere's the meeting link: [Meeting Link]\n\nPlease let me know if this time works for you, or if you'd prefer a different time.\n\nLooking forward to showing you the possibilities!\n\nBest regards,\n[Your Name]",
    tags: ["demo", "invitation", "detailed"],
    category: "Meeting Request"
  }
];

/**
 * Convert sample template data to Template objects
 */
export const createSampleTemplates = (): Template[] => {
  const now = new Date().toISOString();
  
  return sampleTemplates.map((sample, index) => ({
    id: `sample-${index + 1}`,
    title: sample.title,
    body: sample.body,
    tags: sample.tags,
    isFavorite: index < 3, // First 3 are favorites
    copyCount: Math.floor(Math.random() * 10), // Random copy count for demo
    lastUsed: index < 4 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
    createdAt: now,
    isArchived: false
  }));
};

