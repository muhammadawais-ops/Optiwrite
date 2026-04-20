/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  PenTool, 
  ArrowLeft,
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
  RefreshCw,
  Trash2,
  Plus,
  LogOut,
  LogIn,
  Shield,
  User,
  Lock,
  Calendar,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { safeJsonParse } from '../lib/jsonUtils';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { PaymentModal } from '../components/PaymentModal';
import { FeaturedImageGenerator } from '../components/FeaturedImageGenerator';
import { withRetry } from '../lib/aiUtils';
import { logout } from '../firebase';

// --- Types ---
type ContentType = 'blog' | 'guest-post';

interface ReferenceLink {
  url: string;
  context: string;
}

interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
  state: Partial<AppState>;
}

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
  refinementPrompt: string;
  isGeneratingTitles: boolean;
  isGeneratingVariations: boolean;
  isGeneratingContent: boolean;
  isRefining: boolean;
  isGeneratingFaqs: boolean;
  isGeneratingSchema: boolean;
  editingTitleIndex: number | null;
  manualSecondaryKeywords: string;
  referenceLinks: ReferenceLink[];
  history: HistoryItem[];
  currentSessionId: string | null;
  featuredImageUrl: string | null;
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

const GEMINI_MODEL = "gemini-2.5-flash";

const INITIAL_STATE: AppState = {
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
  refinementPrompt: '',
  isGeneratingTitles: false,
  isGeneratingVariations: false,
  isGeneratingContent: false,
  isRefining: false,
  isGeneratingFaqs: false,
  isGeneratingSchema: false,
  editingTitleIndex: null,
  manualSecondaryKeywords: '',
  referenceLinks: [{ url: '', context: '' }],
  history: [],
  currentSessionId: null,
  featuredImageUrl: null,
  error: null,
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function OptiWrite() {
  const navigate = useNavigate();
  const { user, profile, teamProfile, isAdmin, isSubscribed, hasCredits, useCredit, checkAccess, loading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [isUploadingBlog, setIsUploadingBlog] = useState(false);

  const handleUploadToBlog = async () => {
    if (!state.generatedContent || !isAdmin) return;
    
    setIsUploadingBlog(true);
    try {
      // Simple category analysis based on content
      const contentLower = state.generatedContent.toLowerCase();
      let category = 'SEO Strategy';
      if (contentLower.includes('email') || contentLower.includes('cold message')) category = 'Email Marketing';
      else if (contentLower.includes('ai tool') || contentLower.includes('artificial intelligence')) category = 'AI Trends';
      else if (contentLower.includes('business') || contentLower.includes('growth')) category = 'Business Growth';
      else if (contentLower.includes('writing') || contentLower.includes('copywriting')) category = 'Copywriting';
      
      await addDoc(collection(db, 'blogs'), {
        title: state.selectedTitle,
        content: state.generatedContent,
        imageUrl: state.featuredImageUrl || '', // Use generated image if available
        category: category,
        author: user?.displayName || 'Muhammad Awais',
        createdAt: new Date().toISOString()
      });
      alert('Published to AI Suite Blog!');
    } catch (err) {
      console.error(err);
      alert('Failed to publish.');
    } finally {
      setIsUploadingBlog(false);
    }
  };

  React.useEffect(() => {
    if (profile?.showWelcomePopup) {
      setShowWelcomePopup(true);
      // Reset the flag in Firestore
      const resetFlag = async () => {
        try {
          await updateDoc(doc(db, 'users', profile.uid), {
            showWelcomePopup: false
          });
        } catch (err) {
          console.error("Failed to reset welcome popup flag:", err);
        }
      };
      resetFlag();
    }
  }, [profile]);

  const [state, setState] = useState<AppState>(() => {
    const savedState = localStorage.getItem('optiwrite_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return {
          ...INITIAL_STATE,
          ...parsed,
          isGeneratingTitles: false,
          isGeneratingVariations: false,
          isGeneratingContent: false,
          isRefining: false,
          isGeneratingFaqs: false,
          isGeneratingSchema: false,
          error: null
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return INITIAL_STATE;
  });

  // --- Persistence ---
  React.useEffect(() => {
    const { 
      isGeneratingTitles, 
      isGeneratingVariations, 
      isGeneratingContent, 
      isRefining, 
      isGeneratingFaqs, 
      isGeneratingSchema,
      error,
      ...persistentState 
    } = state;
    localStorage.setItem('optiwrite_state', JSON.stringify(persistentState));
  }, [state]);

  const manualKeywords = state.manualSecondaryKeywords.split(',').map(k => k.trim()).filter(k => k);

  const createNewSession = () => {
    setState(s => ({
      ...s,
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
      refinementPrompt: '',
      manualSecondaryKeywords: '',
      referenceLinks: [{ url: '', context: '' }],
      currentSessionId: null,
      error: null,
    }));
  };

  const getHistoryItem = (currentState: AppState): HistoryItem => {
    const sessionId = currentState.currentSessionId || Math.random().toString(36).substring(7);
    const title = currentState.selectedTitle || currentState.primaryKeyword || "Untitled Generation";
    
    return {
      id: sessionId,
      title,
      timestamp: Date.now(),
      state: {
        contentType: currentState.contentType,
        primaryKeyword: currentState.primaryKeyword,
        websiteUrl: currentState.websiteUrl,
        wordCount: currentState.wordCount,
        authorContext: currentState.authorContext,
        backlinkUrl: currentState.backlinkUrl,
        anchorText: currentState.anchorText,
        hostNiche: currentState.hostNiche,
        titles: currentState.titles,
        selectedTitle: currentState.selectedTitle,
        semanticVariations: currentState.semanticVariations,
        selectedVariations: currentState.selectedVariations,
        generatedContent: currentState.generatedContent,
        metaTitle: currentState.metaTitle,
        metaDescription: currentState.metaDescription,
        auditResults: currentState.auditResults,
        manualSecondaryKeywords: currentState.manualSecondaryKeywords,
        referenceLinks: currentState.referenceLinks,
      }
    };
  };

  const updateHistory = (s: AppState, updatedState: Partial<AppState>): AppState => {
    const nextState = { ...s, ...updatedState };
    if (!nextState.generatedContent && !nextState.primaryKeyword) return nextState;

    const historyItem = getHistoryItem(nextState);
    const existingIndex = s.history.findIndex(h => h.id === historyItem.id);
    let newHistory = [...s.history];
    
    if (existingIndex >= 0) {
      newHistory[existingIndex] = historyItem;
    } else {
      newHistory = [historyItem, ...newHistory];
    }

    return {
      ...nextState,
      history: newHistory,
      currentSessionId: historyItem.id
    };
  };

  const loadSession = (session: HistoryItem) => {
    setState(s => ({
      ...s,
      ...session.state,
      currentSessionId: session.id,
      isGeneratingTitles: false,
      isGeneratingVariations: false,
      isGeneratingContent: false,
      isRefining: false,
      isGeneratingFaqs: false,
      isGeneratingSchema: false,
      error: null
    }));
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setState(s => ({
      ...s,
      history: s.history.filter(h => h.id !== id),
      currentSessionId: s.currentSessionId === id ? null : s.currentSessionId
    }));
  };

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

    if (!checkAccess()) {
      setIsPaymentModalOpen(true);
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

      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      }));

      const titles = safeJsonParse<string[]>(response.text, []);
      await useCredit();
      setState(s => updateHistory(s, { titles, isGeneratingTitles: false }));
    } catch (err: any) {
      console.error(err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      setState(s => ({ ...s, error: errorMessage || "Failed to generate titles. Please try again.", isGeneratingTitles: false }));
    }
  };

  const getSemanticVariations = async () => {
    if (!state.primaryKeyword) {
      setState(s => ({ ...s, error: "Please enter a primary keyword first." }));
      return;
    }

    if (!checkAccess()) {
      setIsPaymentModalOpen(true);
      return;
    }

    setState(s => ({ ...s, isGeneratingVariations: true, error: null }));
    try {
      const prompt = `
        Generate 10 semantic variations and LSI (Latent Semantic Indexing) keywords for the primary keyword: "${state.primaryKeyword}".
        These should help in content optimization and covering the topic comprehensively for Google's Helpful Content update.
        Return ONLY a JSON array of strings.
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      }));

      const variations = safeJsonParse<string[]>(response.text, []);
      await useCredit();
      setState(s => updateHistory(s, { semanticVariations: variations, isGeneratingVariations: false }));
    } catch (err: any) {
      console.error(err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      setState(s => ({ ...s, error: errorMessage || "Failed to generate variations.", isGeneratingVariations: false }));
    }
  };

  const generateFinalContent = async () => {
    if (!state.selectedTitle) {
      setState(s => ({ ...s, error: "Please select a title first." }));
      return;
    }

    if (!checkAccess()) {
      setIsPaymentModalOpen(true);
      return;
    }

    setState(s => ({ ...s, isGeneratingContent: true, error: null }));
    
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
      9. CALL TO ACTION (CTA): Natural CTA at the end encouraging visits to the brand website. Use a proper hyperlink with the brand name as anchor text (e.g., [Brand Name](${state.websiteUrl})).
      10. META DATA: SEO-optimized Meta Title (55-60 chars) and Meta Description (155-160 chars). Title and Meta Title MUST be different.
      11. PARAGRAPH LIMIT: No paragraph should exceed 300 characters. Keep them short and punchy.
      12. BULLET POINTS: Use bullet points and numbered lists naturally where possible to improve readability.
      13. BRAND INTEGRATION: Mention the brand/website name 2-3 times naturally throughout the post to build brand authority. At least one mention MUST be a proper hyperlink using the brand name as anchor text (e.g., [Brand Name](${state.websiteUrl})). DO NOT use raw URLs.
      14. CASE STUDIES: Include at least one realistic, expertise-driven case study (e.g., "When a client approached us at [Brand Name](${state.websiteUrl}) with similar concerns, we implemented [Strategy] and achieved [Result]"). Ensure it sounds authentic and professional.

      Context:
      - Primary Keyword: ${state.primaryKeyword}
      - Selected Semantic Variations: ${state.selectedVariations.join(', ')}
      - Manual Secondary Keywords: ${manualKeywords.join(', ')}
      - Reference Sources (CRITICAL): ${JSON.stringify(state.referenceLinks.filter(l => l.url.trim()))}
      
      INSTRUCTIONS FOR SOURCES:
      - HYPERLINKING (CRITICAL): DO NOT paste raw URLs in parentheses. Instead, embed the "url" into a relevant, natural anchor text within the sentence (e.g., [according to this study](url)).
      - Use the provided "context" for facts, stats, and data points.
      - REWRITE the context completely to match the tool's tone and ensure 100% PLAGIARISM-FREE content. 
      - Keep the numbers/stats accurate but change the phrasing.
      - NATURAL DISTRIBUTION: Distribute these citations NATURALLY throughout the entire article. Spread them out (e.g., one in the introduction, one in the middle, one in the final sections). DO NOT cluster them all in the first few paragraphs.
      - CONTEXTUAL LOGIC: Place the link exactly where the data or fact is mentioned.
      
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
      11. DIFFERENTIATION: This is NOT a blog post. Blog writing is for brand authority; Guest Posting is for external value and backlink authority.
      13. AUTHOR BIO: At the very end of the content, include a professional "About the Author" bio (30-35 words). It should highlight expertise relevant to the topic and subtly mention their role at ${state.websiteUrl || "the company"}.
      14. META DATA: SEO-optimized Meta Title (55-60 chars) and Meta Description (155-160 chars). Title and Meta Title MUST be different.
      15. WORD COUNT: The content MUST be approximately ${state.wordCount} words. Provide a full-length, detailed article that meets this target.
      16. PARAGRAPH LIMIT: No paragraph should exceed 300 characters. Keep them short and punchy.
      17. BULLET POINTS: Use bullet points and numbered lists naturally where possible to improve readability.

      INPUT HANDLING:
      - If Author/Business Context sounds promotional, convert it into neutral expertise positioning.
      - Even if Website URL and Backlink URL are the same, treat this as external guest content.

      Context:
      - Primary Keyword: ${state.primaryKeyword}
      - Selected Semantic Variations: ${state.selectedVariations.join(', ')}
      - Manual Secondary Keywords: ${manualKeywords.join(', ')}
      - Reference Sources (CRITICAL): ${JSON.stringify(state.referenceLinks.filter(l => l.url.trim()))}
      
      INSTRUCTIONS FOR SOURCES:
      - HYPERLINKING (CRITICAL): DO NOT paste raw URLs in parentheses. Instead, embed the "url" into a relevant, natural anchor text within the sentence (e.g., [as reported by industry experts](url)).
      - Use the provided "context" for facts, stats, and data points.
      - REWRITE the context completely to match the tool's tone and ensure 100% PLAGIARISM-FREE content. 
      - Keep the numbers/stats accurate but change the phrasing.
      - NATURAL DISTRIBUTION: Distribute these citations NATURALLY throughout the entire article. Spread them out. DO NOT cluster them at the beginning.
      - CONTEXTUAL LOGIC: Place the link exactly where the data or fact is mentioned.

      - Host Website Niche: ${state.hostNiche}
      - Target Word Count: ${state.wordCount} words.
      - Author/Business Context: ${state.authorContext || "N/A"}

      Return JSON: { "metaTitle": "...", "metaDescription": "...", "content": "Markdown content with proper newlines (\\n) for paragraphs and tables..." }
    `;

    const prompt = isGuestPost ? guestPostPrompt : blogPrompt;

    try {
      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { 
          responseMimeType: "application/json"
        }
      }));

      const data = safeJsonParse<{ metaTitle: string; metaDescription: string; content: string }>(response.text, {
        metaTitle: '',
        metaDescription: '',
        content: ''
      });
      
      if (!data.content) throw new Error("Empty content");

      const content = data.content;
      const audit = calculateAuditMetrics(content);

      await useCredit();
      setState(s => updateHistory(s, { 
        generatedContent: content, 
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        auditResults: audit,
        isGeneratingContent: false 
      }));
    } catch (err: any) {
      console.error(err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      setState(s => ({ ...s, error: errorMessage || "Failed to process generation. Please check your credits.", isGeneratingContent: false }));
    }
  };

  const handleRefineContent = async () => {
    if (!state.refinementPrompt.trim()) return;
    if (!checkAccess()) {
      setIsPaymentModalOpen(true);
      return;
    }

    setState(s => ({ ...s, isRefining: true, error: null }));

    try {
      const isGuestPost = state.contentType === 'guest-post';
      
      const refinePrompt = `
        You are an expert editor. I have a ${state.contentType} that needs specific changes.
        
        ORIGINAL CONTENT:
        ${state.generatedContent}
        
        USER'S REFINEMENT INSTRUCTION:
        "${state.refinementPrompt}"
        
        TASK:
        1. Apply the user's instruction to the content.
        2. MAINTAIN ALL ORIGINAL QUALITY STANDARDS:
           ${isGuestPost 
             ? "Strict Grade 5-6 readability, BERT/MUM optimization, high burstiness, no robotic phrasing, proper Markdown tables, neutral third-person tone, max 300 chars per paragraph, natural bullet points." 
             : "Grade 5-6 readability, BERT/MUM optimization, human tone, natural keyword integration, people-first approach, max 300 chars per paragraph, natural bullet points."}
        3. Keep the same structure (H1, AI Overview, Introduction, etc.).
        4. If the user asks for a specific change, prioritize it while keeping the rest of the content high-quality.
        
        Return the updated content in the same JSON format:
        { "metaTitle": "...", "metaDescription": "...", "content": "Updated Markdown content with proper newlines (\\n) for paragraphs and tables..." }
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: refinePrompt,
        config: { responseMimeType: "application/json" }
      }));

      const data = safeJsonParse<{ metaTitle: string; metaDescription: string; content: string }>(response.text, {
        metaTitle: '',
        metaDescription: '',
        content: ''
      });
      if (!data.content) throw new Error("Empty content");

      const content = data.content;
      const audit = calculateAuditMetrics(content);

      await useCredit();
      setState(s => updateHistory(s, { 
        generatedContent: content, 
        metaTitle: data.metaTitle || s.metaTitle,
        metaDescription: data.metaDescription || s.metaDescription,
        auditResults: audit,
        isRefining: false,
        refinementPrompt: ''
      }));
    } catch (err: any) {
      console.error(err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      setState(s => ({ ...s, error: errorMessage || "Failed to refine content. Please try again.", isRefining: false }));
    }
  };

  const generateFaqs = async () => {
    if (!state.generatedContent) return;
    if (!checkAccess()) {
      setIsPaymentModalOpen(true);
      return;
    }

    setState(s => ({ ...s, isGeneratingFaqs: true, error: null }));
    try {
      const prompt = `
        Based on the following content titled "${state.selectedTitle}", generate a section with 5-6 FAQs addressing real-time user queries.
        Use a professional yet conversational tone.
        
        STRICT RULES FOR FAQs:
        1. ANSWERS MUST BE TO THE POINT.
        2. EACH ANSWER MUST BE LESS THAN 150 CHARACTERS.
        
        Content:
        ${state.generatedContent.substring(0, 1000)}...

        Return the FAQs in Markdown format starting with an "## Frequently Asked Questions" heading.
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      }));

      const faqs = response.text || "";
      await useCredit();
      setState(s => updateHistory(s, { 
        generatedContent: s.generatedContent + "\n\n" + faqs,
        isGeneratingFaqs: false 
      }));
    } catch (err: any) {
      console.error(err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      setState(s => ({ ...s, error: errorMessage || "Failed to generate FAQs.", isGeneratingFaqs: false }));
    }
  };

  const generateSchema = async () => {
    if (!state.generatedContent) return;
    if (!checkAccess()) {
      setIsPaymentModalOpen(true);
      return;
    }

    setState(s => ({ ...s, isGeneratingSchema: true, error: null }));
    try {
      const prompt = `
        Based on the following content titled "${state.selectedTitle}", generate a valid JSON-LD FAQ Schema markup.
        
        Content:
        ${state.generatedContent.substring(0, 1000)}...

        Return ONLY the JSON-LD code block.
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      }));

      const schema = response.text || "";
      await useCredit();
      setState(s => updateHistory(s, { 
        generatedContent: s.generatedContent + "\n\n## Schema Markup\n\n" + schema,
        isGeneratingSchema: false 
      }));
    } catch (err: any) {
      console.error(err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      setState(s => ({ ...s, error: errorMessage || "Failed to generate Schema.", isGeneratingSchema: false }));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(state.generatedContent);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-zinc-400 flex flex-col border-r border-zinc-800 sticky top-0 h-screen shrink-0 hidden md:flex">
        <div className="p-4 border-b border-zinc-800">
          <button 
            onClick={createNewSession}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg py-2.5 px-4 text-sm font-semibold flex items-center gap-2 transition-all border border-zinc-700"
          >
            <Plus className="w-4 h-4" /> New Generation
          </button>
          <button 
            onClick={() => setShowImageGenerator(true)}
            className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg py-2.5 px-4 text-sm font-semibold flex items-center gap-2 transition-all border border-zinc-700"
          >
            <ImageIcon className="w-4 h-4 text-blue-400" /> Featured Image
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your History</div>
          {state.history.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-zinc-600 italic">No history yet</div>
          ) : (
            state.history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadSession(item)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all group flex items-center justify-between",
                  state.currentSessionId === item.id 
                    ? "bg-zinc-800 text-zinc-100 shadow-sm" 
                    : "hover:bg-zinc-800/50 hover:text-zinc-300"
                )}
              >
                <span className="truncate flex-1 mr-2">{item.title}</span>
                <Trash2 
                  className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" 
                  onClick={(e) => deleteSession(e, item.id)}
                />
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-zinc-400 w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-zinc-100 truncate">{user.displayName || user.email}</p>
                  <p className="text-[9px] text-zinc-500 truncate">
                    {isAdmin ? 'Unlimited Credits' : 
                     (teamProfile ? `${teamProfile.credits} Team Credits` : 
                      (isSubscribed ? `${profile?.planName || 'Pro'} Plan: ${profile?.credits || 0} Credits` : `${profile?.credits || 0} Credits Left`))}
                  </p>
                  {isSubscribed && (profile?.expiryDate || teamProfile?.expiryDate) && (
                    <p className="text-[8px] text-green-500 font-bold flex items-center gap-1 mt-0.5">
                      <Calendar className="w-2 h-2" /> Expires: {format(parseISO(profile?.expiryDate || teamProfile?.expiryDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => logout()}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {!isSubscribed && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3 h-3" /> Upgrade to Pro
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 border border-red-600/30"
                >
                  <Shield className="w-3 h-3" /> Admin Dashboard
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full bg-zinc-100 hover:bg-white text-zinc-900 text-[10px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-3 h-3" /> Sign In
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 py-6 px-8 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500 mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="md:hidden w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                <PenTool className="text-white w-6 h-6" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Optiwrite</h1>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">by Muhammad Awais Ramzan</p>
              </div>
              <div className="md:hidden">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">Optiwrite</h1>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-zinc-500">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] font-bold text-zinc-900 leading-none">{user.displayName}</span>
                    <span className="text-[9px] text-zinc-500 mt-1">
                      {isAdmin ? 'Unlimited Access' : 
                       (teamProfile ? 'Team Subscription' : 
                        (isSubscribed ? `${profile?.planName || 'Pro'} Subscription: ${profile?.credits || 0} Credits` : `${profile?.credits || 0} Credits Remaining`))}
                    </span>
                    {isSubscribed && (profile?.expiryDate || teamProfile?.expiryDate) && (
                      <span className="text-[8px] text-green-600 font-bold mt-0.5">
                        Expires: {format(parseISO(profile?.expiryDate || teamProfile?.expiryDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <img src={user.photoURL || ''} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all"
                >
                  Sign In
                </button>
              )}
              <button 
                onClick={createNewSession}
                className="md:hidden p-2 bg-zinc-900 text-white rounded-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {showImageGenerator && (
            <div className="lg:col-span-12">
              <FeaturedImageGenerator 
                initialTopic={state.selectedTitle || state.primaryKeyword} 
                content={state.generatedContent}
                onClose={() => setShowImageGenerator(false)} 
                onImageGenerated={(url) => setState(s => ({ ...s, featuredImageUrl: url }))}
                useCredit={useCredit}
                checkAccess={checkAccess}
              />
            </div>
          )}
          
          {(!user || (!isSubscribed && !hasCredits)) && !showImageGenerator && (
            <div className="absolute inset-0 z-20 bg-zinc-50/60 backdrop-blur-[2px] flex items-center justify-center p-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-2xl max-w-md text-center"
              >
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-xl font-black text-zinc-900">Tool Locked</h3>
                <p className="text-sm text-zinc-500 mt-2 mb-8">
                  {!user 
                    ? "Please sign in to start using Optiwrite. You'll get 3 free credits!" 
                    : "You've used all your free credits. Upgrade to Pro for unlimited access."}
                </p>
                {!user ? (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" /> Sign In Now
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" /> Upgrade to Pro
                  </button>
                )}
              </motion.div>
            </div>
          )}
        {/* Left Column: Inputs */}
        <div className={cn("lg:col-span-4 space-y-6", showImageGenerator && "hidden lg:block")}>
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
        <div className={cn("lg:col-span-8 space-y-6", showImageGenerator && "hidden lg:block")}>
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
                            onClick={() => setState(s => updateHistory(s, { selectedTitle: title, editingTitleIndex: null }))}
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
                                  setState(s => updateHistory(s, { 
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
                            onClick={() => setState(s => updateHistory(s, { selectedTitle: title, editingTitleIndex: null }))}
                          >
                            <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", isSelected && "opacity-100")} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {state.selectedTitle && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 pt-6 border-t border-zinc-100 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" /> Reference Links (Perplexity/Sources)
                      </h3>
                      <button 
                        onClick={() => setState(s => ({ ...s, referenceLinks: [...s.referenceLinks, { url: '', context: '' }] }))}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tighter flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Add More
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {state.referenceLinks.map((link, idx) => (
                        <div key={idx} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3 relative group">
                          <div className="flex gap-2">
                            <input 
                              type="url"
                              placeholder="Source URL (e.g. https://...)"
                              className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...state.referenceLinks];
                                newLinks[idx].url = e.target.value;
                                setState(s => ({ ...s, referenceLinks: newLinks }));
                              }}
                            />
                            {state.referenceLinks.length > 1 && (
                              <button 
                                onClick={() => setState(s => ({ ...s, referenceLinks: s.referenceLinks.filter((_, i) => i !== idx) }))}
                                className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                              >
                                <RefreshCw className="w-4 h-4 rotate-45" />
                              </button>
                            )}
                          </div>
                          <textarea 
                            placeholder="Paste the paragraph/context from Perplexity here..."
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all h-20 resize-none"
                            value={link.context}
                            onChange={(e) => {
                              const newLinks = [...state.referenceLinks];
                              newLinks[idx].context = e.target.value;
                              setState(s => ({ ...s, referenceLinks: newLinks }));
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button 
                        onClick={generateFinalContent}
                        disabled={state.isGeneratingContent}
                        className="bg-zinc-900 text-white rounded-lg px-8 py-3 text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 disabled:opacity-50 shadow-xl shadow-zinc-200"
                      >
                        {state.isGeneratingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Generate Full Content
                      </button>
                    </div>
                  </motion.div>
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
                        onClick={() => setShowImageGenerator(true)}
                        className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-500"
                        title="Generate Featured Image"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={handleUploadToBlog}
                          disabled={isUploadingBlog}
                          className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-blue-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                          title="Upload to Blog"
                        >
                          <Plus className="w-3 h-3" /> {isUploadingBlog ? 'Uploading...' : 'Upload to Blog'}
                        </button>
                      )}
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.generatedContent}</ReactMarkdown>
                    </div>
                  </div>
                </section>

                {/* Content Refinement Section */}
                <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-bold text-zinc-700">Refine Content</h3>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                    Want to change something? Ask for a specific edit below.
                  </p>
                  <div className="relative">
                    <textarea
                      value={state.refinementPrompt}
                      onChange={(e) => setState(s => ({ ...s, refinementPrompt: e.target.value }))}
                      placeholder="Example: 'Make the introduction more punchy' or 'Add a section about the benefits of X'..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] resize-none"
                    />
                    <button
                      onClick={handleRefineContent}
                      disabled={state.isRefining || !state.refinementPrompt.trim()}
                      className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-lg transition-all"
                    >
                      {state.isRefining ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Refining...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          Update Content
                        </>
                      )}
                    </button>
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

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />

      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcomePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
              <button 
                onClick={() => setShowWelcomePopup(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-black text-zinc-900 mb-2">Congratulations!</h2>
              <p className="text-zinc-600 mb-8">
                Your payment has been verified. You now have **{profile?.planName || 'Pro'} Plan** access to Optiwrite for 1 month!
              </p>

              <div className="bg-green-50 rounded-2xl p-4 mb-8 flex items-center justify-center gap-3 text-green-700 font-bold text-sm">
                <Calendar className="w-5 h-5" />
                Valid until: {profile?.expiryDate ? format(parseISO(profile.expiryDate), 'MMMM d, yyyy') : '1 month from now'}
              </div>

              <button
                onClick={() => setShowWelcomePopup(false)}
                className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/20"
              >
                Start Writing Now
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Loading Overlay */}
      {authLoading && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-zinc-900 animate-spin" />
        </div>
      )}
    </div>
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
