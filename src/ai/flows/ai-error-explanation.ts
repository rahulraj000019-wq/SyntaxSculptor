'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating AI-enhanced explanations for compiler errors.
 * It takes a list of compiler errors and the source code, then uses a large language model to provide
 * clear explanations, potential causes, and actionable suggestions for each error.
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
  prompt: `You are an expert compiler diagnostics assistant for a simplified C-like language.
Your task is to analyze compiler errors and provide clear, actionable explanations, potential causes, and suggestions for fixing them.
The goal is to help students learn and understand their mistakes without being overwhelmed by technical jargon.

Here is the full source code that generated the errors:
\`\`\`c
{{{sourceCode}}}
\`\`\`

Here are the detected compiler errors:
{{#each compilerErrors}}
- Type: {{{type}}}, Line: {{{line}}}, Message: "{{{message}}}"
{{/each}}

Please provide an enhanced explanation for each error in a JSON array format, following the structure of the \`enhancedErrors\` field in the \`AIErrorExplanationOutputSchema\`.
For each error, include:
- \`originalMessage\`: The exact message reported by the compiler.
- \`line\`: The line number where the error occurred.
- \`type\`: The type of error (Lexical or Syntax).
- \`explanation\`: A clear, concise explanation of what the error means in simple terms.
- \`potentialCauses\`: A list of 2-3 common reasons why this specific error might appear.
- \`suggestions\`: A list of 2-3 specific, actionable steps a student can take to resolve this error.

Ensure the output is a valid JSON object.`,
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
