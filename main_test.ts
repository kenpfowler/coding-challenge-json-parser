import { assertEquals, assertThrows } from '@std/assert';
import { JsonParser } from './main.ts';

const test_files = Deno.readDirSync('./tests');
const passing = [];
const failing = [];

for (const file of test_files) {
  file.name.includes('pass') ? passing.push(file) : failing.push(file);
}

for (const file of passing) {
  const content = Deno.readTextFileSync('./tests/' + file.name);

  Deno.test(function passingTests() {
    const parser = new JsonParser();
    assertEquals(parser.parse(content), JSON.parse(content));
  });
}

for (const file of failing) {
  const content = Deno.readTextFileSync('./tests/' + file.name);

  Deno.test(function failingTests() {
    assertThrows(() => {
      const parser = new JsonParser();
      const json = parser.parse(content);
      console.log(`parsed invalid json in ${file.name}`);
    });
  });
}
