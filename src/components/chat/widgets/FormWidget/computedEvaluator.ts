type FieldValues = Record<string, unknown>;

type Token =
  | { type: 'number'; value: number }
  | { type: 'field'; path: string }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: '(' | ')' };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%') {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    if (/\d/.test(ch) || (ch === '.' && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
      let num = '';
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: 'number', value: parseFloat(num) });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < expr.length && /[a-zA-Z0-9_.]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      if (ident.startsWith('fields.')) {
        tokens.push({ type: 'field', path: ident.slice(7) });
      } else {
        tokens.push({ type: 'field', path: ident });
      }
      continue;
    }

    i++;
  }
  return tokens;
}

function resolveField(path: string, fields: FieldValues): number {
  const val = fields[path];
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function parseExpression(tokens: Token[], pos: { i: number }, fields: FieldValues): number {
  let left = parseTerm(tokens, pos, fields);
  while (pos.i < tokens.length) {
    const tok = tokens[pos.i];
    if (tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      pos.i++;
      const right = parseTerm(tokens, pos, fields);
      left = tok.value === '+' ? left + right : left - right;
    } else {
      break;
    }
  }
  return left;
}

function parseTerm(tokens: Token[], pos: { i: number }, fields: FieldValues): number {
  let left = parseFactor(tokens, pos, fields);
  while (pos.i < tokens.length) {
    const tok = tokens[pos.i];
    if (tok.type === 'op' && (tok.value === '*' || tok.value === '/' || tok.value === '%')) {
      pos.i++;
      const right = parseFactor(tokens, pos, fields);
      if (tok.value === '*') left = left * right;
      else if (tok.value === '/') left = right !== 0 ? left / right : 0;
      else left = right !== 0 ? left % right : 0;
    } else {
      break;
    }
  }
  return left;
}

function parseFactor(tokens: Token[], pos: { i: number }, fields: FieldValues): number {
  if (pos.i >= tokens.length) return 0;
  const tok = tokens[pos.i];

  if (tok.type === 'paren' && tok.value === '(') {
    pos.i++;
    const val = parseExpression(tokens, pos, fields);
    if (pos.i < tokens.length && tokens[pos.i].type === 'paren') pos.i++;
    return val;
  }

  if (tok.type === 'op' && tok.value === '-') {
    pos.i++;
    return -parseFactor(tokens, pos, fields);
  }

  if (tok.type === 'number') {
    pos.i++;
    return tok.value;
  }

  if (tok.type === 'field') {
    pos.i++;
    return resolveField(tok.path, fields);
  }

  pos.i++;
  return 0;
}

export function evaluateExpression(expression: string, fields: FieldValues): number | null {
  try {
    const tokens = tokenize(expression);
    if (tokens.length === 0) return null;
    const pos = { i: 0 };
    const result = parseExpression(tokens, pos, fields);
    if (!Number.isFinite(result)) return null;
    return Math.round(result * 1e10) / 1e10;
  } catch {
    return null;
  }
}
