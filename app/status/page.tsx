import Link from 'next/link';
import { getDbHealth } from '@/lib/habla-store';

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  const health = await getDbHealth();
  const checkedAt = new Date().toISOString();

  return (
    <main className="page">
      <section className="card stack">
        <span className="kicker">Production status</span>
        <h1>Habla status</h1>
        <p>Resumen operativo para demostrar que el MVP tiene backend real, healthcheck y base de datos conectada.</p>
        <div className="grid">
          <div className="metric"><span>App</span><strong>{health.ok ? 'OK' : 'ERROR'}</strong></div>
          <div className="metric"><span>Database</span><strong>{health.driver}</strong></div>
          <div className="metric"><span>Environment</span><strong>{health.environment}</strong></div>
        </div>
        <div className="grid-2">
          <div className="metric"><span>Sesiones demo</span><strong>{health.session_count}</strong></div>
          <div className="metric"><span>Checked at</span><strong className="small-strong">{checkedAt}</strong></div>
        </div>
        <div className="row">
          <Link href="/" className="btn">Volver a la demo</Link>
          <a href="/api/health" className="btn secondary">Ver JSON health</a>
        </div>
      </section>
    </main>
  );
}
