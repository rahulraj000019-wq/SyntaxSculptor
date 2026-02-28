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
  Info,
  BookOpen,
  Sparkles,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lexer, LexicalError } from '@/lib/compiler/lexer';
import { Parser, SyntaxError } from '@/lib/compiler/parser';
import { explainCompilerErrors, AIErrorExplanationOutput } from '@/ai/flows/ai-error-explanation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const DEFAULT_CODE = `int x;
int y;
x = 10;
y = x + 5;

if (x) {
    while (y) {
        y = y - 1;
    }
}
`;

type CompilerError = (LexicalError | SyntaxError);

export default function SyntaxSculptorPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isCompiling, setIsCompiling] = useState(false);
  const [errors, setErrors] = useState<CompilerError[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIErrorExplanationOutput | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  
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

    await new Promise(resolve => setTimeout(resolve, 800));

    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    
    parser.parse();
    
    const combinedErrors = [...lexer.getErrors(), ...parser.getErrors()];
    setErrors(combinedErrors);

    if (combinedErrors.length === 0) {
      setStatus('success');
      setIsCompiling(false);
    } else {
      setStatus('failed');
      try {
        const result = await explainCompilerErrors({
          sourceCode: code,
          compilerErrors: combinedErrors.map(e => ({
            message: e.message,
            line: e.line,
            type: e.type as 'Lexical' | 'Syntax'
          }))
        });
        setAiAnalysis(result);
      } catch (err) {
        console.error('AI Analysis failed:', err);
      } finally {
        setIsCompiling(false);
      }
    }
  }, [code]);

  const handleClear = () => {
    setCode('');
    setErrors([]);
    setAiAnalysis(null);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-secondary/20 font-body">
      {/* Navbar */}
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-20 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
            <Code2 className="text-primary-foreground h-6 w-6" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SyntaxSculptor
            </h1>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Educational Mini Compiler</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleClear} className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-semibold">
            <Trash2 className="h-4 w-4" /> Reset
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
            Compile Analysis
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1600px] mx-auto w-full">
        
        {/* Editor Panel */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary/40" />
              <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-muted-foreground">Source Code</h3>
            </div>
            <Badge variant="outline" className="font-code text-[10px] border-primary/20 bg-primary/5 text-primary">
              LL(1) GRAMMAR
            </Badge>
          </div>
          
          <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-2xl ring-1 ring-black/5 bg-white relative group">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/30 border-r flex flex-col items-center pt-6 space-y-3 select-none">
              {[...Array(15)].map((_, i) => (
                <span key={i} className="text-[10px] font-code text-muted-foreground/50 font-medium">{i + 1}</span>
              ))}
            </div>
            <CardContent className="flex-1 p-0 pl-12 relative h-[600px]">
              <textarea
                className="w-full h-full p-6 code-editor bg-transparent text-foreground focus:outline-none resize-none text-base leading-relaxed selection:bg-secondary/30"
                spellCheck={false}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Define variables and logic here..."
              />
              <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagnostic Panel */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary/60" />
              <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-muted-foreground">Diagnostics</h3>
            </div>
            {status !== 'idle' && (
              <Badge 
                variant={status === 'success' ? 'secondary' : 'destructive'} 
                className={cn(
                  "px-3 py-1 font-bold animate-in fade-in zoom-in",
                  status === 'success' ? "bg-secondary text-white border-none" : ""
                )}
              >
                {status === 'success' ? 'Success' : `${errors.length} Issue${errors.length > 1 ? 's' : ''}`}
              </Badge>
            )}
          </div>

          <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-2xl ring-1 ring-black/5 bg-white/50 backdrop-blur-sm h-[600px]">
            <ScrollArea className="flex-1 px-6 pt-6">
              {status === 'idle' && !isCompiling && (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-6 opacity-40 group">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-muted rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                    <BookOpen className="h-16 w-16 text-muted-foreground relative" />
                  </div>
                  <div className="space-y-2 relative">
                    <p className="font-headline font-bold text-xl text-primary/80">Awaiting Input</p>
                    <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed font-medium">
                      Sculpt your logic in the editor and initiate a compilation to see the underlying architecture.
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
                    <p className="font-headline font-bold text-lg animate-pulse tracking-wide uppercase">Analyzing Semantics</p>
                    <p className="text-xs text-muted-foreground font-bold">LEXICAL • SYNTAX • CONTEXT</p>
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
                        <h3 className="font-headline font-bold text-2xl text-secondary-foreground/90">Architecture Validated</h3>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">Your source code adheres perfectly to the compiler grammar rules.</p>
                      </div>
                    </div>
                    
                    <Separator className="bg-secondary/10" />
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Algorithm</p>
                        <p className="text-sm font-bold text-secondary-foreground/80">LL(1) Recursive Descent</p>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</p>
                        <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/5">CLEAN BUILD</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2 flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-secondary" />
                    <p className="text-xs font-bold uppercase tracking-wider">Analysis complete &bull; Ready for execution</p>
                  </div>
                </div>
              )}

              {status === 'failed' && (
                <div className="space-y-8 pb-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-destructive/5 border border-destructive/10 p-6 rounded-2xl flex items-center gap-4">
                    <div className="bg-destructive/10 p-2 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-destructive tracking-tight">Compilation Halted</p>
                      <p className="text-xs text-destructive/70 font-medium">Detected {errors.length} logical inconsistencies.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="font-headline font-extrabold text-lg flex items-center gap-2 text-primary/80">
                        Detailed Insights
                        <span className="text-muted-foreground/30 font-thin">/</span>
                        <span className="text-sm text-muted-foreground font-medium">{errors.length}</span>
                      </h3>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      {errors.map((error, idx) => {
                        const enhanced = aiAnalysis?.enhancedErrors.find(
                          ae => ae.line === error.line && ae.originalMessage === error.message
                        );

                        return (
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
                                  <span className="font-bold text-sm tracking-tight text-foreground/80 line-clamp-1">{error.message}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-data-[state=open]:rotate-90" />
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 space-y-6">
                              <div className="flex gap-4">
                                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none font-bold text-[10px]">
                                  {error.type.toUpperCase()} ERROR
                                </Badge>
                                <Badge className="bg-primary/5 text-primary border-none font-bold text-[10px] hover:bg-primary/10">
                                  AUTO-RECOVERED
                                </Badge>
                              </div>

                              {enhanced ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-primary/80">
                                      <Sparkles className="h-4 w-4 text-secondary" />
                                      <h4 className="font-headline font-bold text-sm uppercase tracking-wide">Contextual Explanation</h4>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                      {enhanced.explanation}
                                    </p>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-muted/30 p-4 rounded-xl space-y-2 border border-muted-foreground/5">
                                      <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Potential Root Causes</h5>
                                      <ul className="space-y-1.5">
                                        {enhanced.potentialCauses.map((cause, cIdx) => (
                                          <li key={cIdx} className="text-xs text-foreground/70 font-semibold flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-primary/30" />
                                            {cause}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    <div className="bg-secondary/5 p-4 rounded-xl space-y-2 border border-secondary/10">
                                      <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-secondary/70">Actionable Fixes</h5>
                                      <ul className="space-y-1.5">
                                        {enhanced.suggestions.map((sug, sIdx) => (
                                          <li key={sIdx} className="text-xs text-foreground/70 font-semibold flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-secondary/30" />
                                            {sug}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-3 py-10 justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Consulting AI Model</span>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                </div>
              )}
              <div ref={scrollAnchorRef} className="h-px w-full" />
            </ScrollArea>
            
            <CardFooter className="bg-white/50 border-t p-4 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2 h-2 rounded-full", status === 'idle' ? 'bg-muted' : (errors.filter(e => e.type === 'Lexical').length > 0 ? 'bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.5)]' : 'bg-secondary'))} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Lexical</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2 h-2 rounded-full", status === 'idle' ? 'bg-muted' : (errors.filter(e => e.type === 'Syntax').length > 0 ? 'bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.5)]' : 'bg-secondary'))} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Syntax</span>
                  </div>
               </div>
               <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                 Panic Recovery Active
               </div>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 mt-auto border-t bg-white flex flex-col items-center space-y-4">
        <div className="flex items-center gap-8 opacity-40">
           <span className="text-[10px] font-bold uppercase tracking-widest">Compiler LL(1)</span>
           <div className="h-1 w-1 rounded-full bg-muted-foreground" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Recursive Descent</span>
           <div className="h-1 w-1 rounded-full bg-muted-foreground" />
           <span className="text-[10px] font-bold uppercase tracking-widest">AI Core v2.0</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
          SyntaxSculptor &bull; Engineered for Education
        </p>
      </footer>
    </div>
  );
}