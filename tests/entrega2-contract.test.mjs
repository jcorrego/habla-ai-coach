import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(`${root}/${path}`, 'utf8');

test('Entrega 2 keeps product name Habla and JCO branch docs', () => {
  const readme = read('README.md');
  assert.match(readme, /Producto\s*\n\n\*\*Habla\*\*/);
  assert.match(readme, /feature-entrega2-JCO/);
  assert.doesNotMatch(readme, /Producto\s*:\s*PersonaPlex/i);
});

test('MVP has frontend, backend API routes and connected persistence layer', () => {
  assert.ok(existsSync(`${root}/app/page.tsx`), 'frontend page exists');
  assert.ok(existsSync(`${root}/app/api/sessions/route.ts`), 'sessions API exists');
  assert.ok(existsSync(`${root}/app/api/sessions/[id]/finish/route.ts`), 'finish API exists');
  assert.ok(existsSync(`${root}/app/api/health/route.ts`), 'health API exists');
  assert.ok(existsSync(`${root}/app/api/scenarios/route.ts`), 'scenarios API exists');
  assert.ok(existsSync(`${root}/app/api/demo/seed/route.ts`), 'demo seed API exists');
  assert.ok(existsSync(`${root}/app/status/page.tsx`), 'status page exists');
  assert.ok(existsSync(`${root}/.env.example`), '.env.example exists');
  const store = read('lib/habla-store.ts');
  assert.match(store, /DatabaseSync/);
  assert.match(store, /mysql2\/promise/);
  assert.match(store, /HABLA_DB_DRIVER/);
  assert.match(store, /PRACTICE_SCENARIOS/);
  assert.match(store, /resetDemoData/);
  assert.match(store, /CREATE TABLE IF NOT EXISTS session/);
  assert.match(store, /CREATE TABLE IF NOT EXISTS session_report/);
  assert.match(store, /finishAndAnalyze/);
});

test('AI usage register documents mocks and limitations', () => {
  const prompts = read('prompts.md');
  assert.match(prompts, /voz real.*mockeado|proveedor de voz está mockeado/i);
  assert.match(prompts, /SQLite local/);
  assert.match(prompts, /Supabase/);
});
