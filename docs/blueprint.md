# **App Name**: SyntaxSculptor

## Core Features:

- Interactive Code Editor: Allow users to input C-like source code within a multi-line editor environment.
- Lexical Analysis Engine: Tokenize the input code, identify keywords, identifiers, numbers, operators, and detect invalid characters and malformed identifiers.
- Syntax Analysis Engine: Implement a recursive descent parser (LL(1)) to validate the grammatical structure of the simplified C-like language and detect syntax errors.
- Panic-Mode Error Recovery: Automatically apply panic-mode error recovery, skipping tokens until a synchronization point (like ';', '}', or EOF) to allow continuous parsing after an error is detected.
- AI-Enhanced Error Explainer: A generative AI tool that provides clear, actionable explanations for detected lexical and syntax errors, including potential causes and suggestions, mimicking real-world compiler diagnostics for better learning.
- Structured Diagnostic Display: Present a comprehensive diagnostic report, including total error count, line-wise structured error messages with descriptions, and overall compilation status in a user-friendly format.
- Compilation Flow Controls: Provide user interface elements (buttons) to initiate the compilation process, clear the code editor, and reset the diagnostic output.

## Style Guidelines:

- Primary color: A thoughtful, academic blue (#1F5999), reflecting clarity, precision, and intellectual focus.
- Background color: A clean, desaturated light blue-grey (#ECF0F2), providing a calm and highly readable canvas for code and textual diagnostics.
- Accent color: A clear, slightly cool blue-green (#2EAAA9), chosen for its analogous relation to the primary color, used to highlight successful operations, interactive elements, and focused areas within the UI.
- Headline font: 'Space Grotesk' (sans-serif), for a modern, tech-inspired feel suitable for titles and section headings, emphasizing the system's analytical nature.
- Body text font: 'Inter' (sans-serif), ensuring excellent readability for all textual content, especially for detailed error messages and explanations, promoting clear communication.
- Code font: 'Source Code Pro' (monospace), dedicated to displaying user-inputted code and any diagnostic code snippets, ensuring superior legibility for programmatic content.
- Utilize clean, modern vector icons for primary UI controls (e.g., compile, clear, copy, settings), alongside distinct, easily recognizable symbols for error, warning, and success states within the diagnostic output.
- Employ a structured, split-panel layout: a generously sized, dedicated code editor on one side for user input, and a clear, scrollable diagnostic output panel on the other, with intuitive compilation controls positioned for easy access.
- Implement subtle, functional animations such as a brief loading spinner during the compilation process for status feedback, and smooth transitions when expanding or collapsing detailed error descriptions in the diagnostic panel for an enhanced user experience.