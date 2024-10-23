import { Parser } from './parser.ts';
import { Scanner } from './scanner.ts';

export class JsonParser {
  public static parse(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scan();
    const parser = new Parser(tokens);
    const json = parser.parse();
    return json;
  }

  public static run() {
    const filePath = Deno.args.at(0);

    try {
      if (filePath) {
        const file = Deno.readTextFileSync(filePath);
        const json = JsonParser.parse(file);
        return json;
      }
    } catch (error) {
      console.error(error);
    }
  }

  public static reportError(line: number, position: number, message: string) {
    const msg = `[line ${line}, position ${position}] ${message}`;
    throw Error(msg);
  }
}

function main() {
  JsonParser.run();
}

main();
