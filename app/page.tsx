'use client';

import { useEffect, useMemo, useState } from 'react';

type Profile = { display_name: string; target_level: string; native_language: string };
type Health = { ok: boolean; app: string; product: string; db: string; environment: string; session_count: number };
type Scenario = { id: string; title: string; description: string; focus: string; transcript: string };
type SessionRow = { id: string; focus: string; level: string; status: string; created_at: string; global_score?: number; next_focus?: string };
type Report = {
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
};

const fallbackTranscript = `Teacher: Tell me about a recent work challenge.
Student: Last week I worked on an AI automation project. It was difficult because the requirements changed, however I made a small plan and explained the tradeoffs to the team.`;

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('work-update');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [transcript, setTranscript] = useState(fallbackTranscript);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const latestScore = useMemo(() => sessions.find((s) => s.global_score)?.global_score ?? '—', [sessions]);
  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId);

  async function refresh() {
    const [profileResponse, sessionsResponse, healthResponse, scenariosResponse] = await Promise.all([
      fetch('/api/profile'),
      fetch('/api/sessions'),
      fetch('/api/health'),
      fetch('/api/scenarios')
    ]);
    setProfile(await profileResponse.json());
    const sessionPayload = await sessionsResponse.json();
    setSessions(sessionPayload.sessions);
    setHealth(await healthResponse.json());
    const scenarioPayload = await scenariosResponse.json();
    setScenarios(scenarioPayload.scenarios);
    if (!selectedScenarioId && scenarioPayload.scenarios[0]) setSelectedScenarioId(scenarioPayload.scenarios[0].id);
  }

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (selectedScenario) setTranscript(selectedScenario.transcript);
  }, [selectedScenarioId, selectedScenario]);

  async function updateProfile(formData: FormData) {
    setLoading(true);
    setNotice('Guardando perfil...');
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: formData.get('display_name'),
        target_level: formData.get('target_level'),
        native_language: formData.get('native_language')
      })
    });
    await refresh();
    setNotice('Perfil guardado.');
    setLoading(false);
  }

  async function prepareSession() {
    setLoading(true);
    setNotice('Preparando sesión y generando prompt...');
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: selectedScenarioId })
    });
    const session = await response.json();
    setActiveSession(session);
    setReport(null);
    await refresh();
    setNotice('Sesión preparada y persistida.');
    setLoading(false);
  }

  async function startSession() {
    if (!activeSession) return;
    setLoading(true);
    setNotice('Iniciando sesión...');
    const response = await fetch(`/api/sessions/${activeSession.id}/start`, { method: 'POST' });
    setActiveSession(await response.json());
    await refresh();
    setNotice('Sesión en progreso.');
    setLoading(false);
  }

  async function finishSession() {
    if (!activeSession) return;
    setLoading(true);
    setNotice('Analizando transcript y guardando reporte...');
    const response = await fetch(`/api/sessions/${activeSession.id}/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    const payload = await response.json();
    setActiveSession(payload.session);
    setReport(payload.report);
    await refresh();
    setNotice('Reporte generado. Historial y progreso actualizados.');
    setLoading(false);
  }

  async function seedDemo() {
    setLoading(true);
    setNotice('Recreando dataset demo...');
    await fetch('/api/demo/seed', { method: 'POST' });
    setActiveSession(null);
    setReport(null);
    await refresh();
    setNotice('Demo seed listo: historial, vocabulario y progreso quedan preparados.');
    setLoading(false);
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <span className="kicker">Entrega 2 · MVP funcional desplegado</span>
          <h1>Habla</h1>
          <p>
            AI speaking coach para practicar inglés con sesiones cortas, análisis post-sesión y un plan adaptativo para la siguiente práctica.
          </p>
          <div className="row">
            <button className="btn" onClick={prepareSession} disabled={loading}>Preparar sesión</button>
            <button className="btn secondary" onClick={seedDemo} disabled={loading}>Seed demo</button>
            <a className="btn secondary" href="/status">Ver status</a>
          </div>
          {notice && <p className="notice">{notice}</p>}
        </div>
        <div className="card stack">
          <div className="row">
            <span className={`badge ${health?.ok ? 'ok' : 'warn'}`}>{health?.ok ? 'App OK' : 'Revisando app'}</span>
            <span className="badge">DB: {health?.db ?? '...'}</span>
            <span className="badge">{health?.environment ?? '...'}</span>
          </div>
          <div className="grid">
            <div className="metric"><span>Alumno</span><strong>{profile?.display_name ?? '...'}</strong></div>
            <div className="metric"><span>Nivel</span><strong>{profile?.target_level ?? '...'}</strong></div>
            <div className="metric"><span>Último score</span><strong>{latestScore}</strong></div>
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <h2>1. Perfil / onboarding</h2>
          <form className="stack" action={updateProfile}>
            <label>Nombre
              <input name="display_name" defaultValue={profile?.display_name ?? ''} />
            </label>
            <label>Nivel objetivo
              <select name="target_level" defaultValue={profile?.target_level ?? 'B2'}>
                {['A1','A2','B1','B2','C1','C2'].map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <label>Idioma nativo
              <input name="native_language" defaultValue={profile?.native_language ?? 'es'} />
            </label>
            <button className="btn" disabled={loading}>Guardar perfil</button>
          </form>
        </div>

        <div className="card stack">
          <h2>2. Escenario de práctica</h2>
          <label>Selecciona demo
            <select value={selectedScenarioId} onChange={(event) => setSelectedScenarioId(event.target.value)}>
              {scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.title}</option>)}
            </select>
          </label>
          <p>{selectedScenario?.description ?? 'Carga escenarios para preparar una práctica.'}</p>
          <div className="metric"><span>Foco pedagógico</span><strong>{selectedScenario?.focus ?? '...'}</strong></div>
        </div>
      </section>

      <section className="card stack" style={{ marginTop: 16 }}>
        <h2>3. Sesión preparada</h2>
        {activeSession ? (
          <>
            <div className="metric"><span>Foco</span><strong>{activeSession.focus}</strong></div>
            <p><b>Estado:</b> {activeSession.status}</p>
            <details>
              <summary>Prompt generado</summary>
              <p>{activeSession.prompt_used}</p>
            </details>
            <div className="row">
              <button className="btn secondary" onClick={startSession} disabled={loading || activeSession.status !== 'prepared'}>Iniciar</button>
              <button className="btn" onClick={finishSession} disabled={loading || activeSession.status === 'reported'}>Finalizar y analizar</button>
            </div>
          </>
        ) : <p>Prepara una sesión para crear el registro en base de datos y generar el prompt.</p>}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>4. Conversación simulada para demo</h2>
        <p>Entrega 2 usa un proveedor de voz mockeado para demostrar el flujo E2E. Cambia el escenario o edita la transcripción para ver cómo cambia el análisis.</p>
        <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} />
      </section>

      {report && (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>5. Reporte personalizado</h2>
          <p>{report.summary}</p>
          <div className="grid">
            <Score label="Global" value={report.global_score} />
            <Score label="Gramática" value={report.grammar_score} />
            <Score label="Fluidez" value={report.fluency_score} />
            <Score label="Vocabulario" value={report.vocab_score} />
            <Score label="Pronunciación" value={report.pronunciation_score} />
          </div>
          <div className="grid-2" style={{ marginTop: 16 }}>
            <List title="Fortalezas" items={report.strengths} />
            <List title="Practicar ahora" items={report.practice_points} />
          </div>
          <p><b>Vocabulario nuevo:</b> {report.new_vocabulary.join(', ')}</p>
          <p><b>Siguiente foco adaptativo:</b> {report.next_focus}</p>
        </section>
      )}

      <section id="historial" className="card" style={{ marginTop: 16 }}>
        <h2>Historial conectado a BD</h2>
        <ul className="timeline">
          {sessions.map((session) => (
            <li key={session.id}>
              <b>{session.focus}</b><br />
              <span>{session.status} · {formatDate(session.created_at)} {session.global_score ? `· score ${session.global_score}` : ''}</span>
            </li>
          ))}
          {sessions.length === 0 && <li>No hay sesiones todavía.</li>}
        </ul>
      </section>

      <p className="footer-note">MVP Entrega 2: frontend Next.js + API routes + persistencia SQLite/MySQL + demo seed. Voz/LLM real mockeado para mantener una entrega estable.</p>
    </main>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><div className="score"><span style={{ width: `${value}%` }} /></div></div>;
}

function List({ title, items }: { title: string; items: string[] }) {
  return <div><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}
