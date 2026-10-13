/**
 * Detect JSX component tags (<Foo />) that are neither imported nor declared in
 * the file. ESLint's no-undef cannot see JSX identifiers and the Vite build
 * cannot either, so an undefined tag becomes a runtime ReferenceError that only
 * crashes when that component renders. This is a targeted static check for that
 * exact class of bug.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.argv[2] || "src";
const files = [];

(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(jsx|js)$/.test(entry)) files.push(full);
  }
})(ROOT);

const problems = [];

for (const file of files) {
  const src = readFileSync(file, "utf8");

  // Every name the file brings into scope.
  const known = new Set();

  // import { A, B as C } / import D from / import * as N
  for (const m of src.matchAll(/import\s+([\s\S]*?)\s+from\s+["'][^"']+["']/g)) {
    const clause = m[1];
    const braced = clause.match(/\{([\s\S]*?)\}/);
    if (braced) {
      for (const part of braced[1].split(",")) {
        const name = part.trim().split(/\s+as\s+/).pop().trim();
        if (name) known.add(name);
      }
    }
    const def = clause.replace(/\{[\s\S]*?\}/g, "").replace(/,/g, " ").trim();
    for (const name of def.split(/\s+/)) if (name && name !== "*") known.add(name);
    const ns = clause.match(/\*\s+as\s+(\w+)/);
    if (ns) known.add(ns[1]);
  }

  // Local declarations
  for (const m of src.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) {
    known.add(m[1]);
  }

  // Local name for a destructured entry. Handles renames: in `{ icon: Icon }`
// the name bound locally is the part AFTER the colon, while in `{ Foo }` it is
// the part before. In `{ key: value = default }` both exist — take the key.
function destructuredName(part) {
  const trimmed = part.trim();
  if (!trimmed) return null;
  const [head, tail] = trimmed.split(":");
  return (tail !== undefined ? tail : head).split("=")[0].trim() || null;
}

  // Destructured names in declarations AND in function parameters, e.g.
  // const { Foo } = x   /   ({ icon: Icon, label }) => ...
  for (const m of src.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
    for (const part of m[1].split(",")) {
      const name = destructuredName(part);
      if (name) known.add(name);
    }
  }
  for (const m of src.matchAll(/\(\s*\{([\s\S]*?)\}\s*\)\s*=>/g)) {
    for (const part of m[1].split(",")) {
      const name = destructuredName(part);
      if (name) known.add(name);
    }
  }

  // Lowercase-with-dots HTML tags are DOM elements, not components.
  const used = new Set();
  for (const m of src.matchAll(/<\s*([A-Z][\w$]*)[\s/>]/g)) used.add(m[1]);
  for (const m of src.matchAll(/<\s*([A-Z][\w$]*)\.[A-Za-z_$]/g)) used.add(m[1]);
  for (const m of src.matchAll(/\{\s*([A-Z][\w$]*)\s*\}/g)) used.add(m[1]);

  const missing = [...used].filter((n) => !known.has(n));
  if (missing.length) problems.push({ file: relative(ROOT, file), missing: [...new Set(missing)] });
}

if (!problems.length) {
  console.log("OK — no undefined JSX component tags found.");
} else {
  console.log(`FOUND ${problems.length} file(s) referencing undefined components:\n`);
  for (const p of problems) console.log(`  ${p.file}: ${p.missing.join(", ")}`);
  process.exitCode = 1;
}
