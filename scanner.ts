import { TokenType } from './token-type.ts';
import { Token } from './token.ts';

export class Scanner {
  private source;
  private position = 0;
  private start = 0;
  private line = 1;
  private tokens: Token[] = [];
  private keywords = new Map<string, TokenType>([
    ['true', TokenType.TRUE],
    ['false', TokenType.FALSE],
    ['null', TokenType.NULL],
  ]);

  constructor(source: string) {
    this.source = source;
  }

  private isAtEnd() {
    return this.position >= this.source.length;
  }

  private getCharacter() {
    return this.source.charAt(this.position++);
  }

  private peek() {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.position);
  }

  private string() {
    let next = this.getCharacter();

    while (next !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
      }

      next = this.getCharacter();
    }

    if (next !== '"') {
      throw new Error('unterminated string');
    }

    this.addToken(TokenType.STRING, this.source.substring(this.start + 1, this.position - 1));
  }

  private addToken(token_type: TokenType, literal?: null | boolean | number | string) {
    const text = this.source.substring(this.start, this.position);
    this.tokens.push(new Token(token_type, this.line, text, literal));
  }

  private value() {
    while (!this.isAtEnd()) {
      this.getCharacter();

      const value = this.source.substring(this.start, this.position);

      // FIXME: we would need to determine if we have n
      if (this.keywords.has(value)) {
        const token_type = this.keywords.get(value);

        switch (token_type) {
          case TokenType.TRUE:
            this.addToken(token_type, true);
            break;
          case TokenType.FALSE:
            this.addToken(token_type, false);
            break;
          case TokenType.NULL:
            this.addToken(token_type, null);
            break;
        }

        break;
      }
    }
  }

  private isDigit(char: string) {
    return char >= '0' && char <= '9';
  }

  private number() {
    while (this.isDigit(this.peek())) {
      this.getCharacter();
    }

    if (this.peek() === '.') {
      this.getCharacter();

      while (this.isDigit(this.peek())) {
        this.getCharacter();
      }
    }

    this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.position)));
  }

  public scan() {
    while (!this.isAtEnd()) {
      this.start = this.position;
      const current = this.getCharacter();

      switch (current) {
        case TokenType.LEFT_BRACE:
          this.addToken(TokenType.LEFT_BRACE);
          break;
        case TokenType.RIGHT_BRACE:
          this.addToken(TokenType.RIGHT_BRACE);
          break;
        case TokenType.RIGHT_BRACKET:
          this.addToken(TokenType.RIGHT_BRACKET);
          break;
        case TokenType.LEFT_BRACKET:
          this.addToken(TokenType.LEFT_BRACKET);
          break;
        case TokenType.COLON:
          this.addToken(TokenType.COLON);
          break;
        case TokenType.COMMA:
          this.addToken(TokenType.COMMA);
          break;
        case 'n':
        case 'f':
        case 't':
          this.value();
          break;
        case '"':
          this.string();
          break;
        case ' ':
        case '\r':
        case '\t':
          // Ignore whitespace.
          break;
        case '\n':
          this.line++;
          break;
        default:
          if (this.isDigit(current)) {
            this.number();
          } else {
            throw new Error(
              `unexpected token ${current} on line ${this.line} - position ${this.position}`
            );
          }
      }
    }

    this.tokens.push(new Token(TokenType.EOF, this.line));

    return this.tokens;
  }
  // returns an array of tokens
  // if token does not belong in sequence throws syntax error
}
