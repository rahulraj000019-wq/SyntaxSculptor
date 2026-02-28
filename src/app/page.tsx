'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Play, 
  Trash2, 
  Terminal, 
  Code2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  BookOpen,
  Sparkles,
  ChevronRight,
  Maximize2,
  Minimize2,
  Cpu,
  Wand2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lexer } from '@/lib/compiler/lexer';
import { Parser } from '@/lib/compiler/parser';
import { explainCompilerErrors, AIErrorExplanationOutput } from '@/ai/flows/ai-error-explanation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    int x = 10;
    int y = 5;
    
    // Attempting a calculation
    int result = x + y
    
    printf("Result is: %d\\n", result);
    
    return 0;
}
`;

export default function SyntaxSculptorPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isCompiling, setIsCompiling] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIErrorExplanationOutput | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [isMaximized, setIsMaximized] = useState(false);
  
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== 'idle' || isCompiling || aiAnalysis) {
      const timer = setTimeout(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [status, isCompiling, aiAnalysis, errors.length]);

  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    setAiAnalysis(null);
    setStatus('idle');
    setErrors([]);

    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    parser.parse();
    const localErrors = [...lexer.getErrors(), ...parser.getErrors()];

    try {
      const result = await explainCompilerErrors({
        sourceCode: code,
        compilerErrors: localErrors.map(e => ({
          message: e.message,
          line: e.line,
          type: e.type as any
        }))
      });

      setAiAnalysis(result);
      
      if (result.success) {
        setStatus('success');
        setErrors([]);
      } else {
        setStatus('failed');
        setErrors(result.enhancedErrors);
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
      if (localErrors.length > 0) {
        setStatus('failed');
        setErrors(localErrors);
      }
    } finally {
      setIsCompiling(false);
    }
  }, [code]);

  const handleApplyFix = () => {
    if (aiAnalysis?.correctedCode) {
      setCode(aiAnalysis.correctedCode);
      setStatus('idle');
      setAiAnalysis(null);
      setErrors([]);
      toast({
        title: "Code Restored",
        description: "AI magic has successfully patched your source code.",
      });
    }
  };

  const handleClear = () => {
    setCode('');
    setErrors([]);
    setAiAnalysis(null);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-secondary/20 font-body">
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-20 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
            <Cpu className="text-primary-foreground h-6 w-6" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SyntaxSculptor <span className="text-muted-foreground font-thin">Pro</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Universal C-Language Diagnostic Core</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleClear} className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-semibold">
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
          <Button 
            onClick={handleCompile} 
            disabled={isCompiling} 
            className="gap-2 px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all font-bold"
          >
            {isCompiling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            Deep Scan Code
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1600px] mx-auto w-full">
        
        {/* Editor Panel */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary/40" />
              <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-muted-foreground">C Source Editor</h3>
            </div>
            <Badge variant="outline" className="font-code text-[10px] border-primary/20 bg-primary/5 text-primary">
              C89 / C99 / C11 / C23
            </Badge>
          </div>
          
          {isMaximized && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300" 
              onClick={() => setIsMaximized(false)}
            />
          )}

          <Card className={cn(
            "flex-1 flex flex-col overflow-hidden border-none shadow-2xl ring-1 ring-black/5 bg-white relative group transition-all duration-300",
            isMaximized ? "fixed inset-4 md:inset-10 z-[101] h-auto" : "h-[650px]"
          )}>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/30 border-r flex flex-col items-center pt-6 space-y-3 select-none">
              {[...Array(isMaximized ? 40 : 20)].map((_, i) => (
                <span key={i} className="text-[10px] font-code text-muted-foreground/50 font-medium">{i + 1}</span>
              ))}
            </div>
            
            <div className="absolute right-4 top-4 z-20">
              {isMaximized && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMaximized(false)} 
                  className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            <CardContent className="flex-1 p-0 pl-12 relative h-full">
              <textarea
                className="w-full h-full p-6 code-editor bg-transparent text-foreground focus:outline-none resize-none text-base leading-relaxed selection:bg-secondary/30"
                spellCheck={false}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Write any C code here..."
              />
              {!isMaximized && (
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 
                    className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMaximized(true);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Diagnostic Panel */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary/60" />
              <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-muted-foreground">Diagnostic Insights</h3>
            </div>
            {status !== 'idle' && (
              <Badge 
                variant={status === 'success' ? 'secondary' : 'destructive'} 
                className={cn(
                  "px-3 py-1 font-bold animate-in fade-in zoom-in",
                  status === 'success' ? "bg-secondary text-white border-none" : ""
                )}
              >
                {status === 'success' ? 'Valid C Code' : `${errors.length} Issues Found`}
              </Badge>
            )}
          </div>

          <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-2xl ring-1 ring-black/5 bg-white/50 backdrop-blur-sm h-[650px]">
            <ScrollArea className="flex-1 px-6 pt-6">
              {status === 'idle' && !isCompiling && (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-6 opacity-40 group">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-muted rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                    <BookOpen className="h-16 w-16 text-muted-foreground relative" />
                  </div>
                  <div className="space-y-2 relative">
                    <p className="font-headline font-bold text-xl text-primary/80">Awaiting Compilation</p>
                    <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed font-medium">
                      Enter any standard C code to perform a deep semantic and structural analysis.
                    </p>
                  </div>
                </div>
              )}

              {isCompiling && (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-primary/10 rounded-full animate-ping" />
                    <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-headline font-bold text-lg animate-pulse tracking-wide uppercase">AI Semantic Engine Active</p>
                    <p className="text-xs text-muted-foreground font-bold">POINTERS • MEMORY • SYMBOLS • STANDARDS</p>
                  </div>
                </div>
              )}

              {status === 'success' && (
                <div className="space-y-6 pb-6">
                  <div className="bg-secondary/5 border border-secondary/20 p-8 rounded-[2rem] space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-start gap-5">
                      <div className="bg-secondary p-3 rounded-2xl shadow-lg shadow-secondary/20">
                        <CheckCircle2 className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-2xl text-secondary-foreground/90">Standard Compliant</h3>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">Your C code successfully passed the deep semantic scan.</p>
                      </div>
                    </div>
                    {aiAnalysis?.overallFeedback && (
                      <p className="text-sm italic text-muted-foreground/80 bg-white/50 p-4 rounded-xl border border-dashed">
                        "{aiAnalysis.overallFeedback}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {status === 'failed' && (
                <div className="space-y-8 pb-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-destructive/5 border border-destructive/10 p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-destructive/10 p-2 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-destructive tracking-tight">Diagnostics Report</p>
                        <p className="text-xs text-destructive/70 font-medium">Found {errors.length} semantic or syntax violations.</p>
                      </div>
                    </div>
                    
                    {aiAnalysis?.correctedCode && (
                      <Button 
                        size="sm" 
                        onClick={handleApplyFix}
                        className="bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20 font-bold gap-2 animate-in fade-in slide-in-from-right-2"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        Magic Fix
                      </Button>
                    )}
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {errors.map((error, idx) => (
                      <AccordionItem 
                        key={idx} 
                        value={`error-${idx}`}
                        className="border-none rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden transition-all hover:shadow-md"
                      >
                        <AccordionTrigger className="hover:no-underline px-6 py-5 group">
                          <div className="flex items-center gap-5 text-left w-full">
                            <div className="bg-muted px-3 py-1.5 rounded-lg text-[10px] font-code font-black text-muted-foreground">
                              LINE {error.line}
                            </div>
                            <div className="flex-1">
                              <span className="font-bold text-sm tracking-tight text-foreground/80 line-clamp-1">{error.originalMessage || error.message}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-data-[state=open]:rotate-90" />
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 space-y-6">
                          <div className="flex gap-4">
                            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none font-bold text-[10px]">
                              {String(error.type || 'Error').toUpperCase()}
                            </Badge>
                          </div>

                          <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-primary/80">
                                <Sparkles className="h-4 w-4 text-secondary" />
                                <h4 className="font-headline font-bold text-sm uppercase tracking-wide">AI Core Explanation</h4>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                {error.explanation || error.message}
                              </p>
                            </div>
                            
                            {error.potentialCauses && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-muted/30 p-4 rounded-xl space-y-2 border border-muted-foreground/5">
                                  <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">C Standard Pitfalls</h5>
                                  <ul className="space-y-1.5">
                                    {error.potentialCauses.map((cause: string, cIdx: number) => (
                                      <li key={cIdx} className="text-xs text-foreground/70 font-semibold flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-primary/30" />
                                        {cause}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-secondary/5 p-4 rounded-xl space-y-2 border border-secondary/10">
                                  <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-secondary/70">Corrective Actions</h5>
                                  <ul className="space-y-1.5">
                                    {error.suggestions.map((sug: string, sIdx: number) => (
                                      <li key={sIdx} className="text-xs text-foreground/70 font-semibold flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-secondary/30" />
                                        {sug}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
              <div ref={scrollAnchorRef} className="h-px w-full" />
            </ScrollArea>
            
            <CardFooter className="bg-white/50 border-t p-4 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2 h-2 rounded-full", status === 'idle' ? 'bg-muted' : (status === 'failed' ? 'bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.5)]' : 'bg-secondary'))} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Semantic Analysis</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2 h-2 rounded-full", status === 'idle' ? 'bg-muted' : (status === 'failed' ? 'bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.5)]' : 'bg-secondary'))} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">C Standards</span>
                  </div>
               </div>
               <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                 Universal C Diagnostic Core 2.0
               </div>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="p-8 mt-auto border-t bg-white flex flex-col items-center space-y-4">
        <div className="flex items-center gap-8 opacity-40">
           <span className="text-[10px] font-bold uppercase tracking-widest">C89/C99/C11/C23</span>
           <div className="h-1 w-1 rounded-full bg-muted-foreground" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Deep Semantic Scan</span>
           <div className="h-1 w-1 rounded-full bg-muted-foreground" />
           <span className="text-[10px] font-bold uppercase tracking-widest">GenAI Diagnostics</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
          SyntaxSculptor &bull; Professional Edition
        </p>
      </footer>
    </div>
  );
}
