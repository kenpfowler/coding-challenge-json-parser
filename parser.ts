import { TokenType } from './token-type.ts';
import { Token } from './token.ts';

export class Parser {
  private readonly tokens;
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse() {
    return this.element();
  }

  private element() {
    while (!this.isAtEnd()) {
      const token_type = this.advance()?.token_type;

      switch (token_type) {
        case TokenType.LEFT_BRACE:
          return this.object();
        case TokenType.LEFT_BRACKET:
          return this.array();
        default:
          if (
            token_type === TokenType.NULL ||
            token_type === TokenType.STRING ||
            token_type === TokenType.NUMBER ||
            token_type === TokenType.TRUE ||
            token_type === TokenType.FALSE
          ) {
            return this.value();
          } else {
            throw new Error(`invalid token of type: ${token_type}}`);
          }
      }
    }
  }

  private value() {
    const token = this.tokens[this.current];
    const token_type = token.token_type;

    switch (token_type) {
      case TokenType.LEFT_BRACE:
        this.advance();
        return this.object();
      case TokenType.LEFT_BRACKET:
        this.advance();
        return this.array();
      default:
        if (
          token_type === TokenType.NULL ||
          token_type === TokenType.STRING ||
          token_type === TokenType.NUMBER ||
          token_type === TokenType.TRUE ||
          token_type === TokenType.FALSE
        ) {
          return token.literal;
        } else {
          throw new Error(`invalid json. found ${token}`);
        }
    }
  }

  private object() {
    const obj = new Object();
    const current = this.tokens[this.current];

    switch (current.token_type) {
      case TokenType.RIGHT_BRACE:
        return obj;
      case TokenType.STRING:
        return Object.assign(obj, this.member());
      default:
        throw new Error(`invalid json. found ${current}`);
    }
  }

  private array() {
    const array: any = [];
    const current = this.tokens[this.current];

    switch (current.token_type) {
      case TokenType.RIGHT_BRACKET:
        return array;
      default:
        array.push(this.value());
        return array;
    }
  }

  private member(): any {
    const members = [];
    const key = this.consume(TokenType.COLON, 'expected colon');
    this.advance();

    const value = this.value();
    members.push({ [key?.literal as string]: value });

    if (this.check(TokenType.COMMA)) {
      this.consume(TokenType.COMMA, 'expected comma');
      this.consume(TokenType.STRING, 'expected string');
      members.push(this.member());
    }

    this.advance();
    return members.reduce((accumulator, currentValue) => ({ ...accumulator, ...currentValue }), {});
  }

  // helper functions

  private advance() {
    return this.tokens.at(this.current++);
  }

  private isAtEnd() {
    if (this.peek()?.token_type === TokenType.EOF) return true;

    return this.current >= this.tokens.length;
  }

  private peek() {
    return this.tokens.at(this.current + 1);
  }

  private check(token_type: TokenType) {
    return this.peek()?.token_type === token_type;
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    throw new Error(message);
  }
}

// JSON Grammar
// json
// element

// value
// object
// array
// string
// number
// "true"
// "false"
// "null"

// object
// '{' ws '}'
// '{' members '}'

// members
// member
// member ',' members

// member
// ws string ws ':' element

// array
// '[' ws ']'
// '[' elements ']'

// elements
// element
// element ',' elements

// element
// ws value ws

// string
// '"' characters '"'

// characters
// ""
// character characters

// character
// '0020' . '10FFFF' - '"' - '\'
// '\' escape
