# canon-stock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a small offline-first inventory manager for small businesses in one long instrumented session, so Canon's violation rate can be measured as a function of session length.

**Architecture:** A Vite + React + TypeScript single-page app with no router and no state library. Six screens switch off one `useState` in `App.tsx`. All persistence goes through `storage.ts`, which wraps a pluggable backend defaulting to `localStorage`, so the domain logic is testable in plain Node without jsdom. Canon is vendored as `canon.css` plus a `theme.css` of token overrides.

**Tech Stack:** Vite, React 19, TypeScript, Vitest. Three runtime dependencies: react, react-dom. Canon CSS vendored, not installed, so the app pins a known snapshot.

---

## Measurement protocol (read before Task 1)

This project is an experiment. These rules override normal development habits:

1. **Do not fix `canon-lint` violations as they appear.** They are the data.
   They get fixed once, in Task 11.
2. **Log every turn that touches a file** in `drift-log.md` before moving on.
3. **Record vocabulary escapes even when the linter is silent.** Writing custom
   CSS for something Canon does not cover lints clean and still falsifies the
   thesis. That is the more interesting failure.
4. **Screens are specified by requirements, not markup.** This plan deliberately
   contains no JSX for the six screens. Handing over finished markup would turn
   the session into transcription and the experiment would measure copy-paste.
   Non-visual code is fully specified below, because none of it is under test.

## File structure

```
canon-stock/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  LICENSE                 MIT
  README.md
  drift-log.md            the instrument
  src/
    main.tsx              mount
    App.tsx               topbar + screen switch
    types.ts              Producto, Movimiento
    storage.ts            pluggable persistence, no React
    csv.ts                CSV serialisation, no React
    canon.css             vendored snapshot of canoncss dist
    theme.css             token overrides only
    screens/
      Productos.tsx
      ProductoForm.tsx
      Movimientos.tsx
      StockBajo.tsx
      Exportar.tsx
      Ajustes.tsx
  test/
    storage.test.ts
    csv.test.ts
```

`storage.ts` and `csv.ts` hold every piece of logic that can be wrong in a way a
user notices. They are pure, they have no React import, and they are the only
files with tests. The screens are markup over those two modules.

---

### Task 1: Scaffold the project

**Files:**
- Create: `canon-stock/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `LICENSE`, `.gitignore`
- Create: `canon-stock/src/canon.css` (copied from the canon repo `dist/canon.css`)

- [ ] **Step 1: Create the directory and git repo**

```bash
mkdir -p ~/OneDrive/Escritorio/proyectos/canon-stock/src/screens ~/OneDrive/Escritorio/proyectos/canon-stock/test
cd ~/OneDrive/Escritorio/proyectos/canon-stock && git init
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "canon-stock",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint:canon": "npx canon-lint src"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.7.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
});
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules
dist
```

- [ ] **Step 6: Vendor Canon and install**

```bash
cp ~/OneDrive/Escritorio/proyectos/canon/dist/canon.css ~/OneDrive/Escritorio/proyectos/canon-stock/src/canon.css
cd ~/OneDrive/Escritorio/proyectos/canon-stock && npm install
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold vite + react + typescript"
```

---

### Task 2: Domain types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write the file**

```ts
export type Producto = {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  /** Unidades en existencia. Entero, puede ser 0, nunca negativo. */
  stock: number;
  /** Umbral de alerta. Cuando stock <= minimo el producto aparece en Stock bajo. */
  minimo: number;
  /** Precio en centavos. Entero a proposito: los flotantes pierden plata. */
  precioCentavos: number;
  /** ISO 8601. */
  actualizado: string;
};

export type Movimiento = {
  id: string;
  productoId: string;
  tipo: 'entrada' | 'salida';
  /** Siempre positiva. El signo lo pone `tipo`, no la cantidad. */
  cantidad: number;
  motivo: string;
  /** ISO 8601. */
  fecha: string;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts && git commit -m "feat: domain types for productos and movimientos"
```

---

### Task 3: Storage module, test first

**Files:**
- Create: `test/storage.test.ts`
- Create: `src/storage.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { createStore, memoryBackend } from '../src/storage';

type Row = { id: string; nombre: string };

describe('createStore', () => {
  it('starts empty', () => {
    const store = createStore<Row>('rows', memoryBackend());
    expect(store.list()).toEqual([]);
  });

  it('saves and reads back', () => {
    const store = createStore<Row>('rows', memoryBackend());
    store.save({ id: 'a', nombre: 'Tornillo' });
    expect(store.list()).toEqual([{ id: 'a', nombre: 'Tornillo' }]);
    expect(store.get('a')?.nombre).toBe('Tornillo');
  });

  it('upserts by id instead of duplicating', () => {
    const store = createStore<Row>('rows', memoryBackend());
    store.save({ id: 'a', nombre: 'Tornillo' });
    store.save({ id: 'a', nombre: 'Tuerca' });
    expect(store.list()).toHaveLength(1);
    expect(store.get('a')?.nombre).toBe('Tuerca');
  });

  it('removes', () => {
    const store = createStore<Row>('rows', memoryBackend());
    store.save({ id: 'a', nombre: 'Tornillo' });
    store.remove('a');
    expect(store.list()).toEqual([]);
    expect(store.get('a')).toBeUndefined();
  });

  it('notifies subscribers on write and stops after unsubscribe', () => {
    const store = createStore<Row>('rows', memoryBackend());
    let calls = 0;
    const off = store.subscribe(() => { calls++; });
    store.save({ id: 'a', nombre: 'Tornillo' });
    expect(calls).toBe(1);
    off();
    store.save({ id: 'b', nombre: 'Arandela' });
    expect(calls).toBe(1);
  });

  it('survives corrupted storage instead of throwing', () => {
    const backend = memoryBackend();
    backend.setItem('canon-stock:rows', 'no soy json');
    const store = createStore<Row>('rows', backend);
    expect(store.list()).toEqual([]);
  });

  it('keeps two stores independent', () => {
    const backend = memoryBackend();
    const a = createStore<Row>('a', backend);
    const b = createStore<Row>('b', backend);
    a.save({ id: '1', nombre: 'uno' });
    expect(b.list()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL, cannot resolve `../src/storage`.

- [ ] **Step 3: Write `src/storage.ts`**

```ts
const PREFIX = 'canon-stock:';

export type Backend = Pick<Storage, 'getItem' | 'setItem'>;

/** Backend en memoria para tests: evita depender de jsdom. */
export function memoryBackend(): Backend {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v); },
  };
}

function defaultBackend(): Backend {
  // ponytail: si no hay localStorage (SSR, tests), degrada a memoria en vez de romper.
  return typeof localStorage === 'undefined' ? memoryBackend() : localStorage;
}

export type Store<T extends { id: string }> = {
  list(): T[];
  get(id: string): T | undefined;
  save(row: T): void;
  remove(id: string): void;
  subscribe(fn: () => void): () => void;
};

export function createStore<T extends { id: string }>(
  key: string,
  backend: Backend = defaultBackend(),
): Store<T> {
  const storageKey = PREFIX + key;
  const listeners = new Set<() => void>();

  function read(): T[] {
    const raw = backend.getItem(storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      // Datos corruptos no deben tirar la app abajo: se tratan como vacio.
      return [];
    }
  }

  function write(rows: T[]): void {
    backend.setItem(storageKey, JSON.stringify(rows));
    for (const fn of listeners) fn();
  }

  return {
    list: read,
    get: (id) => read().find((row) => row.id === id),
    save(row) {
      const rows = read();
      const i = rows.findIndex((r) => r.id === row.id);
      if (i === -1) rows.push(row);
      else rows[i] = row;
      write(rows);
    },
    remove(id) {
      write(read().filter((row) => row.id !== id));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
  };
}

export const productos = createStore<import('./types').Producto>('productos');
export const movimientos = createStore<import('./types').Movimiento>('movimientos');
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add test/storage.test.ts src/storage.ts && git commit -m "feat: storage module with pluggable backend"
```

---

### Task 4: CSV serialisation, test first

**Files:**
- Create: `test/csv.test.ts`
- Create: `src/csv.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { toCSV } from '../src/csv';

type Row = { nombre: string; stock: number };
const cols = [
  { key: 'nombre' as const, label: 'Nombre' },
  { key: 'stock' as const, label: 'Stock' },
];

describe('toCSV', () => {
  it('writes a header even with no rows', () => {
    expect(toCSV<Row>([], cols)).toBe('Nombre,Stock');
  });

  it('writes one line per row', () => {
    const rows: Row[] = [{ nombre: 'Tornillo', stock: 5 }];
    expect(toCSV(rows, cols)).toBe('Nombre,Stock\r\nTornillo,5');
  });

  it('quotes values containing a comma', () => {
    const rows: Row[] = [{ nombre: 'Tornillo, largo', stock: 5 }];
    expect(toCSV(rows, cols)).toBe('Nombre,Stock\r\n"Tornillo, largo",5');
  });

  it('doubles embedded quotes', () => {
    const rows: Row[] = [{ nombre: 'Caño 1"', stock: 2 }];
    expect(toCSV(rows, cols)).toBe('Nombre,Stock\r\n"Caño 1""",2');
  });

  it('quotes values containing a newline', () => {
    const rows: Row[] = [{ nombre: 'linea1\nlinea2', stock: 1 }];
    expect(toCSV(rows, cols)).toBe('Nombre,Stock\r\n"linea1\nlinea2",1');
  });

  it('does not let a leading equals sign become a formula', () => {
    const rows: Row[] = [{ nombre: '=1+1', stock: 1 }];
    expect(toCSV(rows, cols)).toBe("Nombre,Stock\r\n'=1+1,1");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL, cannot resolve `../src/csv`.

- [ ] **Step 3: Write `src/csv.ts`**

```ts
export type Column<T> = { key: keyof T; label: string };

/** Caracteres con los que Excel interpreta una celda como formula. */
const FORMULA_START = /^[=+\-@]/;

function escape(value: unknown): string {
  let text = value == null ? '' : String(value);
  // Inyeccion de formulas: una celda que empieza con = se ejecuta al abrir el
  // archivo. El apostrofe la neutraliza y Excel no lo muestra.
  if (FORMULA_START.test(text)) text = "'" + text;
  if (/[",\n\r]/.test(text)) text = '"' + text.replace(/"/g, '""') + '"';
  return text;
}

export function toCSV<T>(rows: T[], columns: Column<T>[]): string {
  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(','));
  return [header, ...body].join('\r\n');
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS, 13 tests total.

- [ ] **Step 5: Commit**

```bash
git add test/csv.test.ts src/csv.ts && git commit -m "feat: csv serialisation with injection and quoting handled"
```

---

### Task 5: Drift log skeleton

**Files:**
- Create: `drift-log.md`

- [ ] **Step 1: Write the file**

```markdown
# Drift log

Every turn of the build session that created or modified a file. Violations are
recorded, not fixed: see the cleanup commit at the end for what they cost.

Escapes are the more interesting column. They are the times the Canon
vocabulary had no answer and something was written outside it. Those lint clean
and still count against the thesis.

| Turn | Context | Files | Violations | Escapes |
|---|---|---|---|---|
```

- [ ] **Step 2: Commit**

```bash
git add drift-log.md && git commit -m "chore: drift log skeleton"
```

---

### Tasks 6 to 10: the six screens

Each screen is one task. For each: build it, run `npm run lint:canon`, record the
result in `drift-log.md`, commit. **Do not fix violations.**

No markup is given here on purpose. See the measurement protocol above.

**Task 6, `src/App.tsx` and `src/screens/Productos.tsx`.** A topbar with the app
name and navigation between the six screens, and a product list: search by name
or SKU, sortable by name and by stock, a row per product showing SKU, name,
category, stock, minimum and price, and a control to open the edit form. Empty
state when there are no products, with an action to create the first one. Seed
button in Ajustes, not here.

**Task 7, `src/screens/ProductoForm.tsx`.** Create and edit in one component.
Fields: SKU, name, category, stock, minimum, price. Validation at the boundary:
SKU required and unique, name required, stock and minimum integers and not
negative, price not negative. Errors shown per field. Saving writes through
`storage.productos` and returns to the list.

**Task 8, `src/screens/Movimientos.tsx`.** Record a stock movement: pick a
product, choose entrada or salida, quantity, reason. A salida larger than
current stock is rejected, not silently clamped. Writing a movement updates the
product's stock and `actualizado` in the same action. Below the form, the
movement history, newest first.

**Task 9, `src/screens/StockBajo.tsx`.** Products where `stock <= minimo`,
sorted by how far under they are. Each row links to its movement form. Explicit
empty state when nothing is low, because an empty table reads like a bug.

**Task 10, `src/screens/Exportar.tsx` and `src/screens/Ajustes.tsx`.** Export
offers column selection and a filter for all products or only low stock, then
downloads via a Blob and an object URL that is revoked after the click. Settings
holds: seed demo data, delete all data behind a confirmation, and the storage
footprint in kilobytes.

---

### Task 11: Repeat checkpoint

**Files:**
- Create: `test-llm/checkpoint-productos.tsx` in the canon repo

- [ ] **Step 1: Regenerate the product list screen from scratch**

Using only the one-paragraph description from Task 6, without looking at the
existing `Productos.tsx`, write the screen again into
`test-llm/checkpoint-productos.tsx` in the canon repo.

- [ ] **Step 2: Compare structurally against the original**

Compare the sequence of `data-layout` and `data-component` attributes in both
versions. Record in the write-up: how many structural decisions match, and
which differ.

- [ ] **Step 3: Commit the checkpoint**

```bash
git add test-llm/checkpoint-productos.tsx && git commit -m "test: turn-1 vs turn-N checkpoint of the product list"
```

---

### Task 12: Cleanup commit and write-up

**Files:**
- Modify: whichever files `canon-lint` flags
- Create: `docs/drift-report-2026-08.md` in the canon repo
- Modify: `README.md` in the canon repo

- [ ] **Step 1: Fix every violation in one commit**

```bash
cd ~/OneDrive/Escritorio/proyectos/canon-stock && npx canon-lint src
```

Fix all of them, then:

```bash
git add -A && git commit -m "fix: clear every canon-lint violation accumulated during the build"
git show --stat HEAD
```

The diff size of this single commit is the third measurement.

- [ ] **Step 2: Write the report**

`docs/drift-report-2026-08.md` in the canon repo, containing: the violations
per turn table, the cumulative escapes, the cleanup diff size, the checkpoint
comparison, and the limitations section carried over from the spec. Publish the
result whichever way it falls.

- [ ] **Step 3: Link it from Canon's README**

Add the report under `## Proof`, next to the existing corpus claim.

- [ ] **Step 4: Commit**

```bash
git add docs/drift-report-2026-08.md README.md
git commit -m "docs: long-context drift report from building canon-stock"
```

---

## Self-review notes

- **Spec coverage.** Six screens: Tasks 6 to 10. Storage behind an interface:
  Task 3. Instrumentation: Task 5 plus the per-task logging rule. Repeat
  checkpoint: Task 11. Cleanup commit and the three numbers: Task 12. Offline
  wording and licence: Tasks 1 and 12.
- **Deliberate omission.** The screens carry no markup. This breaks the skill's
  no-placeholder rule knowingly, because supplying the markup would measure
  transcription rather than generation. Every non-visual module is fully
  specified.
- **Type consistency.** `Producto.precioCentavos` is used in Tasks 2, 7 and 10.
  `Store<T>` exposes `list`, `get`, `save`, `remove`, `subscribe` and nothing
  else, in Tasks 3, 6, 7, 8, 9 and 10.
- **Not tested.** The screens have no component tests. They are markup over two
  tested modules, and the instrument that judges them is `canon-lint`.
