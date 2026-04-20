import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Image as ImageIcon, 
  Upload, 
  Download, 
  Loader2, 
  Palette, 
  Type, 
  Sparkles,
  X,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { safeJsonParse } from '../lib/jsonUtils';
import { withRetry } from '../lib/aiUtils';

interface FeaturedImageGeneratorProps {
  initialTopic?: string;
  content?: string;
  onClose?: () => void;
  onImageGenerated?: (imageUrl: string) => void;
  useCredit?: (amount?: number) => Promise<void>;
  checkAccess?: (requiredCredits?: number) => boolean;
}

export const FeaturedImageGenerator: React.FC<FeaturedImageGeneratorProps> = ({ 
  initialTopic = '', 
  content = '',
  onClose,
  onImageGenerated,
  useCredit,
  checkAccess
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [tertiaryColor, setTertiaryColor] = useState('no color');
  const [logo, setLogo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedInsights, setExtractedInsights] = useState<{
    visualPrompt: string;
    layout: 'left' | 'right' | 'center';
  } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const imageStyles = [
    { id: 'professional', name: 'Professional', description: 'Clean, corporate & minimalist', prompt: 'modern, clean, and corporate minimalist style' },
    { id: 'anime', name: 'Anime', description: 'Vibrant, high-quality illustration', prompt: 'anime style, vibrant colors, expressive high-quality illustration' },
    { id: '3d', name: '3D Render', description: 'High-tech & futuristic', prompt: '3D isometric render, Octane render, high-tech, futuristic' },
    { id: 'abstract', name: 'Abstract', description: 'Creative fluid shapes', prompt: 'abstract artistic background, fluid shapes, creative textures' },
    { id: 'photorealistic', name: 'Photorealistic', description: 'Natural high-end photography', prompt: 'photorealistic, high-end photography, natural lighting' },
    { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon & dark futuristic', prompt: 'cyberpunk aesthetic, neon lights, dark atmosphere, futuristic' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractInsights = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const stylePrompt = imageStyles.find(s => s.id === selectedStyle)?.prompt || 'professional minimalist style';
      const prompt = `
        Analyze the following blog topic and content to extract visual insights for a featured image.
        Topic: "${topic}"
        Content: "${content.substring(0, 2000)}"
        Requested Style: ${stylePrompt}

        Return a JSON object with:
        1. "visualPrompt": A highly descriptive prompt for an AI image generator to create a background image in the "${stylePrompt}" that captures the intent of the topic. Focus on metaphors, high-quality textures, and professional lighting. Do not include text.
        2. "layout": One of "left", "right", or "center" based on where the text would look best for this topic and style.

        IMPORTANT: The "visualPrompt" MUST include instructions to leave the area specified in "layout" relatively clear or as negative space for text overlay. For example, if layout is "left", the prompt should say "place the main subject on the right side, leaving the left side clear for text".

        Return ONLY JSON.
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      }));

      const data = safeJsonParse(response.text, {
        visualPrompt: '',
        layout: 'left' as const
      });
      setExtractedInsights(data);
      return data;
    } catch (err) {
      console.error("Failed to extract insights:", err);
      return null;
    }
  };

  const generateBackground = async () => {
    if (!topic) {
      setError("Please enter a topic.");
      return;
    }

    if (checkAccess && !checkAccess(2)) {
      setError("You don't have enough credits to generate an image (Requires 2 credits).");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setFinalImage(null);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      const insights = await extractInsights();
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const colorContext = `Use a professional color palette based on: Primary: ${primaryColor}${secondaryColor !== 'no color' ? `, Secondary: ${secondaryColor}` : ''}${tertiaryColor !== 'no color' ? `, Tertiary: ${tertiaryColor}` : ''}.`;
      
      const basePrompt = insights?.visualPrompt || `Create a professional, high-quality, minimalist background image for a blog featured image about "${topic}". The style should be modern, clean, and corporate.`;
      
      const finalPrompt = `${basePrompt} ${colorContext} The image should have plenty of negative space for text overlay. Do not include any text in the image itself. High resolution, 4k, professional photography or high-end digital art style.`;

      let base64Image = "";

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: finalPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      }));

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (base64Image) {
        if (useCredit) await useCredit(2);
        setGeneratedImage(base64Image);
        return; // Success
      } else {
        throw new Error("Failed to generate image data.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate background image.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (generatedImage) {
      overlayContent();
    }
  }, [generatedImage, topic, logo, extractedInsights]);

  const overlayContent = () => {
    const canvas = canvasRef.current;
    if (!canvas || !generatedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = generatedImage;

    bgImg.onload = () => {
      canvas.width = 1280;
      canvas.height = 720;

      const layout = extractedInsights?.layout || 'left';

      // Draw background
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // Gradient Overlay for better contrast based on layout
      if (layout === 'left') {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width * 0.6, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (layout === 'right') {
        const gradient = ctx.createLinearGradient(canvas.width, 0, canvas.width * 0.4, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw Topic Text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = layout;
      ctx.textBaseline = 'top';
      
      let fontSize = 72;
      if (topic.length > 40) fontSize = 60;
      if (topic.length > 80) fontSize = 48;
      
      ctx.font = `900 ${fontSize}px Inter, sans-serif`;
      
      const words = topic.split(' ');
      let line = '';
      const lines = [];
      const maxWidth = layout === 'center' ? canvas.width * 0.8 : canvas.width * 0.5;
      const lineHeight = fontSize * 1.1;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const paddingX = layout === 'left' ? 80 : (layout === 'right' ? canvas.width - 80 : canvas.width / 2);
      
      // Calculate total height of all lines to center vertically
      const totalTextHeight = lines.length * lineHeight;
      let currentY = (canvas.height - totalTextHeight) / 2;
      
      lines.forEach((l, i) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 15;
        ctx.fillText(l.trim(), paddingX, currentY);
        currentY += lineHeight;
      });

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw Logo
      if (logo) {
        const logoImg = new Image();
        logoImg.src = logo;
        logoImg.onload = () => {
          const padding = 60;
          const logoMaxHeight = 60;
          const logoMaxWidth = 180;
          
          let width = logoImg.width;
          let height = logoImg.height;
          
          if (width > logoMaxWidth) {
            height = height * (logoMaxWidth / width);
            width = logoMaxWidth;
          }
          if (height > logoMaxHeight) {
            width = width * (logoMaxHeight / height);
            height = logoMaxHeight;
          }

          // Logo position: opposite of layout
          const logoX = layout === 'left' ? canvas.width - width - padding : padding;
          ctx.drawImage(logoImg, logoX, canvas.height - height - padding, width, height);
          const url = canvas.toDataURL('image/png');
          setFinalImage(url);
          if (onImageGenerated) onImageGenerated(url);
        };
      } else {
        const url = canvas.toDataURL('image/png');
        setFinalImage(url);
        if (onImageGenerated) onImageGenerated(url);
      }
    };
  };

  const downloadImage = () => {
    if (!finalImage) return;
    const link = document.createElement('a');
    link.download = `featured-image-${topic.slice(0, 20)}.png`;
    link.href = finalImage;
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-500" /> Featured Image Generator
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Blog Topic / Title</label>
            <textarea 
              placeholder="Enter the topic for your featured image..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all h-24 resize-none"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Image Style Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Image Style
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {imageStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center gap-1",
                    selectedStyle === style.id
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-200"
                  )}
                >
                  <span className="text-xs font-bold">{style.name}</span>
                  <span className="text-[10px] leading-tight opacity-70">{style.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                <Palette className="w-3 h-3" /> Primary Color
              </label>
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                <div 
                  className="w-8 h-8 rounded-md border border-zinc-300 shadow-sm shrink-0" 
                  style={{ backgroundColor: primaryColor }}
                />
                <input 
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs font-mono focus:ring-0 p-0"
                  placeholder="#000000"
                />
                <input 
                  type="color" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent opacity-0 absolute"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                <Palette className="w-3 h-3" /> Secondary Color
              </label>
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                <div 
                  className="w-8 h-8 rounded-md border border-zinc-300 shadow-sm shrink-0 flex items-center justify-center overflow-hidden" 
                  style={{ backgroundColor: secondaryColor === 'no color' ? 'transparent' : secondaryColor }}
                >
                  {secondaryColor === 'no color' && <X className="w-4 h-4 text-zinc-300" />}
                </div>
                <input 
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs font-mono focus:ring-0 p-0"
                  placeholder="#ffffff or 'no color'"
                />
                {secondaryColor !== 'no color' && (
                  <input 
                    type="color" 
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent opacity-0 absolute"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                <Palette className="w-3 h-3" /> Tertiary Color
              </label>
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                <div 
                  className="w-8 h-8 rounded-md border border-zinc-300 shadow-sm shrink-0 flex items-center justify-center overflow-hidden" 
                  style={{ backgroundColor: tertiaryColor === 'no color' ? 'transparent' : tertiaryColor }}
                >
                  {tertiaryColor === 'no color' && <X className="w-4 h-4 text-zinc-300" />}
                </div>
                <input 
                  type="text"
                  value={tertiaryColor}
                  onChange={(e) => setTertiaryColor(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs font-mono focus:ring-0 p-0"
                  placeholder="#ffffff or 'no color'"
                />
                {tertiaryColor !== 'no color' && (
                  <input 
                    type="color" 
                    value={tertiaryColor}
                    onChange={(e) => setTertiaryColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent opacity-0 absolute"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1">
              <Upload className="w-3 h-3" /> Brand Logo
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer bg-zinc-50 border border-dashed border-zinc-300 rounded-lg p-4 hover:bg-zinc-100 transition-all text-center">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {logo ? (
                  <div className="flex items-center justify-center gap-2">
                    <img src={logo} alt="Logo Preview" className="h-8 object-contain" />
                    <span className="text-xs text-zinc-500">Change Logo</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-500">Upload PNG/JPG Logo</span>
                  </div>
                )}
              </label>
              {logo && (
                <button 
                  onClick={() => setLogo(null)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={generateBackground}
            disabled={isGenerating || !topic}
            className="w-full bg-zinc-900 text-white rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate Featured Image
          </button>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <label className="block text-xs font-bold text-zinc-500 uppercase">Live Preview</label>
          <div className="aspect-video bg-zinc-100 rounded-2xl border border-zinc-200 overflow-hidden relative flex items-center justify-center group">
            {finalImage ? (
              <>
                <img src={finalImage} alt="Generated Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={downloadImage}
                    className="bg-white text-zinc-900 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Image
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                {isGenerating ? (
                  <div className="space-y-3">
                    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto" />
                    <p className="text-sm text-zinc-500 font-medium">Generating background image...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="w-12 h-12 text-zinc-300 mx-auto" />
                    <p className="text-sm text-zinc-400">Your generated image will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {finalImage && (
            <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900">Image Ready!</p>
                  <p className="text-[10px] text-blue-700">Topic and logo have been overlaid.</p>
                </div>
              </div>
              <button 
                onClick={downloadImage}
                className="text-blue-600 hover:text-blue-700 text-xs font-bold uppercase tracking-wider"
              >
                Download
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
