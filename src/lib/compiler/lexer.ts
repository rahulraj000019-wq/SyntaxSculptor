/**
 * @fileOverview Lexical Analyzer (Scanner)
 * This module converts raw C source code into a stream of tokens.
 * It handles keywords, identifiers, numbers, operators, and preprocessor symbols.
 */

export type TokenType =
  | 'INT' | 'FLOAT' | 'DOUBLE' | 'CHAR' | 'VOID'
  | 'IF' | 'ELSE' | 'WHILE' | 'FOR' | 'RETURN'
  | 'INCLUDE' | 'PREPROCESSOR' // #include, #define
  | 'ID' | 'NUMBER' | 'STRING'
  | 'ASSIGN' | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'PERCENT'
  | 'LPAREN' | 'RPAREN' | 'LBRACE' | 'RBRACE' | 'LBRACKET' | 'RBRACKET'
  | 'SEMICOLON' | 'COMMA' | 'DOT' | 'ARROW'
  | 'EOF' | 'INVALID';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}

export interface LexicalError {
  message: string;
  line: number;
  type: 'Lexical';
}

export class Lexer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private errors: LexicalError[] = [];

  constructor(input: string) {
    this.input = input;
  }

  getErrors() {
    return this.errors;
  }

  nextToken(): Token {
    this.skipWhitespaceAndComments();

    if (this.pos >= this.input.length) {
      return { type: 'EOF', value: '', line: this.line };
    }

    const char = this.input[this.pos];

    // Preprocessor directives
    if (char === '#') {
      this.pos++;
      let value = '#';
      while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
        value += this.input[this.pos++];
      }
      return { type: 'PREPROCESSOR', value, line: this.line };
    }

    // Strings
    if (char === '"') {
      return this.readString();
    }

    // Numbers
    if (this.isDigit(char)) return this.readNumber();
    
    // Identifiers and Keywords
    if (this.isAlpha(char)) return this.readIdentifierOrKeyword();

    this.pos++;
    switch (char) {
      case '=': return { type: 'ASSIGN', value: '=', line: this.line };
      case '+': return { type: 'PLUS', value: '+', line: this.line };
      case '-': 
        if (this.input[this.pos] === '>') {
          this.pos++;
          return { type: 'ARROW', value: '->', line: this.line };
        }
        return { type: 'MINUS', value: '-', line: this.line };
      case '*': return { type: 'STAR', value: '*', line: this.line };
      case '/': return { type: 'SLASH', value: '/', line: this.line };
      case '(': return { type: 'LPAREN', value: '(', line: this.line };
      case ')': return { type: 'RPAREN', value: ')', line: this.line };
      case '{': return { type: 'LBRACE', value: '{', line: this.line };
      case '}': return { type: 'RBRACE', value: '}', line: this.line };
      case '[': return { type: 'LBRACKET', value: '[', line: this.line };
      case ']': return { type: 'RBRACKET', value: ']', line: this.line };
      case ';': return { type: 'SEMICOLON', value: ';', line: this.line };
      case ',': return { type: 'COMMA', value: ',', line: this.line };
      case '.': return { type: 'DOT', value: '.', line: this.line };
      default:
        const errChar = char;
        this.errors.push({
          type: 'Lexical',
          line: this.line,
          message: `Unexpected symbol: '${errChar}'`,
        });
        return { type: 'INVALID', value: errChar, line: this.line };
    }
  }

  private skipWhitespaceAndComments() {
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      if (char === '\n') {
        this.line++;
        this.pos++;
      } else if (/\s/.test(char)) {
        this.pos++;
      } else if (char === '/' && this.input[this.pos + 1] === '/') {
        // Single line comment
        while (this.pos < this.input.length && this.input[this.pos] !== '\n') this.pos++;
      } else if (char === '/' && this.input[this.pos + 1] === '*') {
        // Block comment
        this.pos += 2;
        while (this.pos < this.input.length && !(this.input[this.pos] === '*' && this.input[this.pos+1] === '/')) {
          if (this.input[this.pos] === '\n') this.line++;
          this.pos++;
        }
        this.pos += 2;
      } else {
        break;
      }
    }
  }

  private readString(): Token {
    this.pos++; // skip "
    let value = '';
    while (this.pos < this.input.length && this.input[this.pos] !== '"') {
      if (this.input[this.pos] === '\\') { // handle escape
        value += this.input[this.pos++];
      }
      value += this.input[this.pos++];
    }
    this.pos++; // skip "
    return { type: 'STRING', value: `"${value}"`, line: this.line };
  }

  private readNumber(): Token {
    let value = '';
    while (this.pos < this.input.length && (this.isDigit(this.input[this.pos]) || this.input[this.pos] === '.')) {
      value += this.input[this.pos++];
    }
    return { type: 'NUMBER', value, line: this.line };
  }

  private readIdentifierOrKeyword(): Token {
    let value = '';
    while (this.pos < this.input.length && (this.isAlpha(this.input[this.pos]) || this.isDigit(this.input[this.pos]))) {
      value += this.input[this.pos++];
    }

    const keywords: Record<string, TokenType> = {
      'int': 'INT', 'float': 'FLOAT', 'double': 'DOUBLE', 'char': 'CHAR', 'void': 'VOID',
      'if': 'IF', 'else': 'ELSE', 'while': 'WHILE', 'for': 'FOR', 'return': 'RETURN'
    };

    return { type: keywords[value] || 'ID', value, line: this.line };
  }

  private isDigit(char: string) { return char >= '0' && char <= '9'; }
  private isAlpha(char: string) { return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_'; }
}
