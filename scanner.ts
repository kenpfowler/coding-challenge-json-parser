import { JsonParser } from './main.ts';
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

  // this method should throw error in the following cases
  // [ "line\\\nbreak" ]
  // [ "tab\\   character\\   in\\  string\\  " ]
  // [ "line\nbreak" ]
  // [ "Illegal backslash escape: \\x15" ]
  // [ "\ttab\tcharacter\tin\tstring\t" ]
  // [ "Illegal backslash escape: \\017" ]
  private escape(char: string) {
    if (this.unicode(char)) {
      this.advance();
      return;
    }

    if (char === '\n') {
      JsonParser.reportError(this.line, this.current, `Unexpected line break in string '${char}'`);
    }

    // Check for tab characters within the string
    if (char === '\t') {
      JsonParser.reportError(this.line, this.current, 'Unexpected tab character in string');
    }

    if (char === '\\') {
      // Check for illegal backslash escapes
      const nextChar = this.peekNext();

      // Illegal escape sequences such as \x and octal \0XX
      if (nextChar === 'x' || (nextChar >= '0' && nextChar <= '7')) {
        JsonParser.reportError(
          this.line,
          this.current,
          `llegal backslash escape: \\${nextChar} ${this.source.substring(
            this.start - 10,
            this.current + 30
          )}`
        );
      }
      this.advance();
    }
  }

  private unicode(char: string) {
    const unicodeRegex = /\\u[0-9A-Fa-f]{4}/g;
    const matches = char.match(unicodeRegex);

    return matches;
  }

  private string() {
    console.log(this.source.charAt(this.current));
    // while we're scanning the string we need to search for escape characters within the string.

    // the backslash char indicates the start of an escape sequence '\'
    // if only one backslash is present without an escape char this is syntax error
    // this begs the question what is a vaild escape character.

    // Double Quote (\") - Inserts a double-quote character inside a double-quoted string.
    // Single Quote (\') - Inserts a single-quote character inside a single-quoted string.
    // Backslash (\\) - Inserts a literal backslash.
    // Newline (\n) - Inserts a new line.
    // Carriage Return (\r) - Moves the cursor to the beginning of the line (often used with \n for new lines on some systems).
    // Tab (\t) - Inserts a horizontal tab.
    // Null Character (\0) - Represents the null character, often used as a string terminator in some languages (in JavaScript, the string continues after it).
    // Unicode (\uXXXX) - Inserts a Unicode character, where XXXX is the four-digit hexadecimal code.

    // UNCOMMON
    // Backspace (\b) - Moves the cursor back one position (rarely used in modern applications).
    // Form Feed (\f) - Advances the cursor to the next page (not commonly used).
    // Vertical Tab (\v) - Moves the cursor down to the next vertical tab stop (rarely used).

    while (this.advance() !== '"' && !this.isAtEnd()) {
      const char = this.source.charAt(this.current - 1);
      // prettier-ignore
      const escapes = ['\"', "\'", '\\', '\n', "\r", "\t", "\0", "\b", "\f", "\v" ];

      // if the char is a valid escape character we match them until we run out
      if (escapes.includes(char)) {
        this.escape(char);
      }
    }

    this.addToken(TokenType.STRING, this.source.substring(this.start + 1, this.current - 1));
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
