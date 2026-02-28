export type TokenType =
  | 'INT'
  | 'IF'
  | 'WHILE'
  | 'ID'
  | 'NUMBER'
  | 'ASSIGN'
  | 'PLUS'
  | 'MINUS'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACE'
  | 'RBRACE'
  | 'SEMICOLON'
  | 'EOF'
  | 'INVALID';

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
    this.skipWhitespace();

    if (this.pos >= this.input.length) {
      return { type: 'EOF', value: '', line: this.line };
    }

    const char = this.input[this.pos];

    if (this.isDigit(char)) return this.readNumber();
    if (this.isAlpha(char)) return this.readIdentifierOrKeyword();

    this.pos++;
    switch (char) {
      case '=': return { type: 'ASSIGN', value: '=', line: this.line };
      case '+': return { type: 'PLUS', value: '+', line: this.line };
      case '-': return { type: 'MINUS', value: '-', line: this.line };
      case '(': return { type: 'LPAREN', value: '(', line: this.line };
      case ')': return { type: 'RPAREN', value: ')', line: this.line };
      case '{': return { type: 'LBRACE', value: '{', line: this.line };
      case '}': return { type: 'RBRACE', value: '}', line: this.line };
      case ';': return { type: 'SEMICOLON', value: ';', line: this.line };
      default:
        this.errors.push({
          type: 'Lexical',
          line: this.line,
          message: `Invalid character '${char}'`,
        });
        return { type: 'INVALID', value: char, line: this.line };
    }
  }

  private skipWhitespace() {
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      if (char === '\n') {
        this.line++;
        this.pos++;
      } else if (/\s/.test(char)) {
        this.pos++;
      } else {
        break;
      }
    }
  }

  private readNumber(): Token {
    let value = '';
    while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
      value += this.input[this.pos++];
    }
    return { type: 'NUMBER', value, line: this.line };
  }

  private readIdentifierOrKeyword(): Token {
    let value = '';
    while (this.pos < this.input.length && (this.isAlpha(this.input[this.pos]) || this.isDigit(this.input[this.pos]))) {
      value += this.input[this.pos++];
    }

    if (value === 'int') return { type: 'INT', value, line: this.line };
    if (value === 'if') return { type: 'IF', value, line: this.line };
    if (value === 'while') return { type: 'WHILE', value, line: this.line };

    return { type: 'ID', value, line: this.line };
  }

  private isDigit(char: string) {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string) {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }
}
