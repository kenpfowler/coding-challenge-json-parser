import { assertEquals } from '@std/assert';
import { Scanner } from './scanner.ts';
import { Parser } from './parser.ts';

Deno.test(function scanObject() {
  const source = '{      }';
  const scanner = new Scanner(source);
  const tokens = scanner.scan();

  const parser = new Parser(tokens);
  const object = parser.parse();

  assertEquals(object, {});
});

Deno.test(function scanArray() {
  const source = '[   ]';
  const scanner = new Scanner(source);
  const tokens = scanner.scan();

  const parser = new Parser(tokens);
  const object = parser.parse();

  assertEquals(object, []);
});
Deno.test(function scanKeyValue() {
  const source = '{"key": "value"}';
  const scanner = new Scanner(source);
  const tokens = scanner.scan();

  const parser = new Parser(tokens);
  const object = parser.parse();

  assertEquals(object, { key: 'value' });
});

Deno.test(function scanKeyValues() {
  const source = '{ "key1": true, "key2": false, "key3": null, "key4": "value", "key5": 101.101 }';
  const scanner = new Scanner(source);
  const tokens = scanner.scan();

  const parser = new Parser(tokens);
  const object = parser.parse();

  assertEquals(object, {
    key1: true,
    key2: false,
    key3: null,
    key4: 'value',
    key5: 101.101,
  });
});

Deno.test(function scanNestedKeyValues() {
  const source = '{ "key": "value", "key-n": 101, "key-o": { "key-o-a": "nested" }, "key-l": [] }';
  const scanner = new Scanner(source);
  const tokens = scanner.scan();

  const parser = new Parser(tokens);
  const object = parser.parse();

  assertEquals(object, {
    key: 'value',
    'key-n': 101,
    'key-o': { 'key-o-a': 'nested' },
    'key-l': [],
  });
});
