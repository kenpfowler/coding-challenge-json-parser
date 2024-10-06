export enum TokenType {
  // single character tokens
  LEFT_BRACKET = '[',
  RIGHT_BRACKET = ']',
  LEFT_BRACE = '{',
  RIGHT_BRACE = '}',
  COMMA = ',',
  COLON = ':',

  // literals
  STRING = 'string',
  NULL = 'null',
  NUMBER = 'number',
  TRUE = 'true',
  FALSE = 'false',

  // end of file
  EOF = 'EOF',
}
