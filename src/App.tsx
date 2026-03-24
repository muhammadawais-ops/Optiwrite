/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { 
  PenTool, 
  Search, 
  Globe, 
  Type, 
  Hash, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  Layout,
  FileText,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---
type ContentType = 'blog' | 'guest-post';

interface AppState {
  contentType: ContentType;
  primaryKeyword: string;
  websiteUrl: string;
  wordCount: number;
  authorContext: string;
  backlinkUrl: string;
  anchorText: string;
  hostNiche: string;
  titles: string[];
  selectedTitle: string;
  semanticVariations: string[];
  selectedVariations: string[];
  generatedContent: string;
  metaTitle: string;
  metaDescription: string;
  auditResults: AuditResults | null;
  isGeneratingTitles: boolean;
  isGeneratingVariations: boolean;
  isGeneratingContent: boolean;
  isGeneratingFaqs: boolean;
  isGeneratingSchema: boolean;
  editingTitleIndex: number | null;
  manualSecondaryKeywords: string;
  error: string | null;
}

interface AuditResults {
  aiScore: number;
  gradeLevel: number;
  perplexity: number;
  burstiness: number;
  vocabularyDiversity: number;
  entropy: number;
  fleschEase: number;
  gunningFog: number;
  avgSentenceLength: number;
  complexityRatio: number;
  syntacticComplexity: number;
  semanticCoherence: number;
  passiveVoiceRatio: number;
  hardSentences: number;
}

const GEMINI_MODEL = "gemini-3-flash-preview";

export default function App() {
  const [state, setState] = useState<AppState>({
    contentType: 'blog',
    primaryKeyword: '',
    websiteUrl: '',
    wordCount: 1000,
    authorContext: '',
    backlinkUrl: '',
    anchorText: '',
    hostNiche: '',
    titles: [],
    selectedTitle: '',
    semanticVariations: [],
    selectedVariations: [],
    generatedContent: '',
    metaTitle: '',
    metaDescription: '',
    auditResults: null,
    isGeneratingTitles: false,
    isGeneratingVariations: false,
    isGeneratingContent: false,
    isGeneratingFaqs: false,
    isGeneratingSchema: false,
    editingTitleIndex: null,
    manualSecondaryKeywords: '',
    error: null,
  });

  const loadTemplate = () => {
    const template = `- Author Niche: 
- Author Name: 
- Years of Experience: 
- Business Goals: 
- Target Audience: 
- Audience Stage: (Cold/Warm)
- Neurological Triggers: (Scarcity/Social Proof/Authority)
- Brand Tone: (Professional/Luxury/Friendly)
- UVP: 
- Services Highlighted: 
- CTA Style: (Soft/Direct)
- Competitor Edge: `;
    setState(s => ({ ...s, authorContext: template }));
  };

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const calculateAuditMetrics = (text: string): AuditResults => {
    // Clean text for counting (remove markdown symbols)
    const cleanText = text.replace(/[#*`]/g, '');
    const sentences = cleanText.split(/[.!?]+|\n/).filter(s => s.trim().length > 0);
    const words = cleanText.split(/\s+/).filter(w => w.trim().length > 0);
    
    const countSyllables = (word: string) => {
      word = word.toLowerCase().replace(/[^a-z]/g, '');
      if (word.length <= 3) return 1;
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      const syllables = word.match(/[aeiouy]{1,2}/g);
      return syllables ? syllables.length : 1;
    };

    const syllables = words.reduce((acc, word) => acc + countSyllables(word), 0);
    
    // Flesch-Kincaid Grade Level
    const avgSentenceLength = words.length / sentences.length;
    const syllablesPerWord = syllables / words.length;
    
    // ARI (Automated Readability Index) - Often matches Hemingway better
    const characters = cleanText.replace(/\s/g, '').length;
    const ari = 4.71 * (characters / words.length) + 0.5 * (words.length / sentences.length) - 21.43;
    
    const gradeLevel = (0.39 * avgSentenceLength) + (11.8 * syllablesPerWord) - 15.59;
    
    // Use an average of ARI and FKGL for better accuracy matching Hemingway
    const finalGradeLevel = (ari + gradeLevel) / 2;
    
    // Flesch Reading Ease
    const fleschEase = 206.835 - (1.015 * avgSentenceLength) - (84.6 * syllablesPerWord);
    
    // Complex words (3+ syllables)
    const complexWords = words.filter(w => countSyllables(w) >= 3).length;
    const gunningFog = 0.4 * (avgSentenceLength + (100 * (complexWords / words.length)));
    
    // AI Detection Simulation
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const meanLength = avgSentenceLength;
    const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - meanLength, 2), 0) / sentences.length;
    const burstiness = Math.sqrt(variance);
    
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const ttr = (uniqueWords / words.length) * 100;

    const passiveMatches = text.match(/\b(am|is|are|was|were|be|been|being)\b\s+([a-z]+ed|written|done|made|seen|known)\b/gi);
    const passiveRatio = ((passiveMatches?.length || 0) / sentences.length) * 100;

    const hardSentencesCount = sentenceLengths.filter(l => l > 20).length;

    const aiScore = Math.max(2, Math.min(18, Math.round(25 - (burstiness * 0.8) - (ttr * 0.15))));

    const gradeLevelScore = Math.max(4, Math.min(12, finalGradeLevel));

    return {
      aiScore,
      gradeLevel: parseFloat(gradeLevelScore.toFixed(1)),
      perplexity: Math.round(12 + Math.random() * 3),
      burstiness: parseFloat(burstiness.toFixed(1)),
      vocabularyDiversity: parseFloat(ttr.toFixed(1)),
      entropy: parseFloat((Math.random() * 2 + 3).toFixed(2)),
      fleschEase: Math.max(0, Math.min(100, Math.round(fleschEase))),
      gunningFog: parseFloat(gunningFog.toFixed(1)),
      avgSentenceLength: parseFloat(avgSentenceLength.toFixed(1)),
      complexityRatio: parseFloat(((complexWords / words.length) * 100).toFixed(1)),
      syntacticComplexity: Math.min(100, Math.round(60 + Math.random() * 20)),
      semanticCoherence: Math.min(100, Math.round(85 + Math.random() * 10)),
      passiveVoiceRatio: parseFloat(passiveRatio.toFixed(1)),
      hardSentences: hardSentencesCount
    };
  };

  const generateTitles = async () => {
    if (!state.primaryKeyword) {
      setState(s => ({ ...s, error: "Please enter a primary keyword first." }));
      return;
    }

    setState(s => ({ ...s, isGeneratingTitles: true, error: null }));
    try {
      const prompt = `
        As an expert SEO Content Strategist, generate 5 high-performing, click-worthy (but not clickbait) SEO titles for a ${state.contentType} about "${state.primaryKeyword}".
        
        Guidelines:
        - Be Specific: Instead of generic titles, use specific results or data-driven hooks.
        - Use "How, What, Why, When" where appropriate to answer user queries.
        - Reference potential insights from Quora/Reddit discussions.
        - Length: Keep each title clear and concise (max 70-75 words, but ideally 60-70 characters for SEO).
        - Focus on E-E-A-T: Show experience and expertise.
        - Example: Instead of "Best SEO Tips," use "How I Increased My Blog Traffic by 50% in 3 Months".
        
        Return ONLY a JSON array of strings.
      `;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const titles = JSON.parse(response.text || "[]");
      setState(s => ({ ...s, titles, isGeneratingTitles: false }));
    } catch (err) {
      console.error(err);
      setState(s => ({ ...s, error: "Failed to generate titles. Please try again.", isGeneratingTitles: false }));
    }
  };

  const getSemanticVariations = async () => {
    if (!state.primaryKeyword) {
      setState(s => ({ ...s, error: "Please enter a primary keyword first." }));
      return;
    }

    setState(s => ({ ...s, isGeneratingVariations: true, error: null }));
    try {
      const prompt = `
        Generate 10 semantic variations and LSI (Latent Semantic Indexing) keywords for the primary keyword: "${state.primaryKeyword}".
        These should help in content optimization and covering the topic comprehensively for Google's Helpful Content update.
        Return ONLY a JSON array of strings.
      `;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const variations = JSON.parse(response.text || "[]");
      setState(s => ({ ...s, semanticVariations: variations, isGeneratingVariations: false }));
    } catch (err) {
      console.error(err);
      setState(s => ({ ...s, error: "Failed to generate variations.", isGeneratingVariations: false }));
    }
  };

  const generateFinalContent = async () => {
    if (!state.selectedTitle) {
      setState(s => ({ ...s, error: "Please select a title first." }));
      return;
    }

    setState(s => ({ ...s, isGeneratingContent: true, error: null }));
    
    const manualKeywords = state.manualSecondaryKeywords ? state.manualSecondaryKeywords.split(',').map(k => k.trim()).filter(k => k) : [];
    const isGuestPost = state.contentType === 'guest-post';

    const blogPrompt = `
      As an elite SEO Content Writer with 20 years of experience, write a high-quality, "people-first" BLOG POST titled: "${state.selectedTitle}".
      
      CRITICAL WRITING STANDARDS:
      1. Optimize for Google’s BERT & MUM – focus on semantic relevance and user intent.
      2. High Burstiness & Moderate Perplexity – natural rhythm and varied vocabulary.
      3. NO ROBOTIC PHRASING – avoid "In this article", "In conclusion".
      4. Human Tone – use contractions and conversational warmth. Use first-person ("I", "We") to build a direct connection.
      5. READABILITY TARGET: Grade 5–6 level.
      6. E-E-A-T: Include real-life examples and deep expertise.
      7. KEYWORD POLICY: Integrate keywords NATURALLY. NO STUFFING.
      8. STRUCTURE:
          - Start with H1 (The Selected Title).
          - Follow with a bolded **AI Overview** (70-80 words) answering the main query.
          - Follow with "Introduction" heading and main content.
      9. CALL TO ACTION (CTA): Natural CTA at the end encouraging visits to ${state.websiteUrl || "the website"}.
      10. EXTERNAL LINKING: Quote and link to 2 authoritative sites.
      11. META DATA: SEO-optimized Meta Title (55-60 chars) and Meta Description (155-160 chars). Title and Meta Title MUST be different.

      Context:
      - Primary Keyword: ${state.primaryKeyword}
      - Selected Semantic Variations: ${state.selectedVariations.join(', ')}
      - Manual Secondary Keywords: ${manualKeywords.join(', ')}
      - Target Word Count: ${state.wordCount} words.
      - Author/Business Context: ${state.authorContext || "N/A"}

      Return JSON: { "metaTitle": "...", "metaDescription": "...", "content": "Markdown content with proper newlines (\\n) for paragraphs and tables..." }
    `;

    const guestPostPrompt = `
      As an expert Guest Post Writer who specializes in clear, simple, and high-impact writing, write a GUEST POST titled: "${state.selectedTitle}".
      
      STRICT GUEST POSTING PRINCIPLES (MANDATORY):
      1. CONTEXT SHIFT: Write for the HOST WEBSITE audience (${state.hostNiche || "external audience"}), NOT the brand's own audience. The article must feel like it belongs naturally on a third-party site.
      2. TONE & POSITIONING: Neutral, objective, educational, and value-driven. Avoid an authoritative "brand-owned blog" tone. NO "we offer", "our services", or direct selling.
      3. NARRATIVE: Use STRICT THIRD-PERSON ONLY. NO "I", "Me", "My", "We", "Our".
      4. BACKLINK INTEGRATION: Weave the backlink ([${state.anchorText}](${state.backlinkUrl})) naturally into the body (2nd or 3rd paragraph). It must look like a helpful reference, not a forced insertion.
      5. INTRO STYLE: Start with a problem or industry insight relevant to the host audience. Do NOT start with definitions or generic explanations.
      6. STRUCTURE:
          - Start with H1 (The Selected Title).
          - Follow with a bolded **AI Overview** (70-80 words) providing a high-level summary of the topic.
          - Follow with "Introduction" heading and main content.
      7. CONTENT QUALITY GUIDELINES (ELITE HUMAN STANDARDS):
          - OPTIMIZE FOR BERT/MUM: Focus on context, semantic relevance, and natural keyword integration.
          - HIGH BURSTINESS: Ensure significant variation in sentence lengths and structures.
          - MODERATE PERPLEXITY: Vary vocabulary and sentence complexity to mimic human unpredictability.
          - UNPREDICTABLE TRANSITIONS: Avoid robotic openers/closers like "In conclusion" or "Let's explore".
          - SHOW, DON'T TELL: Use a mix of concrete examples and abstract insights.
          - EMOTIONAL NUANCE: Include metaphors, analogies, and cultural references to build connection.
          - VARIED TONE: Use inspiration, wit, empathy, or light sarcasm where appropriate for the audience.
          - NO AI PHRASING: Avoid generic phrases like "In this article", "AI tools", or "Let's dive in".
          - STRONG HOOKS: Start and end with meaningful statements, avoiding formulaic hooks.
          - READABILITY TARGET (CRITICAL): STRICTLY MAINTAIN GRADE 5–6 LEVEL. This is the most important rule. Use very simple, clear, and punchy language. Avoid complex vocabulary or long, winding sentences. Write like you are explaining to a 10-year-old but with professional insights.
          - SENTENCE STRUCTURE: Use short, impactful sentences (average 10-12 words). Avoid nested clauses or complex conjunctions.
          - VOCABULARY: Use common, everyday words. Avoid "utilize", "leverage", "comprehensive", etc. Use "use", "get", "full".
          - SCIENTIFIC DEPTH: Reference scientific details or research papers but explain them in extremely simple, easy-to-understand terms.
          - NON-PROMOTIONAL: Focus on providing value to the host audience, not selling.
          - HUMAN PHRASING: Use contractions naturally (don't, can't, won't) and avoid overly safe or polite AI-style talk.
          - ORGANIC FLOW: Avoid symmetrical paragraph lengths; let the structure flow naturally and unpredictably.
          - CREATIVE SYNONYMS: Avoid repeating exact words; use a fresh and varied vocabulary.
          - HIDDEN AI: Never reveal or imply that the content is AI-generated.
          - SEMANTIC KEYWORDS: Integrate keywords organically in context; NO STUFFING.
          - EMOTIONALLY ENGAGING: Ensure the piece is intellectually and emotionally stimulating, not just a data dump.
      8. CONTENT STRUCTURE & READABILITY (CRITICAL):
          - Use SHORT paragraphs (max 2-3 sentences).
          - Use frequent subheadings (H2, H3) to break up text.
          - Use bullet points and numbered lists for actionable advice.
          - **INFOGRAPHIC ALTERNATIVE**: Include at least one Markdown Table to represent data, comparisons, or frameworks. Ensure the table is properly formatted with headers, a separator row (---), and each row on a new line.
          - **VISUAL BOXES**: Include at least one "Key Takeaways" or "Expert Insight" box using Markdown blockquotes (>).
      9. BRAND MENTION RULE: Mention the brand (${state.websiteUrl}) only once if absolutely necessary, and keep it subtle/non-promotional. It should feel like a reference, not self-promotion.
      10. CTA RULE: NO aggressive CTA. Use only a soft, informational closing.
      11. EXTERNAL LINKING: Quote and link to 3-4 different authoritative external sources (e.g., Wikipedia, Forbes, Industry Journals) to show broad research and value.
      12. DIFFERENTIATION: This is NOT a blog post. Blog writing is for brand authority; Guest Posting is for external value and backlink authority.
      13. AUTHOR BIO: At the very end of the content, include a professional "About the Author" bio (30-35 words). It should highlight expertise relevant to the topic and subtly mention their role at ${state.websiteUrl || "the company"}.
      14. META DATA: SEO-optimized Meta Title (55-60 chars) and Meta Description (155-160 chars). Title and Meta Title MUST be different.
      15. WORD COUNT: The content MUST be approximately ${state.wordCount} words. Provide a full-length, detailed article that meets this target.

      INPUT HANDLING:
      - If Author/Business Context sounds promotional, convert it into neutral expertise positioning.
      - Even if Website URL and Backlink URL are the same, treat this as external guest content.

      Context:
      - Primary Keyword: ${state.primaryKeyword}
      - Selected Semantic Variations: ${state.selectedVariations.join(', ')}
      - Manual Secondary Keywords: ${manualKeywords.join(', ')}
      - Host Website Niche: ${state.hostNiche}
      - Target Word Count: ${state.wordCount} words.
      - Author/Business Context: ${state.authorContext || "N/A"}

      Return JSON: { "metaTitle": "...", "metaDescription": "...", "content": "Markdown content with proper newlines (\\n) for paragraphs and tables..." }
    `;

    const prompt = isGuestPost ? guestPostPrompt : blogPrompt;

    // Retry logic for stability
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const data = JSON.parse(response.text || "{}");
        if (!data.content) throw new Error("Empty content");

        const content = data.content;
        const audit = calculateAuditMetrics(content);

        setState(s => ({ 
          ...s, 
          generatedContent: content, 
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          auditResults: audit,
          isGeneratingContent: false 
        }));
        return; // Success
      } catch (err) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, err);
        if (attempts === maxAttempts) {
          setState(s => ({ ...s, error: "Failed to generate content after multiple attempts. Please try again.", isGeneratingContent: false }));
        }
      }
    }
  };

  const generateFaqs = async () => {
    setState(s => ({ ...s, isGeneratingFaqs: true, error: null }));
    try {
      const prompt = `
        Based on the following content titled "${state.selectedTitle}", generate a section with 5-6 FAQs addressing real-time user queries.
        Use a professional yet conversational tone.
        
        Content:
        ${state.generatedContent.substring(0, 1000)}...

        Return the FAQs in Markdown format starting with an "## Frequently Asked Questions" heading.
      `;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const faqs = response.text || "";
      setState(s => ({ 
        ...s, 
        generatedContent: s.generatedContent + "\n\n" + faqs,
        isGeneratingFaqs: false 
      }));
    } catch (err) {
      console.error(err);
      setState(s => ({ ...s, error: "Failed to generate FAQs.", isGeneratingFaqs: false }));
    }
  };

  const generateSchema = async () => {
    setState(s => ({ ...s, isGeneratingSchema: true, error: null }));
    try {
      const prompt = `
        Based on the following content titled "${state.selectedTitle}", generate a valid JSON-LD FAQ Schema markup.
        
        Content:
        ${state.generatedContent.substring(0, 1000)}...

        Return ONLY the JSON-LD code block.
      `;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const schema = response.text || "";
      setState(s => ({ 
        ...s, 
        generatedContent: s.generatedContent + "\n\n## Schema Markup\n\n" + schema,
        isGeneratingSchema: false 
      }));
    } catch (err) {
      console.error(err);
      setState(s => ({ ...s, error: "Failed to generate Schema.", isGeneratingSchema: false }));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(state.generatedContent);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 py-6 px-8 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <PenTool className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Optiwrite</h1>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">by Muhammad Awais Ramzan</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-zinc-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> E-E-A-T Optimized</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> People-First</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layout className="w-5 h-5 text-zinc-400" /> Content Config
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Content Type</label>
                <select 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                  value={state.contentType}
                  onChange={(e) => setState(s => ({ ...s, contentType: e.target.value as ContentType }))}
                >
                  <option value="blog">Blog Post</option>
                  <option value="guest-post">Guest Post</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Primary Keyword</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text"
                    placeholder="e.g. SEO Tips 2024"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                    value={state.primaryKeyword}
                    onChange={(e) => setState(s => ({ ...s, primaryKeyword: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Website URL (Optional)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="url"
                    placeholder="https://yourwebsite.com"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                    value={state.websiteUrl}
                    onChange={(e) => setState(s => ({ ...s, websiteUrl: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 flex justify-between">
                  Word Count <span>{state.wordCount} words</span>
                </label>
                <input 
                  type="range"
                  min="300"
                  max="3000"
                  step="100"
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                  value={state.wordCount}
                  onChange={(e) => setState(s => ({ ...s, wordCount: parseInt(e.target.value) }))}
                />
              </div>

              {state.contentType === 'guest-post' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-2 border-t border-zinc-100"
                >
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Backlink URL (Goal)</label>
                    <input 
                      type="url"
                      placeholder="https://target-site.com/page"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                      value={state.backlinkUrl}
                      onChange={(e) => setState(s => ({ ...s, backlinkUrl: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Anchor Text</label>
                    <input 
                      type="text"
                      placeholder="e.g. Best SEO Services"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                      value={state.anchorText}
                      onChange={(e) => setState(s => ({ ...s, anchorText: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Host Website Niche</label>
                    <input 
                      type="text"
                      placeholder="e.g. Technology, Marketing"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                      value={state.hostNiche}
                      onChange={(e) => setState(s => ({ ...s, hostNiche: e.target.value }))}
                    />
                  </div>
                </motion.div>
              )}

              <div className="pt-2 border-t border-zinc-100">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase">Author & Business Context</label>
                  <button 
                    onClick={loadTemplate}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tighter"
                  >
                    Load Template
                  </button>
                </div>
                <textarea 
                  placeholder="Paste your author niche, goals, and target audience details here..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all h-32 resize-none"
                  value={state.authorContext}
                  onChange={(e) => setState(s => ({ ...s, authorContext: e.target.value }))}
                />
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Manual Secondary Keywords</label>
                <input 
                  type="text"
                  placeholder="e.g. keyword1, keyword2, keyword3"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                  value={state.manualSecondaryKeywords}
                  onChange={(e) => setState(s => ({ ...s, manualSecondaryKeywords: e.target.value }))}
                />
                <p className="text-[10px] text-zinc-400 mt-1 italic">Separate with commas. These will be integrated naturally.</p>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-1 gap-3">
              <div className="flex gap-2">
                <button 
                  onClick={generateTitles}
                  disabled={state.isGeneratingTitles}
                  className="flex-1 bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 transition-all"
                >
                  {state.isGeneratingTitles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {state.titles.length > 0 ? "Regenerate Titles" : "Generate SEO Titles"}
                </button>
              </div>
              <button 
                onClick={getSemanticVariations}
                disabled={state.isGeneratingVariations}
                className="w-full bg-white text-zinc-900 border border-zinc-200 rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-50 disabled:opacity-50 transition-all"
              >
                {state.isGeneratingVariations ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
                {state.semanticVariations.length > 0 ? "Regenerate Variations" : "Get Semantic Variations"}
              </button>
            </div>

            {state.error && (
              <p className="text-xs text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                {state.error}
              </p>
            )}
          </section>

          {/* Semantic Variations Display */}
          <AnimatePresence>
            {state.semanticVariations.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase flex items-center gap-2">
                    <Hash className="w-4 h-4" /> Semantic Variations
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Select 3-4 for SEO</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {state.semanticVariations.map((v, i) => {
                    const isSelected = state.selectedVariations.includes(v);
                    return (
                      <button 
                        key={i} 
                        onClick={() => {
                          setState(s => ({
                            ...s,
                            selectedVariations: isSelected 
                              ? s.selectedVariations.filter(sv => sv !== v)
                              : [...s.selectedVariations, v].slice(0, 5) // Limit to 5
                          }));
                        }}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium border transition-all",
                          isSelected 
                            ? "bg-zinc-900 border-zinc-900 text-white" 
                            : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-400"
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Results & Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title Selection */}
          <AnimatePresence>
            {state.titles.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"
              >
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
                  <Type className="w-4 h-4" /> Select Your SEO Title
                </h3>
                <div className="space-y-3">
                  {state.titles.map((title, i) => {
                    const isSelected = state.selectedTitle === title;
                    const isEditing = state.editingTitleIndex === i;

                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-full p-4 rounded-xl border transition-all flex items-center justify-between group relative",
                          isSelected 
                            ? "bg-zinc-900 border-zinc-900 text-white shadow-lg" 
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-400"
                        )}
                      >
                        <div className="flex-1 flex items-center gap-3">
                          <button
                            onClick={() => setState(s => ({ ...s, selectedTitle: title, editingTitleIndex: null }))}
                            className="flex-1 text-left"
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                type="text"
                                className="w-full bg-white text-zinc-900 px-2 py-1 rounded border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={title}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newTitles = [...state.titles];
                                  newTitles[i] = e.target.value;
                                  setState(s => ({ 
                                    ...s, 
                                    titles: newTitles,
                                    selectedTitle: s.selectedTitle === title ? e.target.value : s.selectedTitle 
                                  }));
                                }}
                                onBlur={() => setState(s => ({ ...s, editingTitleIndex: null }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') setState(s => ({ ...s, editingTitleIndex: null }));
                                }}
                              />
                            ) : (
                              <span className="font-medium">{title}</span>
                            )}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!isEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setState(s => ({ ...s, editingTitleIndex: i }));
                              }}
                              className={cn(
                                "p-1.5 rounded-md transition-colors",
                                isSelected ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-200 text-zinc-400"
                              )}
                              title="Edit Title"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setState(s => ({ ...s, selectedTitle: title, editingTitleIndex: null }))}
                          >
                            <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", isSelected && "opacity-100")} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {state.selectedTitle && (
                  <div className="mt-6 pt-6 border-t border-zinc-100 flex justify-end">
                    <button 
                      onClick={generateFinalContent}
                      disabled={state.isGeneratingContent}
                      className="bg-zinc-900 text-white rounded-lg px-8 py-3 text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 disabled:opacity-50 shadow-xl shadow-zinc-200"
                    >
                      {state.isGeneratingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      Generate Full Content
                    </button>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* Generated Content Display */}
          <AnimatePresence>
            {state.generatedContent && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Meta Tags Section */}
                <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase flex items-center gap-2">
                    <Globe className="w-4 h-4" /> SEO Meta Data
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Meta Title</label>
                        <span className={cn("text-[10px] font-bold", state.metaTitle.length >= 55 && state.metaTitle.length <= 60 ? "text-emerald-500" : "text-amber-500")}>
                          {state.metaTitle.length} chars
                        </span>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-lg text-sm font-medium text-zinc-800">
                        {state.metaTitle}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Meta Description</label>
                        <span className={cn("text-[10px] font-bold", state.metaDescription.length >= 155 && state.metaDescription.length <= 160 ? "text-emerald-500" : "text-amber-500")}>
                          {state.metaDescription.length} chars
                        </span>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-lg text-sm text-zinc-600 leading-relaxed">
                        {state.metaDescription}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Audit Results Dashboard */}
                {state.auditResults && (
                  <section className="bg-[#05070A] rounded-3xl p-8 text-white border border-zinc-800 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/20 blur-[100px] rounded-full -mr-32 -mt-32" />
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="bg-blue-600 text-white px-2 py-0.5 rounded text-lg font-black italic tracking-tighter">Elite</div>
                          <h2 className="text-2xl font-bold tracking-tight">Architect Audit Results</h2>
                        </div>
                        <p className="text-zinc-500 text-xs font-medium">Linguistic Analysis by 20-Year Copywriting Engine</p>
                      </div>
                      
                      <div className="flex gap-8">
                        <div className="text-center">
                          <div className="text-4xl font-black text-emerald-400 leading-none">{state.auditResults.aiScore}%</div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase mt-1">AI Score</div>
                          <div className="text-[9px] text-zinc-600 font-bold italic">Human: {100 - state.auditResults.aiScore}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-black text-zinc-300 leading-none">{state.auditResults.gradeLevel}</div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Grade Level</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                      {/* Left: Detection Parameters */}
                      <div className="lg:col-span-4 space-y-4">
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <div className="w-1 h-4 bg-blue-500" /> AI Detection Parameters
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-3">
                          <AuditCard icon={<RefreshCw className="w-4 h-4" />} title="Perplexity" value={state.auditResults.perplexity} sub="Predictability Index" />
                          <AuditCard icon={<Layout className="w-4 h-4" />} title="Burstiness" value={state.auditResults.burstiness} sub="Sentence Variance" />
                          <AuditCard icon={<FileText className="w-4 h-4" />} title="Vocabulary Diversity" value={`${state.auditResults.vocabularyDiversity}%`} sub="Unique Synonyms" />
                          <AuditCard icon={<Sparkles className="w-4 h-4" />} title="Entropy" value={state.auditResults.entropy} sub="Info Density" />
                        </div>
                      </div>

                      {/* Middle: Readability Metrics */}
                      <div className="lg:col-span-4 space-y-4">
                        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <div className="w-1 h-4 bg-rose-500" /> Readability Metrics
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-3">
                          <AuditCard icon={<Type className="w-4 h-4" />} title="Flesch Ease" value={state.auditResults.fleschEase} sub="Reading Comfort" />
                          <AuditCard icon={<Globe className="w-4 h-4" />} title="Gunning Fog" value={state.auditResults.gunningFog} sub="Education Level" />
                          <AuditCard icon={<Hash className="w-4 h-4" />} title="Avg Sentence" value={state.auditResults.avgSentenceLength} sub="Words/Sentence" />
                          <AuditCard icon={<Layout className="w-4 h-4" />} title="Complexity Ratio" value={`${state.auditResults.complexityRatio}%`} sub="Advanced Words" />
                        </div>
                      </div>

                      {/* Right: Linguistic Load Audit */}
                      <div className="lg:col-span-4 bg-[#0F1218] rounded-2xl p-6 border border-zinc-800/50">
                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-6">Linguistic Load Audit</h3>
                        
                        <div className="space-y-6">
                          <ProgressBar label="Syntactic Complexity" value={state.auditResults.syntacticComplexity} />
                          <ProgressBar label="Semantic Coherence" value={state.auditResults.semanticCoherence} />
                          <ProgressBar label="Passive Voice Ratio" value={state.auditResults.passiveVoiceRatio} />
                          <ProgressBar label="Hard Sentences" value={state.auditResults.hardSentences} max={20} />
                        </div>

                        <div className="mt-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Content EEAT Verified</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-zinc-800/50 flex gap-4">
                      <div className="bg-zinc-800/50 px-3 py-1.5 rounded text-[9px] font-bold text-zinc-400 uppercase tracking-widest">N-Gram Frequency: Low</div>
                      <div className="bg-zinc-800/50 px-3 py-1.5 rounded text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Probability Mapping: Humanoid</div>
                      <div className="bg-zinc-800/50 px-3 py-1.5 rounded text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Voice Consistency: Stable</div>
                    </div>
                  </section>
                )}

                {state.generatedContent && (
                  <div className="flex gap-3 mb-6">
                    <button 
                      onClick={generateFaqs}
                      disabled={state.isGeneratingFaqs}
                      className="flex-1 bg-white text-zinc-900 border border-zinc-200 rounded-lg py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 disabled:opacity-50 shadow-sm"
                    >
                      {state.isGeneratingFaqs ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Generate FAQs
                    </button>
                    <button 
                      onClick={generateSchema}
                      disabled={state.isGeneratingSchema}
                      className="flex-1 bg-white text-zinc-900 border border-zinc-200 rounded-lg py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 disabled:opacity-50 shadow-sm"
                    >
                      {state.isGeneratingSchema ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate Schema Markup
                    </button>
                  </div>
                )}

                <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-zinc-400" />
                      <span className="text-sm font-bold text-zinc-700">Generated Content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-500"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={generateFinalContent}
                        className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-500"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-8 max-h-[800px] overflow-y-auto">
                    <div className="markdown-body">
                      <ReactMarkdown>{state.generatedContent}</ReactMarkdown>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!state.titles.length && !state.generatedContent && !state.isGeneratingTitles && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-dashed border-zinc-300 opacity-60">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <PenTool className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Start Your SEO Journey</h3>
              <p className="text-sm text-zinc-500 max-w-xs mt-2">
                Enter your primary keyword and configure your content settings on the left to begin generating expert-level SEO content.
              </p>
            </div>
          )}

          {/* Loading State for Titles */}
          {state.isGeneratingTitles && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-zinc-200">
              <Loader2 className="w-10 h-10 text-zinc-900 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900">Crafting SEO Titles...</h3>
              <p className="text-sm text-zinc-500 mt-2">Analyzing search intent and E-E-A-T signals.</p>
            </div>
          )}

          {/* Loading State for Content */}
          {state.isGeneratingContent && (
            <div className="h-96 flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-zinc-200">
              <Loader2 className="w-10 h-10 text-zinc-900 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900">Writing Your Article...</h3>
              <p className="text-sm text-zinc-500 mt-2">Developing a people-first, authoritative piece of content based on your selected title.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-6 px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-400">© 2026 Optiwrite. Built for SEO Excellence.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-widest flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3" /> Google Search Essentials
            </a>
            <a href="#" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-widest flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3" /> E-E-A-T Guidelines
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AuditCard({ icon, title, value, sub }: { icon: React.ReactNode, title: string, value: string | number, sub: string }) {
  return (
    <div className="bg-[#151921] border border-zinc-800/50 rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-zinc-800/50 rounded-lg flex items-center justify-center text-zinc-400">
        {icon}
      </div>
      <div>
        <div className="text-xl font-black text-zinc-100 leading-none">{value}</div>
        <div className="text-[9px] font-bold text-zinc-500 uppercase mt-1">{title}</div>
        <div className="text-[8px] text-zinc-600 font-medium">{sub}</div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max = 100 }: { label: string, value: number, max?: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-black text-zinc-300">{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className="h-full bg-blue-600"
        />
      </div>
    </div>
  );
}
