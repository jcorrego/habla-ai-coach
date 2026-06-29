import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.HABLA_DB_DRIVER = 'sqlite';
process.env.HABLA_DB_PATH = 'data/unit-test.db';

const store = await import('../lib/habla-store.ts');

test('practice scenarios provide demo-ready transcripts and pedagogical focus', () => {
  const scenarios = store.listPracticeScenarios();
  assert.equal(scenarios.length, 4);
  assert.deepEqual(scenarios.map((scenario) => scenario.id), [
    'work-update',
    'job-interview',
    'project-pitch',
    'casual-small-talk'
  ]);
  for (const scenario of scenarios) {
    assert.ok(scenario.title.length > 4);
    assert.ok(scenario.focus.length > 10);
    assert.match(scenario.transcript, /Teacher:/);
    assert.match(scenario.transcript, /Student:/);
  }
});

test('analyzeTranscript rewards past tense and connectors in B2 answers', () => {
  const strong = store.analyzeTranscript(
    'Last week I worked on Habla because the demo needed a production deployment, however I kept the scope controlled.',
    'Project pitch',
    'B2'
  );
  const weak = store.analyzeTranscript('I work yesterday. Um like I go.', 'Past simple', 'B2');

  assert.ok(strong.scores.global > weak.scores.global);
  assert.equal(strong.errors.length, 0);
  assert.ok(weak.errors.some((error) => error.kind === 'grammar'));
  assert.ok(weak.errors.some((error) => error.kind === 'vocab'));
});

test('buildTeacherPrompt includes student, level and session focus', () => {
  const prompt = store.buildTeacherPrompt({
    name: 'Juan Carlos',
    level: 'B2',
    focus: 'Pitch a product idea'
  });

  assert.match(prompt, /Juan Carlos/);
  assert.match(prompt, /B2/);
  assert.match(prompt, /Pitch a product idea/);
  assert.match(prompt, /one question at a time/);
});

test('resetDemoData creates a coherent demo dataset in sqlite', async () => {
  const result = await store.resetDemoData();
  assert.equal(result.ok, true);
  assert.equal(result.profile.user_id, 'demo-user');
  assert.equal(result.sessions.length, 3);
  assert.equal(result.progress.snapshots.length, 3);
  assert.ok(result.progress.vocab.length >= 3);
});
