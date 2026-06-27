'use client';

import { useEffect, useMemo, useState } from 'react';

type Profile = { display_name: string; target_level: string; native_language: string };
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

const demoTranscript = `Teacher: Tell me about a recent work challenge.
Student: Last week I worked on an AI automation project. It was difficult because the requirements changed, however I made a small plan and explained the tradeoffs to the team.`;

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [transcript, setTranscript] = useState(demoTranscript);
  const [loading, setLoading] = useState(false);
  const latestScore = useMemo(() => sessions.find((s) => s.global_score)?.global_score ?? '—', [sessions]);

  async function refresh() {
    const [profileResponse, sessionsResponse] = await Promise.all([fetch('/api/profile'), fetch('/api/sessions')]);
    setProfile(await profileResponse.json());
    const sessionPayload = await sessionsResponse.json();
    setSessions(sessionPayload.sessions);
  }

  useEffect(() => { refresh(); }, []);

  async function updateProfile(formData: FormData) {
    setLoading(true);
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
    setLoading(false);
  }

  async function prepareSession() {
    setLoading(true);
    const response = await fetch('/api/sessions', { method: 'POST' });
    const session = await response.json();
    setActiveSession(session);
    setReport(null);
    await refresh();
    setLoading(false);
  }

  async function startSession() {
    if (!activeSession) return;
    setLoading(true);
    const response = await fetch(`/api/sessions/${activeSession.id}/start`, { method: 'POST' });
    setActiveSession(await response.json());
    await refresh();
    setLoading(false);
  }

  async function finishSession() {
    if (!activeSession) return;
    setLoading(true);
    const response = await fetch(`/api/sessions/${activeSession.id}/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    const payload = await response.json();
    setActiveSession(payload.session);
    setReport(payload.report);
    await refresh();
    setLoading(false);
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <span className="kicker">Entrega 2 · MVP funcional</span>
          <h1>Habla</h1>
          <p>
            AI speaking coach para practicar inglés con sesiones cortas, análisis post-sesión y un plan adaptativo para la siguiente práctica.
          </p>
          <div className="row">
            <button className="btn" onClick={prepareSession} disabled={loading}>Preparar sesión</button>
            <a className="btn secondary" href="#historial">Ver historial</a>
          </div>
        </div>
        <div className="card stack">
          <span className="badge">Demo user conectado a SQLite</span>
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
          <h2>2. Sesión preparada</h2>
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
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>3. Conversación simulada para demo</h2>
        <p>Entrega 2 usa un proveedor de voz mockeado para demostrar el flujo E2E. La arquitectura mantiene `ProviderGateway` para sustituirlo por OpenAI Realtime/Gemini Live.</p>
        <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} />
      </section>

      {report && (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>4. Reporte personalizado</h2>
          <p>{report.summary}</p>
          <div className="grid">
            <Score label="Global" value={report.global_score} />
            <Score label="Gramática" value={report.grammar_score} />
            <Score label="Fluidez" value={report.fluency_score} />
          </div>
          <div className="grid-2" style={{ marginTop: 16 }}>
            <List title="Fortalezas" items={report.strengths} />
            <List title="Practicar ahora" items={report.practice_points} />
          </div>
          <p><b>Siguiente foco adaptativo:</b> {report.next_focus}</p>
        </section>
      )}

      <section id="historial" className="card" style={{ marginTop: 16 }}>
        <h2>Historial conectado a BD</h2>
        <ul className="timeline">
          {sessions.map((session) => (
            <li key={session.id}>
              <b>{session.focus}</b><br />
              <span>{session.status} · {session.created_at} {session.global_score ? `· score ${session.global_score}` : ''}</span>
            </li>
          ))}
          {sessions.length === 0 && <li>No hay sesiones todavía.</li>}
        </ul>
      </section>

      <p className="footer-note">MVP Entrega 2: frontend Next.js + backend API routes + SQLite conectado. Proveedor de voz/LLM mockeado y documentado para no bloquear la entrega.</p>
    </main>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><div className="score"><span style={{ width: `${value}%` }} /></div></div>;
}

function List({ title, items }: { title: string; items: string[] }) {
  return <div><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}
