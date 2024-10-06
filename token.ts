import { TokenType } from './token-type.ts';

export class Token {
  public readonly token_type;
  public readonly line;
  public readonly lexeme?;
  public readonly literal?;

  constructor(
    token_type: TokenType,
    line: number,
    lexeme?: string,
    literal?: null | boolean | string | number
  ) {
    this.lexeme = lexeme;
    this.token_type = token_type;
    this.line = line;
    this.literal = literal;
  }

  public toString() {
    return `[type: ${this.token_type}] line: ${this.line}, lexeme: ${this.lexeme}`;
  }
}
