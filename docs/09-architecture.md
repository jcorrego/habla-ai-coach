# Architecture — Habla Entrega 2

## Objetivo del MVP

Demostrar un loop funcional de AI speaking coach sin depender todavía de voz/LLM real:

```text
perfil → escenario → sesión preparada → transcript demo → análisis → reporte → progreso → siguiente foco
```

## Diagrama lógico

```text
Next.js UI
  ↓ fetch
API routes
  ↓
Habla store / repository
  ↓
SQLite local o MySQL Forge
```

## Componentes

### UI

- `app/page.tsx`: demo principal, onboarding, selector de escenarios, sesión, reporte e historial.
- `app/status/page.tsx`: estado operativo visual para demostrar healthcheck y DB activa.

### API

- `GET /api/health`: estado de app + driver DB.
- `GET /api/profile`, `POST /api/profile`: perfil demo.
- `GET /api/scenarios`: escenarios de práctica.
- `GET /api/sessions`, `POST /api/sessions`: historial y preparación de sesión.
- `POST /api/sessions/:id/start`: transición a sesión en progreso.
- `POST /api/sessions/:id/finish`: análisis mock + reporte + progreso.
- `GET /api/progress`: snapshots, vocabulario y errores recurrentes.
- `POST /api/demo/seed`: reset de dataset demo.

### Persistencia

`lib/habla-store.ts` concentra:

- selección de driver (`HABLA_DB_DRIVER`)
- migración automática de tablas
- seed inicial
- escenarios demo
- operaciones de sesión/reporte/progreso
- healthcheck

Local usa `node:sqlite`; producción usa `mysql2` contra MySQL 8.

## Escenarios de práctica

La Entrega 2 incluye escenarios para que la demo parezca producto y no solo CRUD:

1. Daily standup / work update
2. Job interview story
3. Project pitch
4. Casual small talk

Cada escenario trae:

- título
- descripción
- foco pedagógico
- transcript demo editable

## Qué está mockeado

- Voz real.
- LLM real.
- Pronunciación real.
- Autenticación/multiusuario.

## Qué sí es real

- UI desplegada.
- API routes server-side.
- Persistencia en MySQL producción.
- Migración automática de tablas.
- Healthcheck.
- Historial, reportes, vocabulario y progreso persistidos.
- Auto deploy desde Forge.

## Testing

La Entrega 2 combina dos niveles:

```text
node:test  → contrato de archivos, lógica de análisis, escenarios y seed demo
Playwright → flujo navegador: home, seed demo, escenario, sesión, reporte y /status
```

Comandos:

```bash
npm run test:unit
npm run test:e2e
npm run test
```

## Evolución natural

1. Proteger `POST /api/demo/seed` o quitarlo al salir de demo.
2. Añadir auth real.
3. Sustituir transcript demo por grabación/audio upload.
4. Crear `ProviderGateway` para OpenAI Realtime/Gemini Live.
5. Persistir audio/transcripción real.
6. Ampliar tests Playwright con casos de error, móvil y regresión visual.
