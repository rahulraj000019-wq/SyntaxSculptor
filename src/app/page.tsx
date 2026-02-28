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
  BookOpen
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

  // Automatically scroll to the bottom of the diagnostics panel when compilation finishes or AI analysis updates
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

    // Artificial delay for UX "compiling" feedback
    await new Promise(resolve => setTimeout(resolve, 600));

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
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary/30">
      {/* Navbar */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Code2 className="text-primary-foreground h-6 w-6" />
          </div>
          <div>
            <h1 className="font-headline text-xl font-bold tracking-tight text-primary">SyntaxSculptor</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Educational Mini Compiler</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="gap-2">
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
          <Button onClick={handleCompile} disabled={isCompiling} className="gap-2 shadow-sm">
            {isCompiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            Compile
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden max-h-[calc(100vh-80px)]">
        
        {/* Code Editor Panel */}
        <Card className="flex flex-col overflow-hidden border-2 border-border/50 shadow-lg">
          <CardHeader className="bg-muted/30 py-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-headline uppercase tracking-widest text-muted-foreground">Source Code Input</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-code text-[10px]">C-LIKE LL(1)</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative">
            <textarea
              className="w-full h-full p-6 code-editor bg-card text-foreground focus:outline-none resize-none text-base leading-relaxed"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Write your C-like code here..."
            />
          </CardContent>
        </Card>

        {/* Diagnostic Panel */}
        <Card className="flex flex-col overflow-hidden border-2 border-border/50 shadow-lg bg-card/80">
          <CardHeader className="bg-muted/30 py-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-headline uppercase tracking-widest text-muted-foreground">Diagnostics Panel</CardTitle>
            </div>
            {status !== 'idle' && (
              <Badge variant={status === 'success' ? 'default' : 'destructive'} className="animate-in fade-in zoom-in duration-300">
                {status === 'success' ? 'Compilation Successful' : `Found ${errors.length} Error${errors.length > 1 ? 's' : ''}`}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              {status === 'idle' && !isCompiling && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 opacity-60">
                  <div className="bg-muted p-4 rounded-full">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-headline font-semibold">Ready to parse</p>
                    <p className="text-sm text-muted-foreground max-w-xs">Enter your code and click compile to start the analysis.</p>
                  </div>
                </div>
              )}

              {isCompiling && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="font-headline font-medium animate-pulse">Running Lexical & Syntax analysis...</p>
                </div>
              )}

              {status === 'success' && (
                <div className="bg-secondary/10 border border-secondary/20 p-6 rounded-xl space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-secondary" />
                    <div>
                      <h3 className="font-headline font-bold text-lg">Build Success</h3>
                      <p className="text-sm text-muted-foreground">No lexical or syntax errors were found in the provided code.</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-headline font-bold uppercase tracking-widest text-muted-foreground">Summary</p>
                    <ul className="text-sm space-y-1 text-foreground/80 font-medium">
                      <li className="flex justify-between"><span>Grammar:</span> <span className="font-code">LL(1) Recursive Descent</span></li>
                      <li className="flex justify-between"><span>Recovery Mode:</span> <span className="font-code">Panic Mode Active</span></li>
                    </ul>
                  </div>
                </div>
              )}

              {status === 'failed' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <p className="text-sm font-medium text-destructive">Compilation failed. See details below.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-headline font-bold flex items-center gap-2">
                      Structured Report
                      <Badge variant="outline" className="text-[10px]">{errors.length}</Badge>
                    </h3>
                    
                    <Accordion type="single" collapsible className="w-full space-y-3">
                      {errors.map((error, idx) => {
                        const enhanced = aiAnalysis?.enhancedErrors.find(
                          ae => ae.line === error.line && ae.originalMessage === error.message
                        );

                        return (
                          <AccordionItem 
                            key={idx} 
                            value={`error-${idx}`}
                            className="border rounded-xl bg-card px-4"
                          >
                            <AccordionTrigger className="hover:no-underline py-4">
                              <div className="flex items-center gap-4 text-left">
                                <span className="bg-muted px-2 py-1 rounded text-xs font-code font-bold">Line {error.line}</span>
                                <span className="font-medium text-sm line-clamp-1">{error.message}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 space-y-4 border-t pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground mb-1">Error Type</p>
                                  <Badge variant="outline">{error.type}</Badge>
                                </div>
                                <div>
                                  <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                                  <Badge className="bg-yellow-500 hover:bg-yellow-600">Recovered (Panic Mode)</Badge>
                                </div>
                              </div>

                              {enhanced ? (
                                <div className="bg-primary/5 rounded-lg p-4 space-y-3 border border-primary/10">
                                  <div className="flex items-center gap-2 text-primary">
                                    <Info className="h-4 w-4" />
                                    <h4 className="font-headline font-bold text-sm">AI Explanation</h4>
                                  </div>
                                  <p className="text-sm text-foreground/90 leading-relaxed">{enhanced.explanation}</p>
                                  
                                  <div className="space-y-2">
                                    <h5 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">Potential Causes</h5>
                                    <ul className="text-xs space-y-1 list-disc list-inside text-foreground/80">
                                      {enhanced.potentialCauses.map((cause, cIdx) => <li key={cIdx}>{cause}</li>)}
                                    </ul>
                                  </div>

                                  <div className="space-y-2">
                                    <h5 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">Suggestions</h5>
                                    <ul className="text-xs space-y-1 list-disc list-inside text-foreground/80">
                                      {enhanced.suggestions.map((sug, sIdx) => <li key={sIdx}>{sug}</li>)}
                                    </ul>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center animate-pulse">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-xs font-medium">Fetching AI enhanced diagnosis...</span>
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
              {/* Invisible anchor used for auto-scrolling */}
              <div ref={scrollAnchorRef} className="h-px w-full" />
            </ScrollArea>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t p-3">
             <div className="flex items-center gap-6 text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  Lexical: {status === 'idle' ? '-' : (errors.filter(e => e.type === 'Lexical').length > 0 ? 'Errors Detected' : 'Clean')}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Syntax: {status === 'idle' ? '-' : (errors.filter(e => e.type === 'Syntax').length > 0 ? 'Errors Detected' : 'Clean')}
                </div>
             </div>
          </CardFooter>
        </Card>
      </main>

      {/* Footer Info */}
      <footer className="p-4 bg-muted/20 border-t text-center">
        <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">
          Built for Educational Purposes &bull; LL(1) Recursive Descent &bull; Panic Mode Recovery &bull; AI Diagnostics
        </p>
      </footer>
    </div>
  );
}
