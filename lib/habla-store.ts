import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Pool } from 'mysql2/promise';

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

type DbDriver = 'sqlite' | 'mysql';
type QueryParams = Array<string | number | null>;

type HablaDb = {
  driver: DbDriver;
  exec(sql: string): Promise<void>;
  get<T>(sql: string, params?: QueryParams): Promise<T | undefined>;
  all<T>(sql: string, params?: QueryParams): Promise<T[]>;
  run(sql: string, params?: QueryParams): Promise<void>;
};

const dataDir = path.join(process.cwd(), 'data');
const configuredDriver = (process.env.HABLA_DB_DRIVER ?? process.env.DB_DRIVER ?? 'sqlite').toLowerCase();
export const HABLA_DB_DRIVER: DbDriver = configuredDriver === 'mysql' ? 'mysql' : 'sqlite';
export const DEMO_USER_ID = 'demo-user';

export type PracticeScenario = {
  id: string;
  title: string;
  description: string;
  focus: string;
  transcript: string;
};

export const PRACTICE_SCENARIOS: PracticeScenario[] = [
  {
    id: 'work-update',
    title: 'Daily standup / work update',
    description: 'Practica explicar avances, bloqueos y próximos pasos en un contexto profesional.',
    focus: 'Use connectors to give longer B2 answers in work conversations',
    transcript: 'Teacher: Give me a concise work update. Student: Last week I worked on a production deployment because the project needed a real demo. However, I found a database issue and fixed it before the release.'
  },
  {
    id: 'job-interview',
    title: 'Job interview story',
    description: 'Responde preguntas de entrevista usando pasado simple, logros y tradeoffs.',
    focus: 'Tell a structured work achievement using past simple and impact metrics',
    transcript: 'Teacher: Tell me about a project you are proud of. Student: I built an automation workflow because the team spent too much time on manual reports. Therefore, we saved time and improved consistency.'
  },
  {
    id: 'project-pitch',
    title: 'Project pitch',
    description: 'Presenta Habla en inglés con claridad, problema, solución y siguiente paso.',
    focus: 'Pitch a product idea with problem, solution, evidence and next step',
    transcript: 'Teacher: Pitch your product in one minute. Student: Habla helps Spanish speakers practice English speaking. It creates short sessions, analyzes mistakes, and recommends the next focus, although the current MVP uses mock voice.'
  },
  {
    id: 'casual-small-talk',
    title: 'Casual small talk',
    description: 'Practica conversación natural para romper el hielo sin sonar robótico.',
    focus: 'Sound natural in casual small talk using follow-up questions',
    transcript: 'Teacher: What did you do this weekend? Student: I went for a walk and worked on a small app because I wanted to practice. After that, I watched a movie and relaxed.'
  }
];

export function listPracticeScenarios() {
  return PRACTICE_SCENARIOS;
}

export function getPracticeScenario(id?: string | null) {
  return PRACTICE_SCENARIOS.find((scenario) => scenario.id === id) ?? PRACTICE_SCENARIOS[0];
}

declare global {
  // eslint-disable-next-line no-var
  var hablaDb: HablaDb | undefined;
  // eslint-disable-next-line no-var
  var hablaMysqlPool: Pool | undefined;
}

export async function db() {
  if (!globalThis.hablaDb) {
    globalThis.hablaDb = HABLA_DB_DRIVER === 'mysql' ? await createMysqlDb() : createSqliteDb();
    await migrate(globalThis.hablaDb);
    await seed(globalThis.hablaDb);
  }
  return globalThis.hablaDb;
}

function createSqliteDb(): HablaDb {
  mkdirSync(dataDir, { recursive: true });
  const dbPath = process.env.HABLA_DB_PATH ?? path.join(dataDir, 'habla.db');
  const database = new DatabaseSync(dbPath);
  return {
    driver: 'sqlite',
    async exec(sql: string) {
      database.exec(sql);
    },
    async get<T>(sql: string, params: QueryParams = []) {
      return database.prepare(sql).get(...params) as T | undefined;
    },
    async all<T>(sql: string, params: QueryParams = []) {
      return database.prepare(sql).all(...params) as T[];
    },
    async run(sql: string, params: QueryParams = []) {
      database.prepare(sql).run(...params);
    }
  };
}

async function createMysqlDb(): Promise<HablaDb> {
  const mysql = await import('mysql2/promise');
  globalThis.hablaMysqlPool ??= mysql.createPool({
    host: process.env.MYSQL_HOST ?? process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? process.env.DB_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE ?? process.env.DB_DATABASE,
    user: process.env.MYSQL_USER ?? process.env.DB_USERNAME,
    password: process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 5),
    namedPlaceholders: false,
    timezone: 'Z'
  });
  const pool = globalThis.hablaMysqlPool;
  return {
    driver: 'mysql',
    async exec(sql: string) {
      for (const statement of sql.split(';').map((entry) => entry.trim()).filter(Boolean)) {
        await pool.query(statement);
      }
    },
    async get<T>(sql: string, params: QueryParams = []) {
      const [rows] = await pool.query(sql, params);
      return (rows as T[])[0];
    },
    async all<T>(sql: string, params: QueryParams = []) {
      const [rows] = await pool.query(sql, params);
      return rows as T[];
    },
    async run(sql: string, params: QueryParams = []) {
      await pool.query(sql, params);
    }
  };
}

async function migrate(database: HablaDb) {
  if (database.driver === 'mysql') return migrateMysql(database);
  return migrateSqlite(database);
}

async function migrateSqlite(database: HablaDb) {
  await database.exec(`
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

async function migrateMysql(database: HablaDb) {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      user_id VARCHAR(64) PRIMARY KEY,
      display_name VARCHAR(255) NOT NULL,
      target_level VARCHAR(16) NOT NULL,
      native_language VARCHAR(16) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      focus TEXT NOT NULL,
      level VARCHAR(16) NOT NULL,
      status VARCHAR(32) NOT NULL,
      prompt_used TEXT NOT NULL,
      prompt_version VARCHAR(64) NOT NULL,
      transcript TEXT NULL,
      audio_url TEXT NULL,
      started_at TIMESTAMP NULL,
      ended_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_session_user_created (user_id, created_at),
      CONSTRAINT fk_session_profile FOREIGN KEY (user_id) REFERENCES profile(user_id)
    );

    CREATE TABLE IF NOT EXISTS learning_error (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL,
      kind VARCHAR(64) NOT NULL,
      excerpt TEXT NOT NULL,
      correction TEXT NOT NULL,
      explanation TEXT NOT NULL,
      severity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_learning_error_session (session_id),
      CONSTRAINT fk_learning_error_session FOREIGN KEY (session_id) REFERENCES session(id)
    );

    CREATE TABLE IF NOT EXISTS vocabulary_item (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      lemma VARCHAR(255) NOT NULL,
      times_used INT NOT NULL DEFAULT 1,
      mastery_score DOUBLE NOT NULL DEFAULT 0.2,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_vocabulary_user_lemma (user_id, lemma),
      CONSTRAINT fk_vocabulary_profile FOREIGN KEY (user_id) REFERENCES profile(user_id)
    );

    CREATE TABLE IF NOT EXISTS progress_snapshot (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      session_id VARCHAR(64) NOT NULL UNIQUE,
      fluency_score DOUBLE NOT NULL,
      grammar_score DOUBLE NOT NULL,
      vocab_score DOUBLE NOT NULL,
      pronunciation_score DOUBLE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_progress_user_created (user_id, created_at),
      CONSTRAINT fk_progress_profile FOREIGN KEY (user_id) REFERENCES profile(user_id),
      CONSTRAINT fk_progress_session FOREIGN KEY (session_id) REFERENCES session(id)
    );

    CREATE TABLE IF NOT EXISTS curriculum_plan (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      next_focus TEXT NOT NULL,
      rationale TEXT NOT NULL,
      generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consumed_at TIMESTAMP NULL,
      INDEX idx_curriculum_user_generated (user_id, generated_at),
      CONSTRAINT fk_curriculum_profile FOREIGN KEY (user_id) REFERENCES profile(user_id)
    );

    CREATE TABLE IF NOT EXISTS session_report (
      session_id VARCHAR(64) PRIMARY KEY,
      summary TEXT NOT NULL,
      strengths JSON NOT NULL,
      practice_points JSON NOT NULL,
      new_vocabulary JSON NOT NULL,
      global_score DOUBLE NOT NULL,
      grammar_score DOUBLE NOT NULL,
      fluency_score DOUBLE NOT NULL,
      vocab_score DOUBLE NOT NULL,
      pronunciation_score DOUBLE NOT NULL,
      next_focus TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_report_session FOREIGN KEY (session_id) REFERENCES session(id)
    );
  `);
}

async function seed(database: HablaDb) {
  const count = await database.get<{ count: number }>('SELECT COUNT(*) as count FROM profile');
  if ((count?.count ?? 0) > 0) return;
  await database.run(
    'INSERT INTO profile (user_id, display_name, target_level, native_language) VALUES (?, ?, ?, ?)',
    [DEMO_USER_ID, 'Juan Carlos', 'B2', 'es']
  );
  await database.run(
    'INSERT INTO curriculum_plan (id, user_id, next_focus, rationale) VALUES (?, ?, ?, ?)',
    ['plan-demo-1', DEMO_USER_ID, 'Past simple vs present perfect in work updates', 'Initial B2 diagnostic focus for professional conversation practice.']
  );
}

export async function getDbHealth() {
  const database = await db();
  const result = await database.get<{ ok: number }>('SELECT 1 as ok');
  const sessionCount = await database.get<{ count: number }>('SELECT COUNT(*) as count FROM session WHERE user_id = ?', [DEMO_USER_ID]);
  return {
    ok: result?.ok === 1,
    driver: database.driver,
    environment: process.env.NODE_ENV ?? 'development',
    session_count: sessionCount?.count ?? 0
  };
}

export async function getProfile(): Promise<Profile> {
  return (await (await db()).get<Profile>('SELECT * FROM profile WHERE user_id = ?', [DEMO_USER_ID])) as Profile;
}

export async function updateProfile(input: { display_name: string; target_level: string; native_language: string }): Promise<Profile> {
  await (await db()).run(
    'UPDATE profile SET display_name = ?, target_level = ?, native_language = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [input.display_name, input.target_level, input.native_language, DEMO_USER_ID]
  );
  return getProfile();
}

export async function getActivePlan() {
  return (await db()).get<{ id: string; next_focus: string; rationale: string }>(`
    SELECT * FROM curriculum_plan
    WHERE user_id = ? AND consumed_at IS NULL
    ORDER BY generated_at DESC
    LIMIT 1
  `, [DEMO_USER_ID]);
}

export async function listSessions() {
  return (await db()).all<Session & { global_score?: number; next_focus?: string }>(`
    SELECT s.*, r.global_score, r.next_focus
    FROM session s
    LEFT JOIN session_report r ON r.session_id = s.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `, [DEMO_USER_ID]);
}

export async function getSession(id: string): Promise<Session | undefined> {
  return (await db()).get<Session>('SELECT * FROM session WHERE id = ? AND user_id = ?', [id, DEMO_USER_ID]);
}

export async function getReport(sessionId: string): Promise<SessionReport | undefined> {
  const row = await (await db()).get<any>('SELECT * FROM session_report WHERE session_id = ?', [sessionId]);
  if (!row) return undefined;
  return {
    ...row,
    strengths: typeof row.strengths === 'string' ? JSON.parse(row.strengths) : row.strengths,
    practice_points: typeof row.practice_points === 'string' ? JSON.parse(row.practice_points) : row.practice_points,
    new_vocabulary: typeof row.new_vocabulary === 'string' ? JSON.parse(row.new_vocabulary) : row.new_vocabulary
  };
}

export async function createSession(scenarioId?: string) {
  const profile = await getProfile();
  const plan = await getActivePlan();
  const scenario = getPracticeScenario(scenarioId);
  const focus = scenarioId ? scenario.focus : (plan?.next_focus ?? scenario.focus);
  const id = crypto.randomUUID();
  const prompt = buildTeacherPrompt({ name: profile.display_name, level: profile.target_level, focus });
  const database = await db();
  await database.run(
    "INSERT INTO session (id, user_id, focus, level, status, prompt_used, prompt_version) VALUES (?, ?, ?, ?, 'prepared', ?, 'v1-entrega2-mock')",
    [id, DEMO_USER_ID, focus, profile.target_level, prompt]
  );
  if (plan) {
    await database.run('UPDATE curriculum_plan SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?', [plan.id]);
  }
  return getSession(id);
}

export async function startSession(id: string) {
  await (await db()).run(
    "UPDATE session SET status = 'in_progress', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
    [id, DEMO_USER_ID]
  );
  const session = await getSession(id);
  if (!session) throw new Error('Session not found');
  return session;
}

export async function finishAndAnalyze(id: string, transcript: string) {
  const session = await getSession(id);
  if (!session) throw new Error('Session not found');
  const analysis = analyzeTranscript(transcript, session.focus, session.level);
  const database = await db();
  await database.run(
    "UPDATE session SET status = 'reported', transcript = ?, ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
    [transcript, id, DEMO_USER_ID]
  );

  await database.run('DELETE FROM learning_error WHERE session_id = ?', [id]);
  for (const error of analysis.errors) {
    await database.run(
      'INSERT INTO learning_error (session_id, kind, excerpt, correction, explanation, severity) VALUES (?, ?, ?, ?, ?, ?)',
      [id, error.kind, error.excerpt, error.correction, error.explanation, error.severity]
    );
  }

  for (const word of analysis.vocabulary) {
    if (database.driver === 'mysql') {
      await database.run(`
        INSERT INTO vocabulary_item (user_id, lemma, times_used, mastery_score)
        VALUES (?, ?, 1, 0.35)
        ON DUPLICATE KEY UPDATE
          times_used = times_used + 1,
          mastery_score = LEAST(1.0, mastery_score + 0.08),
          updated_at = CURRENT_TIMESTAMP
      `, [DEMO_USER_ID, word]);
    } else {
      await database.run(`
        INSERT INTO vocabulary_item (user_id, lemma, times_used, mastery_score)
        VALUES (?, ?, 1, 0.35)
        ON CONFLICT(user_id, lemma) DO UPDATE SET
          times_used = times_used + 1,
          mastery_score = min(1.0, mastery_score + 0.08),
          updated_at = CURRENT_TIMESTAMP
      `, [DEMO_USER_ID, word]);
    }
  }

  if (database.driver === 'mysql') {
    await database.run(`
      INSERT INTO progress_snapshot (user_id, session_id, fluency_score, grammar_score, vocab_score, pronunciation_score)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        fluency_score = VALUES(fluency_score),
        grammar_score = VALUES(grammar_score),
        vocab_score = VALUES(vocab_score),
        pronunciation_score = VALUES(pronunciation_score)
    `, [DEMO_USER_ID, id, analysis.scores.fluency, analysis.scores.grammar, analysis.scores.vocab, analysis.scores.pronunciation]);

    await database.run(`
      INSERT INTO session_report
      (session_id, summary, strengths, practice_points, new_vocabulary, global_score, grammar_score, fluency_score, vocab_score, pronunciation_score, next_focus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        summary = VALUES(summary), strengths = VALUES(strengths), practice_points = VALUES(practice_points),
        new_vocabulary = VALUES(new_vocabulary), global_score = VALUES(global_score), grammar_score = VALUES(grammar_score),
        fluency_score = VALUES(fluency_score), vocab_score = VALUES(vocab_score), pronunciation_score = VALUES(pronunciation_score),
        next_focus = VALUES(next_focus)
    `, [id, analysis.summary, JSON.stringify(analysis.strengths), JSON.stringify(analysis.practicePoints), JSON.stringify(analysis.vocabulary), analysis.scores.global, analysis.scores.grammar, analysis.scores.fluency, analysis.scores.vocab, analysis.scores.pronunciation, analysis.nextFocus]);
  } else {
    await database.run(`
      INSERT OR REPLACE INTO progress_snapshot (user_id, session_id, fluency_score, grammar_score, vocab_score, pronunciation_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [DEMO_USER_ID, id, analysis.scores.fluency, analysis.scores.grammar, analysis.scores.vocab, analysis.scores.pronunciation]);

    await database.run(`
      INSERT OR REPLACE INTO session_report
      (session_id, summary, strengths, practice_points, new_vocabulary, global_score, grammar_score, fluency_score, vocab_score, pronunciation_score, next_focus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, analysis.summary, JSON.stringify(analysis.strengths), JSON.stringify(analysis.practicePoints), JSON.stringify(analysis.vocabulary), analysis.scores.global, analysis.scores.grammar, analysis.scores.fluency, analysis.scores.vocab, analysis.scores.pronunciation, analysis.nextFocus]);
  }

  await database.run(
    'INSERT INTO curriculum_plan (id, user_id, next_focus, rationale) VALUES (?, ?, ?, ?)',
    [crypto.randomUUID(), DEMO_USER_ID, analysis.nextFocus, analysis.nextFocusRationale]
  );

  return { session: (await getSession(id))!, report: (await getReport(id))! };
}


export async function resetDemoData() {
  const database = await db();
  await database.run('DELETE FROM learning_error');
  await database.run('DELETE FROM session_report');
  await database.run('DELETE FROM progress_snapshot');
  await database.run('DELETE FROM vocabulary_item WHERE user_id = ?', [DEMO_USER_ID]);
  await database.run('DELETE FROM curriculum_plan WHERE user_id = ?', [DEMO_USER_ID]);
  await database.run('DELETE FROM session WHERE user_id = ?', [DEMO_USER_ID]);
  await database.run('DELETE FROM profile WHERE user_id = ?', [DEMO_USER_ID]);
  await database.run(
    'INSERT INTO profile (user_id, display_name, target_level, native_language) VALUES (?, ?, ?, ?)',
    [DEMO_USER_ID, 'Juan Carlos', 'B2', 'es']
  );
  await database.run(
    'INSERT INTO curriculum_plan (id, user_id, next_focus, rationale) VALUES (?, ?, ?, ?)',
    ['plan-demo-1', DEMO_USER_ID, getPracticeScenario('work-update').focus, 'Demo reset creates a clean B2 learning path for the presentation.']
  );

  for (const scenario of PRACTICE_SCENARIOS.slice(0, 3)) {
    const session = await createSession(scenario.id);
    if (!session) throw new Error(`Could not create demo session for ${scenario.id}`);
    await startSession(session.id);
    await finishAndAnalyze(session.id, scenario.transcript);
  }

  return {
    ok: true,
    profile: await getProfile(),
    sessions: await listSessions(),
    progress: await progressSummary()
  };
}

export async function progressSummary() {
  const database = await db();
  const snapshots = await database.all<any>(`
    SELECT * FROM progress_snapshot
    WHERE user_id = ?
    ORDER BY created_at ASC
  `, [DEMO_USER_ID]);
  const vocab = await database.all(`
    SELECT lemma, times_used, mastery_score FROM vocabulary_item
    WHERE user_id = ? ORDER BY mastery_score ASC, times_used DESC LIMIT 10
  `, [DEMO_USER_ID]);
  const maxSeverity = database.driver === 'mysql' ? 'MAX(le.severity)' : 'max(le.severity)';
  const errors = await database.all(`
    SELECT kind, excerpt, correction, COUNT(*) as count
    FROM learning_error le
    JOIN session s ON s.id = le.session_id
    WHERE s.user_id = ?
    GROUP BY kind, excerpt, correction
    ORDER BY count DESC, ${maxSeverity} DESC
    LIMIT 10
  `, [DEMO_USER_ID]);
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
