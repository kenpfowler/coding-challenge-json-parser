import { TokenType } from './token-type.ts';
import { Token } from './token.ts';

export class Parser {
  private readonly tokens;
  private current = 0;
  private depth = 0;
  private max_array_depth = 20;
  private literals = [
    TokenType.NULL,
    TokenType.NUMBER,
    TokenType.STRING,
    TokenType.FALSE,
    TokenType.TRUE,
  ];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse() {
    const json = this.element();
    this.consume(TokenType.EOF, 'expected EOF');
    return json;
  }

  private element() {
    const token = this.tokens[this.current];
    const token_type = token.token_type;

    switch (token_type) {
      case TokenType.LEFT_BRACE:
        this.current++;
        return this.object();
      case TokenType.LEFT_BRACKET:
        this.current++;
        return this.array();
      default:
        throw new Error(`invalid token of type: ${token_type}}`);
    }
  }

  private value() {
    const token = this.tokens[this.current];
    const token_type = token.token_type;

    switch (token_type) {
      case TokenType.LEFT_BRACE:
        this.current++;
        return this.object();
      case TokenType.LEFT_BRACKET:
        this.current++;
        return this.array();
      default:
        if (this.literals.includes(token_type)) {
          this.current++;
          return token.literal;
        } else {
          throw new Error(`invalid json. found ${token} ${this.current}`);
        }
    }
  }

  private object() {
    const obj = new Object();
    const token = this.tokens[this.current];

    switch (token.token_type) {
      case TokenType.RIGHT_BRACE:
        this.current++;
        return obj;
      case TokenType.STRING:
        while (!this.isAtEnd()) {
          const key = this.consume(TokenType.STRING, 'expected key');
          this.consume(TokenType.COLON, 'expected colon');

          Object.assign(obj, { [key.literal as string]: this.value() });

          if (this.tokens[this.current].token_type === TokenType.RIGHT_BRACE) {
            this.consume(TokenType.RIGHT_BRACE, 'expected right brace');
            return obj;
          }

          this.consume(TokenType.COMMA, 'expected comma');
        }

        this.consume(TokenType.RIGHT_BRACE, 'expected right brace');
        break;
      default:
        throw new Error(`invalid json. found ${token}`);
    }
  }

  private array() {
    this.depth++;
    if (this.depth >= this.max_array_depth) {
      throw new Error('array exceeds max depth');
    }

    // deno-lint-ignore no-explicit-any
    const array: any = [];
    const token = this.tokens[this.current];

    switch (token.token_type) {
      case TokenType.RIGHT_BRACKET:
        this.depth--;
        this.current++;
        return array;
      default:
        while (!this.isAtEnd()) {
          array.push(this.value());

          if (this.tokens[this.current].token_type === TokenType.RIGHT_BRACKET) {
            this.consume(TokenType.RIGHT_BRACKET, 'expected right bracket');
            this.depth--;
            return array;
          }

          this.consume(TokenType.COMMA, `expected comma - found ${this.tokens[this.current]}`);
        }
    }
  }

  // helper functions
  private isAtEnd() {
    if (this.tokens[this.current].token_type === TokenType.EOF) {
      return true;
    }
    return this.current >= this.tokens.length;
  }

  private peek() {
    return this.tokens[this.current + 1];
  }

  private check(token_type: TokenType) {
    return this.tokens[this.current].token_type === token_type;
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) {
      return this.tokens[this.current++];
    }

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
