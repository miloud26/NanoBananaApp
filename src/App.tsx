/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  Upload, 
  Send, 
  Image as ImageIcon, 
  Loader2, 
  RefreshCw, 
  X, 
  Download, 
  Plus,
  Sparkles,
  Trash2,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      fileList.forEach((file: File) => {
        if (images.length >= 3) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => {
            if (prev.length >= 3) return prev;
            return [...prev, reader.result as string];
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateImage = async () => {
    if (!prompt) {
      setError("يرجى إدخال وصف للصورة أولاً.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const parts: any[] = [{ text: prompt }];
      
      images.forEach(img => {
        const base64Data = img.split(",")[1];
        const mimeType = img.split(";")[0].split(":")[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      });

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "9:16",
            imageSize: "1K",
          },
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResultImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        setError("لم يتم توليد أي صورة. حاول تغيير الوصف.");
      }
    } catch (err: any) {
      console.error("Error generating image:", err);
      setError(err.message || "حدث خطأ أثناء توليد الصورة.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setImages([]);
    setResultImage(null);
    setPrompt("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-orange-100">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
      </div>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Nano Banana <span className="text-orange-500">Studio</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">Advanced AI Generation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={reset}
              className="p-2.5 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
              title="إعادة تعيين"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Image Upload Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-orange-500" />
                    الصور المرجعية
                  </h2>
                  <p className="text-sm text-neutral-400">يمكنك إضافة حتى 3 صور لتوجيه الذكاء الاصطناعي</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-neutral-100 rounded-md text-neutral-500">
                  {images.length} / 3
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {images.map((img, index) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={index} 
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-200 group shadow-sm"
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Ref ${index}`} referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
                
                {images.length < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[3/4] rounded-2xl border-2 border-dashed border-neutral-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-orange-500 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-50 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">إضافة صورة</span>
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
            </section>

            {/* Prompt Section */}
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Send className="w-5 h-5 text-orange-500" />
                  وصف الرؤية
                </h2>
                <p className="text-sm text-neutral-400">اكتب بالتفصيل ما تريد أن يراه العالم</p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-blue-500 rounded-[2rem] blur opacity-10 group-focus-within:opacity-20 transition duration-500" />
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="مثال: رائد فضاء يركب خيلاً في الفضاء الخارجي، بأسلوب سينمائي وألوان زاهية..."
                    dir="rtl"
                    className="w-full min-h-[180px] p-6 rounded-[1.5rem] border border-neutral-200 bg-white focus:border-orange-500 outline-none transition-all text-lg leading-relaxed shadow-sm"
                  />
                  
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                      <Info className="w-3 h-3" />
                      Gemini 3.1 Flash
                    </div>
                  </div>

                  <button
                    onClick={generateImage}
                    disabled={isLoading || !prompt}
                    className={`absolute bottom-4 right-4 px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-xl
                      ${isLoading || !prompt 
                        ? "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none" 
                        : "bg-[#1A1A1A] text-white hover:bg-orange-500 hover:shadow-orange-500/25 active:scale-95"}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جاري التوليد...</span>
                      </>
                    ) : (
                      <>
                        <span>توليد الصورة</span>
                        <Sparkles className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <X className="w-4 h-4" />
                  </div>
                  {error}
                </motion.div>
              )}
            </section>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-5 sticky top-32">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">النتيجة النهائية</h2>
                {resultImage && (
                  <a
                    href={resultImage}
                    download="nano-banana-art.png"
                    className="flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    تحميل الصورة
                  </a>
                )}
              </div>

              <div className="relative aspect-[9/16] w-full max-w-[400px] mx-auto rounded-[2.5rem] bg-white border border-neutral-100 shadow-2xl shadow-neutral-200/50 overflow-hidden flex items-center justify-center p-2">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                
                <AnimatePresence mode="wait">
                  {resultImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full rounded-[2rem] overflow-hidden shadow-inner"
                    >
                      <img src={resultImage} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </motion.div>
                  ) : isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center space-y-6"
                    >
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-orange-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-orange-500 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-bold tracking-tight">جاري الإبداع...</p>
                        <p className="text-sm text-neutral-400 px-8">يقوم نانو بنانا بتحويل وصفك إلى تحفة فنية</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center space-y-4 p-12"
                    >
                      <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto">
                        <ImageIcon className="w-10 h-10 text-neutral-200" />
                      </div>
                      <p className="text-neutral-400 font-medium">ستظهر إبداعاتك هنا</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-20 border-t border-neutral-100 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-neutral-900 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white w-4 h-4" />
              </div>
              <span className="font-bold">Nano Banana Studio</span>
            </div>
            <p className="text-sm text-neutral-400 max-w-xs">
              منصة متطورة لتوليد الصور باستخدام الذكاء الاصطناعي، مصممة للمبدعين والمصممين.
            </p>
          </div>
          <div className="flex flex-wrap gap-8 md:justify-end text-sm font-bold text-neutral-400">
            <a href="#" className="hover:text-orange-500 transition-colors">عن المشروع</a>
            <a href="#" className="hover:text-orange-500 transition-colors">الخصوصية</a>
            <a href="#" className="hover:text-orange-500 transition-colors">تواصل معنا</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
