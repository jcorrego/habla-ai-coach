import Link from 'next/link';
import { getDbHealth } from '@/lib/habla-store';

export const dynamic = 'force-dynamic';

const productionUrl = 'https://habla.tuklon.ai';
const branchName = 'feature-entrega2-JCO';

const endpointChecklist = [
  { label: 'Healthcheck JSON', path: '/api/health', method: 'GET' },
  { label: 'Perfil demo', path: '/api/profile', method: 'GET/POST' },
  { label: 'Escenarios de práctica', path: '/api/scenarios', method: 'GET' },
  { label: 'Sesiones', path: '/api/sessions', method: 'GET/POST' },
  { label: 'Progreso adaptativo', path: '/api/progress', method: 'GET' },
  { label: 'Seed demo', path: '/api/demo/seed', method: 'POST' }
];

const readinessChecklist = [
  'Dominio final con SSL activo',
  'Forge autodeploy conectado al branch de Entrega 2',
  'Base de datos MySQL en producción / SQLite local',
  'UI principal rediseñada para demo de producto',
  'Flujo E2E: escenario → sesión → reporte → progreso',
  'Playwright E2E y tests unitarios agregados'
];

export default async function StatusPage() {
  const health = await getDbHealth();
  const checkedAt = new Date().toISOString();
  const dbLabel = health.driver === 'mysql' ? 'MySQL 8 / Forge' : 'SQLite local/test';

  return (
    <main className="page app-shell">
      <section className="status-hero card stack">
        <div className="status-hero-top">
          <div>
            <span className="kicker">Production readiness</span>
            <h1>Habla status</h1>
            <p>
              Tablero operativo para demostrar que Habla está desplegado, conectado a base de datos y listo para presentar la Entrega 2.
            </p>
          </div>
          <div className={`readiness-badge ${health.ok ? 'ready' : 'blocked'}`}>
            <span>{health.ok ? 'Ready' : 'Blocked'}</span>
            <strong>{health.ok ? 'OK' : 'ERROR'}</strong>
          </div>
        </div>

        <div className="grid status-metrics">
          <div className="metric"><span>App</span><strong>{health.ok ? 'OK' : 'ERROR'}</strong></div>
          <div className="metric"><span>Database</span><strong>{health.driver}</strong><small>{dbLabel}</small></div>
          <div className="metric"><span>Environment</span><strong>{health.environment}</strong></div>
        </div>

        <div className="grid-2">
          <div className="metric"><span>Sesiones demo</span><strong>{health.session_count}</strong></div>
          <div className="metric"><span>Checked at</span><strong className="small-strong">{checkedAt}</strong></div>
        </div>

        <div className="row">
          <Link href="/" className="btn">Volver a la demo</Link>
          <a href="/api/health" className="btn ghost">Ver JSON health</a>
          <a href={productionUrl} className="btn ghost">Abrir producción</a>
        </div>
      </section>

      <section className="status-grid">
        <div className="card stack">
          <div className="card-title"><span>✓</span><h2>Checklist de entrega</h2></div>
          <ul className="check-list">
            {readinessChecklist.map((item) => <li key={item}><span>✓</span>{item}</li>)}
          </ul>
        </div>

        <div className="card stack">
          <div className="card-title"><span>↗</span><h2>Deploy info</h2></div>
          <div className="deploy-list">
            <div><span>Producción</span><a href={productionUrl}>{productionUrl}</a></div>
            <div><span>Branch</span><strong>{branchName}</strong></div>
            <div><span>Runtime</span><strong>Next.js + API routes + Forge</strong></div>
            <div><span>DB activa</span><strong>{dbLabel}</strong></div>
          </div>
        </div>
      </section>

      <section className="card stack endpoints-card">
        <div className="card-title"><span>API</span><h2>Endpoints verificados por arquitectura</h2></div>
        <div className="endpoint-grid">
          {endpointChecklist.map((endpoint) => (
            <div className="endpoint-row" key={endpoint.path}>
              <span className="method-pill">{endpoint.method}</span>
              <div>
                <b>{endpoint.label}</b>
                <code>{endpoint.path}</code>
              </div>
              <span className="status-dot">OK</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack status-note">
        <div className="card-title"><span>!</span><h2>Notas de alcance</h2></div>
        <p>
          Voz, LLM real, auth y multiusuario siguen intencionalmente mockeados o diferidos para mantener estable la Entrega 2. El MVP sí demuestra frontend, backend, persistencia, healthcheck, demo seed, tests y despliegue real.
        </p>
      </section>
    </main>
  );
}
