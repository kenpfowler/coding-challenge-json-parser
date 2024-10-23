import { JsonParser } from './main.ts';
import { TokenType } from './token-type.ts';
import { Token } from './token.ts';

export class Scanner {
  private source;
  private current = 0;
  private start = 0;
  private line = 1;
  private tokens: Token[] = [];
  private readonly keywords = new Map<string, TokenType>([
    ['true', TokenType.TRUE],
    ['false', TokenType.FALSE],
    ['null', TokenType.NULL],
  ]);
  /**
   * Double Quote (\") - Inserts a double-quote character inside a double-quoted string.
   * Single Quote (\') - Inserts a single-quote character inside a single-quoted string.
   * Backslash (\\) - Inserts a literal backslash.
   * Newline (\n) - Inserts a new line.
   * Carriage Return (\r) - Moves the cursor to the beginning of the line (often used with \n for new lines on some systems).
   * Tab (\t) - Inserts a horizontal tab.
   * Null Character (\0) - Represents the null character, often used as a string terminator in some languages (in JavaScript, the string continues after it).
   * Unicode (\uXXXX) - Inserts a Unicode character, where XXXX is the four-digit hexadecimal code.

    UNCOMMON
   * Backspace (\b) - Moves the cursor back one position (rarely used in modern applications).
   * Form Feed (\f) - Advances the cursor to the next page (not commonly used).
   * Vertical Tab (\v) - Moves the cursor down to the next vertical tab stop (rarely used).
   */
  // prettier-ignore

  // prettier-ignore
  private readonly escapes = ["\"", '\\', "\/", 'n', 'r', 't', 'b', "f"];
  private readonly unicodeRegex = /[^\u0000-\u007F]/g; // Matches non-ASCII characters

  constructor(source: string) {
    this.source = source;
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
          this.matchValue(TokenType.NULL);
          break;
        case 'f':
          this.matchValue(TokenType.FALSE);
          break;
        case 't':
          this.matchValue(TokenType.TRUE);
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
          // capture characters matching digits 0-9 or symbols (+, -)
          if (this.isSymbol(current) || this.isDigit(current)) {
            // fail if a symbol is found, but no digit follows
            if (this.isSymbol(current) && !this.isDigit(this.peek())) {
              JsonParser.reportError(this.line, this.current, `expected digit after symbol'`);
            }

            // fail if number will have leading zero
            if (this.isZero(current) && (this.peek() !== '.' || !this.isExponent(this.peek()))) {
              if (this.isDigit(this.peek())) {
                JsonParser.reportError(this.line, this.current, `leading zero is invalid'`);
              }
            }

            this.number();
          } else {
            JsonParser.reportError(this.line, this.current, `unexpected token '${current}'`);
          }
      }
    }

    this.tokens.push(new Token(TokenType.EOF, this.line));

    return this.tokens;
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

  private peekNext() {
    return this.source.charAt(this.current + 2);
  }

  private isZero(char: string) {
    return char === '0';
  }

  private escape() {
    const escapeChar = this.source.charAt(this.current);

    switch (escapeChar) {
      // prettier-ignore
      case '\"':
      // prettier-ignore
      case '\/':
      case '\\':
      case 'b':
      case 'f':
      case 'n':
      case 'r':
      case 't':
        this.advance();
        break;
      case 'u':
        this.unicode();
        break;
      default:
        // Handle invalid escape sequence (optional)
        throw new Error(`Invalid escape sequence: \\${escapeChar}`);
    }
  }

  private unicode() {
    this.advance();

    const hex = this.source.substring(this.current, this.current + 4);

    if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
      throw new Error(`Invalid Unicode escape sequence: \\u${hex}`);
    }
    this.current += 4;
  }

  private string() {
    while (this.advance() !== '"' && !this.isAtEnd()) {
      const char = this.source.charAt(this.current - 1);

      if (char === '\t') {
        throw new Error('illegal tab character in string');
      }

      if (char === '\n') {
        throw new Error('illegal line break character in string');
      }

      // if the char is a valid escape character we match them until we run out
      if (char === '\\') {
        this.escape();
      }
    }

    this.addToken(
      TokenType.STRING,
      this.source
        .substring(this.start + 1, this.current - 1)
        .replace(/\\u([A-Fa-f0-9]{4})/g, (_match, unicodeChar) => {
          return String.fromCharCode(parseInt(unicodeChar, 16));
        })
        .replace(/\\\\/g, '\\') // Double backslashes
        .replace(/\\\//g, '/') // Escaped forward slash
        .replace(/\\"/g, '"') // Escaped double quote
        .replace(/\\b/g, '\b') // Backspace
        .replace(/\\f/g, '\f') // Form feed
        .replace(/\\n/g, '\n') // Newline
        .replace(/\\r/g, '\r') // Carriage return
        .replace(/\\t/g, '\t') // Tab
    );
  }

  private addToken(token_type: TokenType, literal?: null | boolean | number | string) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(token_type, this.line, text, literal));
  }

  private match(char: string, ...token_types: TokenType[]) {
    return token_types.includes(char as TokenType);
  }

  private matchValue(token_type: TokenType) {
    if (!this.keywords.has(this.source.substring(this.start, this.start + token_type.length))) {
      JsonParser.reportError(this.line, this.current, `expected value of ${token_type}`);
    }

    this.current += token_type.length - 1;

    if (
      !this.match(
        this.source[this.current],
        TokenType.COMMA,
        TokenType.RIGHT_BRACE,
        TokenType.RIGHT_BRACKET
      )
    ) {
      JsonParser.reportError(
        this.line,
        this.current,
        `expected comma, right bracket ], or right brace } after value`
      );
    }

    this.addToken(
      token_type,
      token_type === TokenType.TRUE ? true : token_type === TokenType.FALSE ? false : null
    );
  }

  private isSymbol(char: string) {
    return char === '-' || char === '+';
  }

  private isExponent(char: string) {
    return char === 'e' || char === 'E';
  }

  private isDigit(char: string) {
    return char >= '0' && char <= '9';
  }

  private isDigitOneToNine(char: string) {
    return char >= '1' && char <= '9';
  }

  private number() {
    while (this.isDigit(this.peek()) || this.isExponent(this.peek())) {
      if (this.isExponent(this.peek())) {
        this.advance();

        if (this.isSymbol(this.peek())) {
          this.advance();
        }

        if (!this.isDigit(this.peek())) {
          JsonParser.reportError(
            this.line,
            this.current,
            `expected digit '${this.source.charAt(this.current)}'`
          );
        }
      }

      this.advance();
    }

    if (this.peek() === '.') {
      this.advance();

      while (this.isDigit(this.peek()) || this.isExponent(this.peek())) {
        if (this.isExponent(this.peek())) {
          this.advance();

          if (this.isSymbol(this.peek())) {
            this.advance();
          }

          if (!this.isDigit(this.peek())) {
            JsonParser.reportError(
              this.line,
              this.current,
              `expected digit '${this.source.charAt(this.current)}'`
            );
          }
        }

        this.advance();
      }
    }

    this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
  }
}
