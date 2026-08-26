import { ASTNode, ParseResult } from '../types';

export const EPSILON_SYMBOLS = new Set(['e', 'ε', 'λ', 'E']);
export const EMPTY_SET_SYMBOLS = new Set(['Ø', 'ø', '∅']);

/**
 * Normalizes input regex string:
 * - replaces alternative union symbol '|' with '+'
 * - strips whitespace
 * - preserves null set and epsilon symbols
 */
export function normalizeRegex(input: string): string {
  let cleaned = input.trim().replace(/\s+/g, '');
  // Replace '|' with '+' for standard union
  cleaned = cleaned.replace(/\|/g, '+');
  return cleaned;
}

/**
 * Inserts explicit concatenation '.' between adjacent tokens
 * e.g., "ab" -> "a.b", "(a+b)a" -> "(a+b).a", "a*b" -> "a*.b"
 */
export function insertConcatOperators(regex: string): string {
  const output: string[] = [];
  
  for (let i = 0; i < regex.length; i++) {
    const c1 = regex[i];
    output.push(c1);
    
    if (i + 1 < regex.length) {
      const c2 = regex[i + 1];
      
      const isC1Symbol = !['(', '+', '.'].includes(c1);
      const isC2Symbol = !['+', '*', ')', '.'].includes(c2);
      
      if (isC1Symbol && isC2Symbol) {
        output.push('.');
      }
    }
  }
  
  return output.join('');
}

/**
 * Operator precedence:
 * '*' (highest: 3)
 * '.' (concat: 2)
 * '+' (union: 1)
 */
function getPrecedence(op: string): number {
  switch (op) {
    case '*':
      return 3;
    case '.':
      return 2;
    case '+':
      return 1;
    default:
      return 0;
  }
}

/**
 * Converts infix regex with explicit '.' to postfix notation using Shunting-yard algorithm
 */
export function infixToPostfix(infix: string): { postfix: string[]; error?: string; errorIndex?: number } {
  const output: string[] = [];
  const opStack: string[] = [];
  let parenDepth = 0;
  
  for (let i = 0; i < infix.length; i++) {
    const char = infix[i];
    
    if (char === '(') {
      parenDepth++;
      opStack.push(char);
    } else if (char === ')') {
      parenDepth--;
      if (parenDepth < 0) {
        return { postfix: [], error: `Unexpected closing parenthesis ')' at position ${i + 1}`, errorIndex: i };
      }
      while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
        output.push(opStack.pop()!);
      }
      if (opStack.length === 0) {
        return { postfix: [], error: `Mismatched parenthesis at position ${i + 1}`, errorIndex: i };
      }
      opStack.pop(); // Remove '('
    } else if (char === '*' || char === '.' || char === '+') {
      // Check invalid operators at start or after other binary operators
      if (char === '*' && (i === 0 || infix[i - 1] === '(' || infix[i - 1] === '+' || infix[i - 1] === '.')) {
        return { postfix: [], error: `Kleene star '*' cannot follow an operator or start an expression at position ${i + 1}`, errorIndex: i };
      }
      if ((char === '+' || char === '.') && (i === 0 || i === infix.length - 1 || infix[i - 1] === '(' || infix[i - 1] === '+' || infix[i - 1] === '.')) {
        return { postfix: [], error: `Operator '${char}' missing operand at position ${i + 1}`, errorIndex: i };
      }

      const prec = getPrecedence(char);
      while (
        opStack.length > 0 &&
        opStack[opStack.length - 1] !== '(' &&
        getPrecedence(opStack[opStack.length - 1]) >= prec
      ) {
        output.push(opStack.pop()!);
      }
      opStack.push(char);
    } else {
      // Standard symbol / epsilon / null set
      output.push(char);
    }
  }
  
  if (parenDepth > 0) {
    return { postfix: [], error: `Missing closing parenthesis ')' in expression`, errorIndex: infix.length - 1 };
  }
  
  while (opStack.length > 0) {
    const op = opStack.pop()!;
    if (op === '(' || op === ')') {
      return { postfix: [], error: 'Mismatched parentheses in expression' };
    }
    output.push(op);
  }
  
  return { postfix: output };
}

/**
 * Builds AST from Postfix tokens
 */
export function buildASTFromPostfix(postfix: string[]): { ast: ASTNode | null; error?: string } {
  if (postfix.length === 0) {
    return { ast: { type: 'EPSILON' } };
  }
  
  const stack: ASTNode[] = [];
  
  for (let i = 0; i < postfix.length; i++) {
    const token = postfix[i];
    
    if (token === '*') {
      if (stack.length < 1) {
        return { ast: null, error: `Invalid syntax for Kleene star '*'` };
      }
      const child = stack.pop()!;
      // Simplification rule: (Ø)* = ε
      if (child.type === 'EMPTY_SET') {
        stack.push({ type: 'EPSILON' });
      } else if (child.type === 'EPSILON') {
        stack.push({ type: 'EPSILON' });
      } else if (child.type === 'STAR') {
        // (a*)* = a*
        stack.push(child);
      } else {
        stack.push({ type: 'STAR', child });
      }
    } else if (token === '.') {
      if (stack.length < 2) {
        return { ast: null, error: `Missing operands for concatenation` };
      }
      const right = stack.pop()!;
      const left = stack.pop()!;
      
      // Simplification rules:
      // A . Ø = Ø, Ø . A = Ø
      if (left.type === 'EMPTY_SET' || right.type === 'EMPTY_SET') {
        stack.push({ type: 'EMPTY_SET' });
      }
      // A . ε = A, ε . A = A
      else if (left.type === 'EPSILON') {
        stack.push(right);
      } else if (right.type === 'EPSILON') {
        stack.push(left);
      } else {
        stack.push({ type: 'CONCAT', left, right });
      }
    } else if (token === '+') {
      if (stack.length < 2) {
        return { ast: null, error: `Missing operands for union '+'` };
      }
      const right = stack.pop()!;
      const left = stack.pop()!;
      
      // Simplification rules:
      // A + Ø = A, Ø + A = A
      if (left.type === 'EMPTY_SET') {
        stack.push(right);
      } else if (right.type === 'EMPTY_SET') {
        stack.push(left);
      } else {
        stack.push({ type: 'UNION', left, right });
      }
    } else {
      // Leaf node
      if (EMPTY_SET_SYMBOLS.has(token)) {
        stack.push({ type: 'EMPTY_SET' });
      } else if (EPSILON_SYMBOLS.has(token)) {
        stack.push({ type: 'EPSILON' });
      } else {
        stack.push({ type: 'SYMBOL', symbol: token });
      }
    }
  }
  
  if (stack.length !== 1) {
    return { ast: null, error: `Malformed regular expression structure` };
  }
  
  return { ast: stack[0] };
}

/**
 * Extracts distinct alphabet symbols from AST (excluding epsilon and empty set)
 */
export function extractAlphabet(node: ASTNode | null): string[] {
  const symbols = new Set<string>();
  
  function traverse(n: ASTNode | null | undefined) {
    if (!n) return;
    if (n.type === 'SYMBOL' && n.symbol) {
      symbols.add(n.symbol);
    }
    if (n.left) traverse(n.left);
    if (n.right) traverse(n.right);
    if (n.child) traverse(n.child);
  }
  
  traverse(node);
  return Array.from(symbols).sort();
}

/**
 * Main parse function
 */
export function parseRegex(input: string): ParseResult {
  const cleaned = normalizeRegex(input);
  
  if (!cleaned) {
    return {
      ast: { type: 'EPSILON' },
      alphabet: [],
      formattedRegex: 'ε',
    };
  }
  
  const explicitConcat = insertConcatOperators(cleaned);
  const postfixResult = infixToPostfix(explicitConcat);
  
  if (postfixResult.error) {
    return {
      ast: null,
      alphabet: [],
      error: postfixResult.error,
      errorIndex: postfixResult.errorIndex,
      formattedRegex: cleaned,
    };
  }
  
  const astResult = buildASTFromPostfix(postfixResult.postfix);
  if (astResult.error || !astResult.ast) {
    return {
      ast: null,
      alphabet: [],
      error: astResult.error || 'Failed to parse regular expression',
      formattedRegex: cleaned,
    };
  }
  
  const alphabet = extractAlphabet(astResult.ast);
  
  return {
    ast: astResult.ast,
    alphabet,
    formattedRegex: cleaned,
  };
}
