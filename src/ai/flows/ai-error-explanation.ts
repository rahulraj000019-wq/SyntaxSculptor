'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating AI-enhanced explanations for compiler errors.
 * It takes a list of compiler errors and the source code, then uses a large language model to provide
 * clear, pedagogical explanations, potential causes, and actionable suggestions for each error.
 *
 * - explainCompilerErrors - A function that triggers the AI error explanation process.
 * - AIErrorExplanationInput - The input type for the explainCompilerErrors function.
 * - AIErrorExplanationOutput - The return type for the explainCompilerErrors function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CompilerErrorSchema = z.object({
  message: z.string().describe('The raw error message from the compiler.'),
  line: z.number().describe('The line number where the error occurred.'),
  type: z.enum(['Lexical', 'Syntax']).describe('The type of error (Lexical or Syntax).'),
});

const AIErrorExplanationInputSchema = z.object({
  sourceCode: z.string().describe('The full source code provided by the user.'),
  compilerErrors: z.array(CompilerErrorSchema).describe('A list of detected compiler errors.'),
});

export type AIErrorExplanationInput = z.infer<typeof AIErrorExplanationInputSchema>;

const EnhancedErrorExplanationSchema = z.object({
  originalMessage: z.string().describe('The raw error message as reported by the compiler.'),
  line: z.number().describe('The line number associated with the original error.'),
  type: z.enum(['Lexical', 'Syntax']).describe('The type of error (Lexical or Syntax).'),
  explanation: z.string().describe('A clear, user-friendly explanation of the error.'),
  potentialCauses: z.array(z.string()).describe('A list of common reasons why this error might occur.'),
  suggestions: z.array(z.string()).describe('Actionable steps to fix the error.'),
});

const AIErrorExplanationOutputSchema = z.object({
  enhancedErrors: z.array(EnhancedErrorExplanationSchema).describe('A list of enhanced error explanations.'),
});

export type AIErrorExplanationOutput = z.infer<typeof AIErrorExplanationOutputSchema>;

export async function explainCompilerErrors(input: AIErrorExplanationInput): Promise<AIErrorExplanationOutput> {
  return aiErrorExplanationFlow(input);
}

const aiErrorExplanationPrompt = ai.definePrompt({
  name: 'aiErrorExplanationPrompt',
  input: { schema: AIErrorExplanationInputSchema },
  output: { schema: AIErrorExplanationOutputSchema },
  prompt: `You are an expert compiler diagnostics assistant and pedagogical mentor for a simplified C-like language.
Your task is to analyze compiler errors (Lexical or Syntax) within a specific source code context and provide clear, empathetic, and highly actionable explanations.

The language rules are:
- Types: only 'int' is supported.
- Keywords: 'int', 'if', 'while'.
- Operators: '=', '+', '-'.
- Symbols: '(', ')', '{', '}', ';'.
- Syntax: Statements must end with ';'. Control flow uses '{' and '}'. Expressions are simple infix arithmetic.

Goal: Help students understand exactly WHY their code is wrong and HOW to fix it, referring specifically to their code's content and variable names.

Source Code:
\`\`\`c
{{{sourceCode}}}
\`\`\`

Detected Compiler Errors:
{{#each compilerErrors}}
- Type: {{{type}}}, Line: {{{line}}}, Message: "{{{message}}}"
{{/each}}

For each error, generate an entry in the \`enhancedErrors\` array:
- \`originalMessage\`: The exact message from the compiler.
- \`line\`: The line number of the error.
- \`type\`: Lexical or Syntax.
- \`explanation\`: Pinpoint the exact mistake. Reference the identifiers or operators on that line. Explain the concept (e.g., "The compiler expected a semicolon to finish the previous thought before seeing this new name").
- \`potentialCauses\`: List 2-3 distinct conceptual mistakes (e.g., "Forgotten semicolon", "Incomplete expression", "Mismatched braces").
- \`suggestions\`: Provide specific code snippets showing how to fix it based on the user's actual variables. Use a format like "Change \`line context\` to \`fixed code\`".

Ensure the output is valid JSON.`,
});

const aiErrorExplanationFlow = ai.defineFlow(
  {
    name: 'aiErrorExplanationFlow',
    inputSchema: AIErrorExplanationInputSchema,
    outputSchema: AIErrorExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await aiErrorExplanationPrompt(input);
    return output!;
  }
);
