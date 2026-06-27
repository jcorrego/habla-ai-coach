import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Profile = {
  user_id: string;
  display_name: string;
  target_level: string;
  native_language: string;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  focus: string;
  level: string;
  status: 'prepared' | 'in_progress' | 'processing' | 'reported' | 'failed';
  prompt_used: string;
  prompt_version: string;
  transcript: string | null;
  audio_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionReport = {
  session_id: string;
  summary: string;
  strengths: string[];
  practice_points: string[];
  new_vocabulary: string[];
  global_score: number;
  grammar_score: number;
  fluency_score: number;
  vocab_score: number;
  pronunciation_score: number;
  next_focus: string;
  created_at: string;
};

const dataDir = path.join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.HABLA_DB_PATH ?? path.join(dataDir, 'habla.db');

declare global {
  // eslint-disable-next-line no-var
  var hablaDb: DatabaseSync | undefined;
}

export function db() {
  if (!globalThis.hablaDb) {
    globalThis.hablaDb = new DatabaseSync(dbPath);
    migrate(globalThis.hablaDb);
    seed(globalThis.hablaDb);
  }
  return globalThis.hablaDb;
}

function migrate(database: DatabaseSync) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS profile (
      user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      target_level TEXT NOT NULL,
      native_language TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profile(user_id),
      focus TEXT NOT NULL,
      level TEXT NOT NULL,
      status TEXT NOT NULL,
      prompt_used TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      transcript TEXT,
      audio_url TEXT,
      started_at TEXT,
      ended_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS learning_error (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES session(id),
      kind TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      correction TEXT NOT NULL,
      explanation TEXT NOT NULL,
      severity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vocabulary_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profile(user_id),
      lemma TEXT NOT NULL,
      times_used INTEGER NOT NULL DEFAULT 1,
      mastery_score REAL NOT NULL DEFAULT 0.2,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, lemma)
    );

    CREATE TABLE IF NOT EXISTS progress_snapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profile(user_id),
      session_id TEXT NOT NULL UNIQUE REFERENCES session(id),
      fluency_score REAL NOT NULL,
      grammar_score REAL NOT NULL,
      vocab_score REAL NOT NULL,
      pronunciation_score REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS curriculum_plan (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profile(user_id),
      next_focus TEXT NOT NULL,
      rationale TEXT NOT NULL,
      generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consumed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS session_report (
      session_id TEXT PRIMARY KEY REFERENCES session(id),
      summary TEXT NOT NULL,
      strengths TEXT NOT NULL,
      practice_points TEXT NOT NULL,
      new_vocabulary TEXT NOT NULL,
      global_score REAL NOT NULL,
      grammar_score REAL NOT NULL,
      fluency_score REAL NOT NULL,
      vocab_score REAL NOT NULL,
      pronunciation_score REAL NOT NULL,
      next_focus TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seed(database: DatabaseSync) {
  const count = database.prepare('SELECT COUNT(*) as count FROM profile').get() as { count: number };
  if (count.count > 0) return;
  database.prepare(`
    INSERT INTO profile (user_id, display_name, target_level, native_language)
    VALUES ('demo-user', 'Juan Carlos', 'B2', 'es')
  `).run();
  database.prepare(`
    INSERT INTO curriculum_plan (id, user_id, next_focus, rationale)
    VALUES ('plan-demo-1', 'demo-user', 'Past simple vs present perfect in work updates', 'Initial B2 diagnostic focus for professional conversation practice.')
  `).run();
}

export const DEMO_USER_ID = 'demo-user';

export function getProfile(): Profile {
  return db().prepare('SELECT * FROM profile WHERE user_id = ?').get(DEMO_USER_ID) as Profile;
}

export function updateProfile(input: { display_name: string; target_level: string; native_language: string }): Profile {
  db().prepare(`
    UPDATE profile
    SET display_name = ?, target_level = ?, native_language = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(input.display_name, input.target_level, input.native_language, DEMO_USER_ID);
  return getProfile();
}

export function getActivePlan() {
  return db().prepare(`
    SELECT * FROM curriculum_plan
    WHERE user_id = ? AND consumed_at IS NULL
    ORDER BY generated_at DESC
    LIMIT 1
  `).get(DEMO_USER_ID) as { id: string; next_focus: string; rationale: string } | undefined;
}

export function listSessions() {
  return db().prepare(`
    SELECT s.*, r.global_score, r.next_focus
    FROM session s
    LEFT JOIN session_report r ON r.session_id = s.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `).all(DEMO_USER_ID) as Array<Session & { global_score?: number; next_focus?: string }>;
}

export function getSession(id: string): Session | undefined {
  return db().prepare('SELECT * FROM session WHERE id = ? AND user_id = ?').get(id, DEMO_USER_ID) as Session | undefined;
}

export function getReport(sessionId: string): SessionReport | undefined {
  const row = db().prepare('SELECT * FROM session_report WHERE session_id = ?').get(sessionId) as any;
  if (!row) return undefined;
  return {
    ...row,
    strengths: JSON.parse(row.strengths),
    practice_points: JSON.parse(row.practice_points),
    new_vocabulary: JSON.parse(row.new_vocabulary)
  };
}

export function createSession() {
  const profile = getProfile();
  const plan = getActivePlan();
  const focus = plan?.next_focus ?? 'Introducing yourself and describing recent work';
  const id = crypto.randomUUID();
  const prompt = buildTeacherPrompt({ name: profile.display_name, level: profile.target_level, focus });
  db().prepare(`
    INSERT INTO session (id, user_id, focus, level, status, prompt_used, prompt_version)
    VALUES (?, ?, ?, ?, 'prepared', ?, 'v1-entrega2-mock')
  `).run(id, DEMO_USER_ID, focus, profile.target_level, prompt);
  if (plan) {
    db().prepare('UPDATE curriculum_plan SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?').run(plan.id);
  }
  return getSession(id)!;
}

export function startSession(id: string) {
  db().prepare(`
    UPDATE session SET status = 'in_progress', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(id, DEMO_USER_ID);
  return getSession(id)!;
}

export function finishAndAnalyze(id: string, transcript: string) {
  const session = getSession(id);
  if (!session) throw new Error('Session not found');
  const analysis = analyzeTranscript(transcript, session.focus, session.level);
  const database = db();
  database.prepare(`
    UPDATE session
    SET status = 'reported', transcript = ?, ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(transcript, id, DEMO_USER_ID);

  database.prepare('DELETE FROM learning_error WHERE session_id = ?').run(id);
  for (const error of analysis.errors) {
    database.prepare(`
      INSERT INTO learning_error (session_id, kind, excerpt, correction, explanation, severity)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, error.kind, error.excerpt, error.correction, error.explanation, error.severity);
  }

  for (const word of analysis.vocabulary) {
    database.prepare(`
      INSERT INTO vocabulary_item (user_id, lemma, times_used, mastery_score)
      VALUES (?, ?, 1, 0.35)
      ON CONFLICT(user_id, lemma) DO UPDATE SET
        times_used = times_used + 1,
        mastery_score = min(1.0, mastery_score + 0.08),
        updated_at = CURRENT_TIMESTAMP
    `).run(DEMO_USER_ID, word);
  }

  database.prepare(`
    INSERT OR REPLACE INTO progress_snapshot (user_id, session_id, fluency_score, grammar_score, vocab_score, pronunciation_score)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(DEMO_USER_ID, id, analysis.scores.fluency, analysis.scores.grammar, analysis.scores.vocab, analysis.scores.pronunciation);

  database.prepare(`
    INSERT OR REPLACE INTO session_report
    (session_id, summary, strengths, practice_points, new_vocabulary, global_score, grammar_score, fluency_score, vocab_score, pronunciation_score, next_focus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    analysis.summary,
    JSON.stringify(analysis.strengths),
    JSON.stringify(analysis.practicePoints),
    JSON.stringify(analysis.vocabulary),
    analysis.scores.global,
    analysis.scores.grammar,
    analysis.scores.fluency,
    analysis.scores.vocab,
    analysis.scores.pronunciation,
    analysis.nextFocus
  );

  database.prepare(`
    INSERT INTO curriculum_plan (id, user_id, next_focus, rationale)
    VALUES (?, ?, ?, ?)
  `).run(crypto.randomUUID(), DEMO_USER_ID, analysis.nextFocus, analysis.nextFocusRationale);

  return { session: getSession(id)!, report: getReport(id)! };
}

export function progressSummary() {
  const snapshots = db().prepare(`
    SELECT * FROM progress_snapshot
    WHERE user_id = ?
    ORDER BY created_at ASC
  `).all(DEMO_USER_ID) as Array<any>;
  const vocab = db().prepare(`
    SELECT lemma, times_used, mastery_score FROM vocabulary_item
    WHERE user_id = ? ORDER BY mastery_score ASC, times_used DESC LIMIT 10
  `).all(DEMO_USER_ID);
  const errors = db().prepare(`
    SELECT kind, excerpt, correction, COUNT(*) as count
    FROM learning_error le
    JOIN session s ON s.id = le.session_id
    WHERE s.user_id = ?
    GROUP BY kind, excerpt, correction
    ORDER BY count DESC, max(le.severity) DESC
    LIMIT 10
  `).all(DEMO_USER_ID);
  return { snapshots, vocab, errors };
}

export function buildTeacherPrompt(input: { name: string; level: string; focus: string }) {
  return `You are Habla, a patient English speaking coach. Student: ${input.name}. CEFR target: ${input.level}. Session focus: ${input.focus}. Keep the session under 10 minutes, speak only English during practice, ask one question at a time, and collect evidence for feedback. After the session, provide bilingual feedback.`;
}

type Analysis = {
  summary: string;
  strengths: string[];
  practicePoints: string[];
  vocabulary: string[];
  errors: Array<{ kind: string; excerpt: string; correction: string; explanation: string; severity: number }>;
  scores: { global: number; grammar: number; fluency: number; vocab: number; pronunciation: number };
  nextFocus: string;
  nextFocusRationale: string;
};

export function analyzeTranscript(transcript: string, focus: string, level: string): Analysis {
  const normalized = transcript.trim();
  const wordCount = normalized ? normalized.split(/\s+/).length : 0;
  const usedPast = /\b(went|had|built|worked|spoke|did|made|was|were)\b/i.test(normalized);
  const usedConnectors = /\b(because|however|although|therefore|while|since)\b/i.test(normalized);
  const fillerCount = (normalized.match(/\b(uh|um|like|you know)\b/gi) ?? []).length;
  const grammar = Math.min(92, 62 + (usedPast ? 12 : 0) + (usedConnectors ? 8 : 0) + Math.min(10, wordCount / 8));
  const fluency = Math.max(45, Math.min(90, 70 + Math.min(12, wordCount / 10) - fillerCount * 4));
  const vocab = Math.min(88, 58 + (usedConnectors ? 10 : 0) + Math.min(14, wordCount / 7));
  const pronunciation = Math.max(55, Math.min(86, 76 - fillerCount * 3));
  const global = Math.round((grammar + fluency + vocab + pronunciation) / 4);
  const errors = [];
  if (!usedPast) {
    errors.push({
      kind: 'grammar',
      excerpt: 'I work yesterday / I go last week',
      correction: 'I worked yesterday / I went last week',
      explanation: 'Para contar experiencias terminadas necesitas pasado simple, no presente.',
      severity: 2
    });
  }
  if (!usedConnectors) {
    errors.push({
      kind: 'vocab',
      excerpt: 'Short disconnected answers',
      correction: 'Use connectors: because, however, although, therefore',
      explanation: 'Los conectores hacen que tus respuestas suenen más naturales y B2.',
      severity: 1
    });
  }
  if (fillerCount > 1) {
    errors.push({
      kind: 'fluency',
      excerpt: 'Repeated fillers: uh/um/like',
      correction: 'Pause silently instead of filling the gap',
      explanation: 'Las pausas cortas suenan más profesionales que muletillas repetidas.',
      severity: 1
    });
  }
  return {
    summary: `Sesión ${level} sobre “${focus}”. El alumno produjo ${wordCount} palabras y el sistema generó feedback adaptativo con mocks controlados para Entrega 2.`,
    strengths: [
      'Responde al foco de la sesión con contenido relevante.',
      'Puede mantener una conversación corta de práctica.',
      usedConnectors ? 'Usa conectores para explicar ideas.' : 'Tiene base suficiente para añadir conectores.'
    ],
    practicePoints: errors.length ? errors.map((e) => e.explanation) : ['Mantener el mismo foco y subir dificultad con preguntas de seguimiento.'],
    vocabulary: usedConnectors ? ['however', 'therefore', 'although'] : ['because', 'however', 'therefore'],
    errors,
    scores: {
      global,
      grammar: Math.round(grammar),
      fluency: Math.round(fluency),
      vocab: Math.round(vocab),
      pronunciation: Math.round(pronunciation)
    },
    nextFocus: usedPast ? 'Use connectors to give longer B2 answers in work conversations' : 'Past simple for recent work experiences',
    nextFocusRationale: usedPast ? 'El alumno ya mostró pasado simple; conviene subir naturalidad con conectores.' : 'El análisis detectó necesidad de reforzar pasado simple en experiencias terminadas.'
  };
}
