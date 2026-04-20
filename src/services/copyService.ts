import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";

export const frameworks = [
  {
    id: "justin-michael",
    name: "Justin Michael",
    description: "Hyper-personalized, sharp, tech-driven, pattern interrupt hooks.",
    prompt: "Use the Justin Michael style. Focus on hyper-personalization, sharp and tech-driven language. Use pattern interrupt hooks to grab attention immediately. The copy should be disruptive and visual-resonance focused."
  },
  {
    id: "matt-furey",
    name: "Matt Furey",
    description: "Bold, emotional, direct response, strong opinions.",
    prompt: "Use the Matt Furey style. Be bold, emotional, and use strong opinions. This is direct response copywriting. Start with a provocative story or question. Use short paragraphs and build intense emotional tension before the offer."
  },
  {
    id: "hormozi",
    name: "Alex Hormozi",
    description: "Clear value proposition, no fluff, offer clarity.",
    prompt: "Use the Alex Hormozi style. Focus on a crystal-clear value proposition with absolutely no fluff. Prioritize offer clarity and value stacking. Use simple, punchy language that makes the offer feel like a 'no-brainer'."
  },
  {
    id: "story-based",
    name: "Storytelling",
    description: "Narrative-driven, emotional build-up, relatable.",
    prompt: "Use a storytelling framework. It should be narrative-driven with a strong emotional build-up. Make it relatable to the audience's specific pain points. Use the 'Hero's Journey' or 'In Media Res' to hook them and lead to the solution."
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Short sentences, clean structure, straight to the point.",
    prompt: "Use a minimalist style. Use very short sentences and a clean, sparse structure. Get straight to the point immediately. No preamble. One problem, one solution, one CTA."
  }
];

export interface EmailRequest {
  goal: string;
  audience: string;
  framework: string;
  tone: string;
  context: string;
  funnelStage: string;
  emailType: string;
  isSequence?: boolean;
  sequenceFlow?: string;
  sequenceLength?: number;
  awarenessLevel?: 'Cold' | 'Warm' | 'Hot';
  customTemplate?: string;
  businessPrompt?: string;
}

export const sequenceFlows = [
  { id: "welcome", name: "Welcome → Value → Offer → Close", description: "Classic onboarding or intro sequence." },
  { id: "lead-magnet", name: "Lead Magnet → Education → Case Study → Pitch", description: "High-trust conversion sequence." },
  { id: "problem-solution", name: "Intro → Problem → Solution → CTA", description: "Direct problem-solving sequence." },
  { id: "custom", name: "Custom Flow", description: "Define your own logical progression." }
];

export const emailTypes = [
  { id: "cold", name: "Cold Email", instruction: "Personalized, short, curiosity-driven, CTA focused." },
  { id: "warm", name: "Warm Email", instruction: "Relationship-based, trust-driven, soft selling." },
  { id: "nurture", name: "Nurture Email", instruction: "Educational, story-based, value-driven." },
  { id: "promo", name: "Promotional Email", instruction: "Offer-focused, urgency, benefits." },
  { id: "newsletter", name: "Newsletter", instruction: "Informational, engaging, insight-driven." },
  { id: "transactional", name: "Transactional", instruction: "Clear, concise, informational." },
  { id: "retention", name: "Retention Email", instruction: "Loyalty-focused, appreciation-driven." },
  { id: "re-engagement", name: "Re-engagement Email", instruction: "Pattern interrupt, win-back strategy." }
];

export const toneInstructions: Record<string, string> = {
  "Professional": "Formal, structured, and authoritative. Use sophisticated vocabulary and maintain a respectful distance.",
  "Friendly": "Warm, conversational, and approachable. Use inclusive language and a helpful, welcoming vibe.",
  "Persuasive": "Benefit-driven and convincing. Focus heavily on the 'what's in it for them' and use strong psychological triggers.",
  "Urgent": "Time-sensitive and action-focused. Create a sense of scarcity or a ticking clock to drive immediate response.",
  "Casual": "Relaxed, simple, and human-like. Write like you're texting a colleague or a friend. No corporate jargon.",
  "Luxury": "Premium, polished, and high-value. Use elegant language that conveys exclusivity and prestige."
};

export async function generateEmail(request: EmailRequest) {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Please add it to your secrets.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const selectedFramework = frameworks.find(f => f.id === request.framework);
  const selectedType = emailTypes.find(t => t.id === request.emailType);
  const toneInstruction = toneInstructions[request.tone] || "";
  
  let systemInstruction = `You are an ELITE DIRECT-RESPONSE COPYWRITER and EMAIL STRATEGIST.
  Your mission is to write high-converting copy that sounds human, persuasive, and impossible to ignore.
  
  AUDIENCE ANALYSIS:
  - Target Audience: ${request.audience}
  - Awareness Level: ${request.awarenessLevel || 'Cold'}
  
  MESSAGING STRATEGY BASED ON AWARENESS:
  - Cold: Focus on problem awareness, building trust, and providing context. Don't be too pushy.
  - Warm: Focus on moderate explanation, building desire, and stronger persuasion.
  - Hot: Be direct, focus on the offer, and push for immediate conversion.
  
  INTERNAL PRE-WRITING ANALYSIS (Do this internally before writing):
  1. Analyze the Funnel Stage: ${request.funnelStage}
  2. Identify User Intent and Emotional Triggers needed for this audience.
  3. Predict Objections that may arise and handle them naturally in the copy.
  
  FRAMEWORK TO APPLY:
  ${selectedFramework?.name}: ${selectedFramework?.description}
  ${selectedFramework?.prompt || ""}
  
  GOAL: ${request.goal}
  TONE: ${request.tone}
  CONTEXT: ${request.context}
  `;

  if (request.customTemplate) {
    systemInstruction += `
    CUSTOM STRUCTURE/TEMPLATE TO FOLLOW:
    ${request.customTemplate}
    Optimize this structure for clarity and conversion while following its base logic.
    `;
  }

  if (request.isSequence) {
    systemInstruction += `
    You are generating a STRUCTURED EMAIL SEQUENCE of EXACTLY ${request.sequenceLength || 3} emails.
    Sequence Flow: ${request.sequenceFlow}
    
    Rules for the sequence:
    - Generate EXACTLY ${request.sequenceLength || 3} unique emails.
    - Each email must have a clear, distinct role in the flow.
    - Messaging must progress logically from one email to the next.
    - NO redundancy or repetition between emails.
    - Each step must move the reader closer to the final conversion goal.
    - Use the selected framework and tone consistently across the sequence.
    - Format each email clearly with 'Email [Number]: [Stage Name]', 'Subject Line:', and 'Email Body:'.`;
  } else {
    systemInstruction += `
    Email Type Strategy: ${selectedType?.instruction || ""}
    Format the output as:
    Email 1: [Stage Name]
    Subject Line:
    Email Body:
    `;
  }
  
  systemInstruction += `
  
  General Rules:
  - GOAL ALIGNMENT: Every word must support the primary goal: ${request.goal}.
  - CALL TO ACTION: Every email MUST include a clear, relevant CTA that guides the reader toward the desired action.
  - Write in a natural, conversational American tone.
  - Avoid spammy language or "marketing-speak".
  - Subject lines must be compelling and high-open rate.
  - Emails must be easy to scan with proper spacing.
  - No unnecessary fluff.
  - Output ONLY the email content in Markdown format.`;

  const prompt = `
  ${request.isSequence ? `Sequence Flow: ${request.sequenceFlow}` : `Email Type: ${selectedType?.name || request.emailType}`}
  Goal: ${request.goal}
  Target Audience: ${request.audience}
  Awareness Level: ${request.awarenessLevel}
  Funnel Stage: ${request.funnelStage}
  Tone: ${request.tone}
  Additional Context/Offer Details: ${request.context}
  ${request.customTemplate ? `Custom Template: ${request.customTemplate}` : ""}
  
  Please generate the ${request.isSequence ? "email sequence" : "email"} now.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Generation error:", error);
    throw error;
  }
}

export async function analyzeBusinessDetails(prompt: string) {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `You are an expert business analyst and marketing strategist. 
  Your task is to analyze a user's business description and extract/infer the most appropriate settings for an email marketing campaign.
  
  Return ONLY a JSON object with the following fields:
  - goal: A concise goal (e.g., "Book a demo", "Sell a $97 course", "Get newsletter signups")
  - audience: A specific target audience (e.g., "SaaS Founders", "Busy working moms")
  - funnelStage: One of: "Cold Outreach", "Lead Nurture", "Sales/Direct Offer", "Newsletter/Engagement", "Retention/Win-back", "Post-Purchase/Onboarding"
  - awarenessLevel: One of: "Cold", "Warm", "Hot"
  - tone: One of: "Professional", "Friendly", "Persuasive", "Urgent", "Casual", "Luxury"
  - emailType: One of: "cold", "warm", "nurture", "promo", "newsletter", "transactional", "retention", "re-engagement"
  - context: A summary of the business, offer, and key pain points mentioned.
  - framework: One of: "justin-michael", "matt-furey", "hormozi", "story-based", "minimalist"
  
  If the prompt is vague, make the best possible professional guess.
  Output ONLY the raw JSON. No markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this business detail: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis error:", error);
    throw error;
  }
}
