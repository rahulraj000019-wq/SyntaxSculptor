import { Lexer, Token, TokenType } from './lexer';

export interface SyntaxError {
  message: string;
  line: number;
  type: 'Syntax';
}

export class Parser {
  private lexer: Lexer;
  private currentToken: Token;
  private errors: SyntaxError[] = [];

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.nextToken();
  }

  getErrors() {
    return this.errors;
  }

  parse() {
    this.program();
    return this.errors;
  }

  private consume() {
    this.currentToken = this.lexer.nextToken();
  }

  private match(expected: TokenType) {
    if (this.currentToken.type === expected) {
      this.consume();
      return true;
    } else {
      const found = this.currentToken.type === 'EOF' ? 'end of file' : `'${this.currentToken.value}'`;
      this.error(`Expected '${expected}', but found ${found}`);
      return false;
    }
  }

  private error(message: string) {
    this.errors.push({
      type: 'Syntax',
      line: this.currentToken.line,
      message,
    });
    this.panicMode();
  }

  private panicMode() {
    // Skip tokens until we find a synchronization point: ; } or EOF
    while (
      this.currentToken.type !== 'SEMICOLON' &&
      this.currentToken.type !== 'RBRACE' &&
      this.currentToken.type !== 'EOF'
    ) {
      this.consume();
    }
    // Optionally consume the synchronizing token if it's a semicolon to move past the statement
    if (this.currentToken.type === 'SEMICOLON') {
      this.consume();
    }
  }

  // Program -> StatementList
  private program() {
    this.statementList();
    if (this.currentToken.type !== 'EOF') {
      this.errors.push({
        type: 'Syntax',
        line: this.currentToken.line,
        message: `Unexpected token '${this.currentToken.value}' after program end`,
      });
    }
  }

  // StatementList -> Statement StatementList | ε
  private statementList() {
    while (
      this.currentToken.type === 'INT' ||
      this.currentToken.type === 'ID' ||
      this.currentToken.type === 'IF' ||
      this.currentToken.type === 'WHILE'
    ) {
      this.statement();
    }
  }

  // Statement -> Declaration | Assignment | IfStmt | WhileStmt
  private statement() {
    switch (this.currentToken.type) {
      case 'INT':
        this.declaration();
        break;
      case 'ID':
        this.assignment();
        break;
      case 'IF':
        this.ifStmt();
        break;
      case 'WHILE':
        this.whileStmt();
        break;
      default:
        this.error("Invalid start of statement");
    }
  }

  // Declaration -> 'int' id ';'
  private declaration() {
    this.match('INT');
    this.match('ID');
    this.match('SEMICOLON');
  }

  // Assignment -> id '=' Expression ';'
  private assignment() {
    this.match('ID');
    this.match('ASSIGN');
    this.expression();
    this.match('SEMICOLON');
  }

  // IfStmt -> 'if' '(' Expression ')' '{' StatementList '}'
  private ifStmt() {
    this.match('IF');
    this.match('LPAREN');
    this.expression();
    this.match('RPAREN');
    this.match('LBRACE');
    this.statementList();
    this.match('RBRACE');
  }

  // WhileStmt -> 'while' '(' Expression ')' '{' StatementList '}'
  private whileStmt() {
    this.match('WHILE');
    this.match('LPAREN');
    this.expression();
    this.match('RPAREN');
    this.match('LBRACE');
    this.statementList();
    this.match('RBRACE');
  }

  // Expression -> Term Expression'
  private expression() {
    this.term();
    this.expressionPrime();
  }

  // Expression' -> '+' Term Expression' | '-' Term Expression' | ε
  private expressionPrime() {
    if (this.currentToken.type === 'PLUS' || this.currentToken.type === 'MINUS') {
      this.consume();
      this.term();
      this.expressionPrime();
    }
  }

  // Term -> id | number
  private term() {
    if (this.currentToken.type === 'ID' || this.currentToken.type === 'NUMBER') {
      this.consume();
    } else {
      const found = this.currentToken.type === 'EOF' ? 'end of file' : `'${this.currentToken.value}'`;
      this.error(`Expected identifier or number, but found ${found}`);
    }
  }
}
