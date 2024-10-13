import { TokenType } from './token-type.ts';
import { Token } from './token.ts';

export class Scanner {
  private source;
  private current = 0;
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
    return this.current >= this.source.length;
  }

  private advance() {
    return this.source.charAt(this.current++);
  }

  private peek() {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  private string() {
    while (this.advance() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
      }
    }

    this.addToken(TokenType.STRING, this.source.substring(this.start + 1, this.current - 1));
  }

  private addToken(token_type: TokenType, literal?: null | boolean | number | string) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(token_type, this.line, text, literal));
  }

  private value() {
    while (!this.isAtEnd()) {
      this.advance();

      const value = this.source.substring(this.start, this.current);

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
      this.advance();
    }

    if (this.peek() === '.') {
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
  }

  public scan() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      const current = this.advance();

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
            // first digit cannot be leading zero if there are more digits...
            // if (current === '0' && this.isDigit(this.peek())) {
            //   throw new Error('number cannot have leading zero');
            // }

            this.number();
          } else {
            throw new Error(
              `unexpected token ${current} on line ${this.line} - position ${this.current}`
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
