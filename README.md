# Habla AI Coach

Entrega 2 del Proyecto Final AI4Devs — **código funcional (primer MVP ejecutable)**.

## Producto

**Habla** es un AI speaking coach para practicar inglés conversacional. El MVP implementa el loop principal definido en la Entrega 1:

```text
perfil → preparar sesión → sesión simulada → análisis → reporte → siguiente foco adaptativo → historial/progreso
```

> Nota: PersonaPlex se mantiene como línea de investigación de voz. El producto se llama **Habla**.

## Alcance de Entrega 2

Esta rama añade una primera implementación funcional con:

- Frontend Next.js con dashboard, perfil, sesión y reporte.
- Backend mediante API routes de Next.js.
- Base de datos SQLite local usando `node:sqlite` y soporte MySQL 8 para producción en Forge.
- Persistencia de perfil, sesiones, errores, vocabulario, snapshots de progreso, reportes y planes curriculares.
- Página `/status` y endpoint `/api/health` para comprobar app/DB en producción.
- Escenarios de práctica demo y seed de datos para presentación.
- Mock controlado de proveedor de voz/LLM para no bloquear el flujo E2E por integraciones externas.
- Tests básicos de contrato de entrega.

## Stack

- Next.js / React / TypeScript
- API routes server-side como backend MVP
- SQLite local (`data/habla.db`) / MySQL 8 en producción
- Node.js 26+

## Ejecutar en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrir:

```text
http://localhost:3000
```

## Scripts

```bash
npm run test
npm run build
npm run start
```

## Flujo demo

1. Abrir `/`.
2. Revisar/editar el perfil demo.
3. Opcional: pulsar **Seed demo** para preparar historial limpio.
4. Seleccionar un escenario de práctica.
5. Pulsar **Preparar sesión**.
6. Pulsar **Iniciar**.
7. Revisar o editar la transcripción simulada.
8. Pulsar **Finalizar y analizar**.
9. Ver el reporte generado y el historial conectado a BD.

## API MVP

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/profile` | Devuelve perfil demo. |
| `POST` | `/api/profile` | Actualiza perfil demo. |
| `GET` | `/api/sessions` | Lista historial de sesiones. |
| `POST` | `/api/sessions` | Prepara sesión y genera prompt. |
| `GET` | `/api/sessions/:id` | Devuelve sesión + reporte. |
| `POST` | `/api/sessions/:id/start` | Marca sesión como `in_progress`. |
| `POST` | `/api/sessions/:id/finish` | Guarda transcripción, analiza y genera reporte. |
| `GET` | `/api/progress` | Devuelve snapshots, vocabulario y errores recurrentes. |
| `GET` | `/api/health` | Healthcheck de app y base de datos. |
| `GET` | `/api/scenarios` | Devuelve escenarios de práctica demo. |
| `POST` | `/api/demo/seed` | Resetea y prepara datos demo. |

## Base de datos

La app soporta dos drivers mediante variables de entorno:

```env
# Local
HABLA_DB_DRIVER=sqlite
HABLA_DB_PATH=data/habla.db

# Producción Forge
HABLA_DB_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=habla
MYSQL_USER=habla
MYSQL_PASSWORD=[REDACTED]
```

La BD local se crea automáticamente en:

```text
data/habla.db
```

En Forge se usa MySQL 8 con las variables reales configuradas en el panel del site, no en Git.

Tablas principales:

- `profile`
- `session`
- `learning_error`
- `vocabulary_item`
- `progress_snapshot`
- `curriculum_plan`
- `session_report`

Healthcheck:

```text
GET /api/health
```

Responde el estado de la app y el driver activo (`sqlite` o `mysql`).

Página visual de estado:

```text
/status
```

Documentación adicional:

- `docs/08-production-deploy.md`
- `docs/09-architecture.md`

## Decisiones para llegar al MVP

- Se usa un usuario demo en lugar de Supabase Auth real para poder cerrar un flujo E2E ejecutable en poco tiempo.
- Se usa SQLite local como BD conectada y MySQL 8 en producción Forge. La documentación de Entrega 1 sigue proponiendo Supabase como evolución natural.
- La conversación de voz y el análisis IA están mockeados, pero encapsulados en funciones (`buildTeacherPrompt`, `finishAndAnalyze`, `analyzeTranscript`) para sustituir por OpenAI Realtime/Gemini Live + Whisper.
- El PR de Entrega 2 debe usar iniciales **JCO**: `feature-entrega2-JCO`.

## Próximos pasos hacia entrega final

1. Reemplazar usuario demo por Supabase Auth.
2. Migrar autenticación y permisos a Supabase Auth/Postgres con RLS si el producto avanza más allá del MVP.
3. Implementar `ProviderGateway` real con OpenAI Realtime o Gemini Live.
4. Integrar transcripción real.
5. Añadir Playwright E2E real sobre navegador.
6. Desplegar frontend/backend y configurar secretos.

## Registro de IA

Ver `prompts.md`.
