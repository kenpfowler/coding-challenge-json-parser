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
    assertEquals(JsonParser.parse(content), JSON.parse(content));
  });
}

for (const file of failing) {
  const content = Deno.readTextFileSync('./tests/' + file.name);

  Deno.test(function failingTests() {
    assertThrows(() => {
      JsonParser.parse(content);
    });
  });
}
