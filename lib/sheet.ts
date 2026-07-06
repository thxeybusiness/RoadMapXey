// Moteur de la feuille de calcul : références de cellules, évaluation des
// formules (=A1+B2*2, =SOMME(A1:A5), =MOYENNE(B1:B4)…) avec détection de
// cycles. Aucune dépendance externe.

export const SHEET_COLS = 26; // A → Z
export const SHEET_ROWS = 99; // 1 → 99

export type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
  bg?: string | null; // couleur pastel de la palette
};

export function colName(c: number): string {
  return String.fromCharCode(65 + c);
}

export function refOf(r: number, c: number): string {
  return `${colName(c)}${r + 1}`;
}

export function parseRef(ref: string): { r: number; c: number } | null {
  const m = /^([A-Z])([0-9]{1,3})$/.exec(ref.toUpperCase());
  if (!m) return null;
  const c = m[1].charCodeAt(0) - 65;
  const r = Number(m[2]) - 1;
  if (c < 0 || c >= SHEET_COLS || r < 0 || r >= SHEET_ROWS) return null;
  return { r, c };
}

// ── Évaluateur ────────────────────────────────────────────────────────────────

const FUNCTIONS: Record<string, (values: number[]) => number> = {
  SUM: (v) => v.reduce((a, b) => a + b, 0),
  SOMME: (v) => v.reduce((a, b) => a + b, 0),
  AVERAGE: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0),
  MOYENNE: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0),
  MIN: (v) => (v.length ? Math.min(...v) : 0),
  MAX: (v) => (v.length ? Math.max(...v) : 0),
  COUNT: (v) => v.length,
  NB: (v) => v.length,
};

type Token =
  | { t: "num"; v: number }
  | { t: "ref"; v: string }
  | { t: "func"; v: string }
  | { t: "op"; v: string }
  | { t: "lparen" }
  | { t: "rparen" }
  | { t: "colon" }
  | { t: "sep" };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === " ") { i++; continue; }
    if ("+-*/".includes(ch)) { out.push({ t: "op", v: ch }); i++; continue; }
    if (ch === "(") { out.push({ t: "lparen" }); i++; continue; }
    if (ch === ")") { out.push({ t: "rparen" }); i++; continue; }
    if (ch === ":") { out.push({ t: "colon" }); i++; continue; }
    if (ch === ";" || ch === ",") { out.push({ t: "sep" }); i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ t: "num", v: parseFloat(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[A-Za-zÀ-ÿ]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9À-ÿ]/.test(src[j])) j++;
      const word = src.slice(i, j).toUpperCase();
      if (parseRef(word)) out.push({ t: "ref", v: word });
      else if (FUNCTIONS[word]) out.push({ t: "func", v: word });
      else throw new Error(`Inconnu : ${word}`);
      i = j;
      continue;
    }
    throw new Error(`Caractère invalide : ${ch}`);
  }
  return out;
}

export function evaluateSheet(cells: Map<string, string>): Map<string, string> {
  const display = new Map<string, string>();
  const numeric = new Map<string, number>();
  const visiting = new Set<string>();

  function numericValue(ref: string): number {
    if (numeric.has(ref)) return numeric.get(ref)!;
    if (visiting.has(ref)) throw new Error("cycle");
    visiting.add(ref);
    try {
      const raw = (cells.get(ref) ?? "").trim();
      let value = 0;
      if (raw.startsWith("=")) {
        value = evalFormula(raw.slice(1));
      } else if (raw !== "") {
        const n = parseFloat(raw.replace(",", "."));
        value = Number.isFinite(n) && /^-?[0-9.,]+$/.test(raw) ? n : 0;
      }
      numeric.set(ref, value);
      return value;
    } finally {
      visiting.delete(ref);
    }
  }

  function rangeValues(a: string, b: string): number[] {
    const pa = parseRef(a);
    const pb = parseRef(b);
    if (!pa || !pb) throw new Error("plage invalide");
    const values: number[] = [];
    for (let r = Math.min(pa.r, pb.r); r <= Math.max(pa.r, pb.r); r++) {
      for (let c = Math.min(pa.c, pb.c); c <= Math.max(pa.c, pb.c); c++) {
        const raw = (cells.get(refOf(r, c)) ?? "").trim();
        if (raw !== "") values.push(numericValue(refOf(r, c)));
      }
    }
    return values;
  }

  function evalFormula(src: string): number {
    const tokens = tokenize(src);
    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function parseExpr(): number {
      let left = parseTerm();
      while (peek()?.t === "op" && (peek() as { v: string }).v.match(/[+-]/)) {
        const op = (next() as { v: string }).v;
        const right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }
    function parseTerm(): number {
      let left = parseFactor();
      while (peek()?.t === "op" && (peek() as { v: string }).v.match(/[*/]/)) {
        const op = (next() as { v: string }).v;
        const right = parseFactor();
        left = op === "*" ? left * right : right === 0 ? NaN : left / right;
      }
      return left;
    }
    function parseFactor(): number {
      const tok = next();
      if (!tok) throw new Error("expression incomplète");
      if (tok.t === "num") return tok.v;
      if (tok.t === "ref") return numericValue(tok.v);
      if (tok.t === "op" && tok.v === "-") return -parseFactor();
      if (tok.t === "op" && tok.v === "+") return parseFactor();
      if (tok.t === "lparen") {
        const v = parseExpr();
        if (next()?.t !== "rparen") throw new Error("parenthèse manquante");
        return v;
      }
      if (tok.t === "func") {
        if (next()?.t !== "lparen") throw new Error("( attendue");
        const values: number[] = [];
        if (peek()?.t !== "rparen") {
          for (;;) {
            const first = next();
            if (first?.t === "ref" && peek()?.t === "colon") {
              next(); // ':'
              const second = next();
              if (second?.t !== "ref") throw new Error("plage invalide");
              values.push(...rangeValues(first.v, second.v));
            } else if (first?.t === "ref") {
              values.push(numericValue(first.v));
            } else if (first?.t === "num") {
              values.push(first.v);
            } else {
              throw new Error("argument invalide");
            }
            if (peek()?.t === "sep") { next(); continue; }
            break;
          }
        }
        if (next()?.t !== "rparen") throw new Error(") attendue");
        return FUNCTIONS[tok.v](values);
      }
      throw new Error("expression invalide");
    }

    const result = parseExpr();
    if (pos !== tokens.length) throw new Error("expression invalide");
    return result;
  }

  for (const [ref, raw] of cells) {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("=")) {
      display.set(ref, raw);
      continue;
    }
    try {
      const v = numericValue(ref);
      display.set(
        ref,
        Number.isFinite(v) ? String(Math.round(v * 1e6) / 1e6) : "#DIV/0"
      );
    } catch (e) {
      display.set(ref, e instanceof Error && e.message === "cycle" ? "#CYCLE" : "#ERREUR");
    }
  }
  return display;
}
