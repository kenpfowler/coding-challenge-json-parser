import { Token } from './token.ts';

export class Parser {
  private readonly tokens;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse() {
    const elements = this.tokens.map((token) => token.lexeme);
    const string = elements.join('');
    console.log(string);
    return JSON.parse(string);
  }
}
