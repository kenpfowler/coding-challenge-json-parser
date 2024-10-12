import { Parser } from './parser.ts';
import { Scanner } from './scanner.ts';

export class JsonParser {
  private scanner: Scanner | null = null;
  private parser: Parser | null = null;

  public parse(source: string) {
    this.scanner = new Scanner(source);
    const tokens = this.scanner.scan();
    this.parser = new Parser(tokens);
    const json = this.parser.parse();
    return json;
  }

  public run() {
    const filePath = Deno.args.at(0);

    try {
      if (filePath) {
        const file = Deno.readTextFileSync(filePath);
        const json = this.parse(file);
        return json;
      }
    } catch (error) {
      console.error(error);
    }
  }
}

function main() {
  const parser = new JsonParser();
  parser.run();
}

main();
