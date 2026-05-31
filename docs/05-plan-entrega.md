# Plan de entrega

## 1. Entregas del proyecto final

| Entrega | Fecha | Rama sugerida | Resultado esperado |
|---|---:|---|---|
| Entrega 1 | 2026-05-31 con prorroga | `feature-entrega1-jc` | Documentacion tecnica: producto, arquitectura, modelo de datos e historias. |
| Entrega 2 | 2026-06-24 | `feature-entrega2-jc` | MVP funcional con backend, frontend y base de datos conectados. |
| Final | 2026-07-14 | `finalproject-jc` | Version completa desplegada, tests, README, prompts y evidencia. |

## 2. Alcance Entrega 1

Incluido:

- Idea y propuesta de valor.
- PRD inicial.
- Arquitectura tecnica.
- Modelo de datos.
- Historias de usuario con criterios de aceptacion.
- Backlog inicial.
- Plan de calidad y riesgos.
- Registro de prompts.

No incluido:

- Implementacion funcional.
- Despliegue publico.
- Tests automatizados reales.
- Decision final del proveedor de voz.

## 3. Alcance Entrega 2

Objetivo: demostrar el flujo E2E minimo con datos reales persistidos.

Debe incluir:

- Repo inicial con frontend Next.js y backend FastAPI.
- Supabase configurado para Auth y Postgres.
- Login y onboarding.
- Preparacion de sesion.
- Sesion oral minima con proveedor elegido.
- Finalizacion de sesion.
- Transcripcion y reporte basico.
- Dashboard simple.
- Tests unitarios/integracion para servicios principales.
- Al menos una prueba E2E del flujo principal, aunque sea con mocks controlados del proveedor IA.

## 4. Alcance Final

Debe incluir:

- Aplicacion desplegada.
- URL publica o acceso para evaluadores.
- Flujo E2E estable.
- Suite de tests completa: unitarios, integracion y al menos un E2E realista.
- Observabilidad basica.
- README final con instrucciones de ejecucion.
- `prompts.md` con trazabilidad de IA.
- Evidencia de despliegue y ejecucion.
- Tag opcional `v1.0-final-jc`.

## 5. Estrategia de calidad

### Tests

| Tipo | Objetivo |
|---|---|
| Unitarios backend | PromptBuilder, CurriculumPlanner, scoring y validaciones. |
| Integracion backend | Endpoints de sesion, reporte y progreso con DB de test. |
| Unitarios frontend | Componentes de reporte, dashboard y estados de sesion. |
| E2E | Login simulado, preparar sesion, finalizar, ver reporte. |

### Gates CI

- Backend: format, lint, typecheck si aplica, tests.
- Frontend: lint, typecheck, build, tests.
- E2E: ejecucion en entorno preview con mocks para proveedor de voz si el coste/latencia lo requiere.

### Revisiones humanas

- Revisar prompts generados por el sistema antes de usarlos con alumnos reales.
- Validar una muestra de reportes para evitar feedback incorrecto o pedagogicamente pobre.
- Revisar textos bilingues para que sean utiles y no excesivamente largos.

## 6. Gestion de secretos

Secretos esperados:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` u `OPENAI_API_KEY`
- `WHISPER_API_KEY` si aplica
- `LATITUDE_API_KEY`
- `SENTRY_DSN`

Reglas:

- No commitear `.env`.
- Mantener `.env.example` con nombres sin valores reales.
- Separar claves de frontend y backend.
- Service role solo en backend.

## 7. Riesgos

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Latencia alta de voz | Mala experiencia de conversacion | Probar Gemini y OpenAI antes de Entrega 2; elegir por latencia real. |
| Coste por sesion alto | Dificulta demo y pruebas | Limitar duracion, usar mocks en E2E y trazas de coste. |
| Analisis incorrecto | Feedback poco confiable | Prompt versionado, validacion manual de muestras, severidad conservadora. |
| Complejidad WebRTC | Retrasa MVP | Encapsular proveedor en `ProviderGateway`; fallback a flujo semi-sincrono si hace falta. |
| Privacidad de audio | Riesgo reputacional | RLS, storage privado, minimizacion de logs. |
| Scope creep | No llegar al MVP | Mantener Must-have estricto y dejar drills/PDF para Should-have. |

## 8. Decisiones pendientes

| Decision | Opciones | Criterio |
|---|---|---|
| Proveedor de voz | Gemini Live API / OpenAI Realtime API | Latencia, coste, calidad de turn-taking, integracion. |
| Hosting backend | Railway / Fly.io | WebSocket, free tier, facilidad de secrets. |
| Storage audio | Supabase Storage / Cloudflare R2 | Simplicidad vs coste. |
| Jobs async | Background task FastAPI / Inngest / Trigger.dev | Simplicidad MVP vs robustez. |
| Proveedor de observabilidad | Latitude / Sentry / logs estructurados | Trazabilidad de prompts, errores, latencia, coste y calidad del analisis. |

## 9. Plan inmediato para cerrar Entrega 1

1. Revisar la documentacion tecnica contra la plantilla oficial de LIDR.
2. Actualizar `README.md` con el indice oficial del proyecto final.
3. Confirmar que la PR muestra la creacion completa de la documentacion desde `main`.
4. Adjuntar el enlace de la PR en el formulario de LIDR.
5. Confirmar si el repo compartido `AI4Devs-finalproject` requiere PR ahora o solo en la entrega final.

## 10. Borrador de descripcion de PR

```markdown
## Descripcion

Entrega 1 del Proyecto Final AI4Devs: documentacion tecnica de Habla, un sistema de practica de ingles conversacional con IA y curriculum adaptativo.

## Cambios incluidos

- PRD del producto.
- Arquitectura tecnica propuesta.
- Modelo de datos inicial.
- Historias de usuario Must/Should con criterios de aceptacion.
- Backlog inicial y plan de entrega.
- Registro de prompts utilizados.

## Alcance

Esta entrega no incluye implementacion funcional. Deja especificado el MVP que se implementara en la Entrega 2.

## Herramientas de IA utilizadas

- Codex: consolidacion de documentacion tecnica a partir de brief del proyecto y contexto del curso.
- Luke/brief previo: ideacion y contexto inicial del sistema de practica de ingles conversacional.
```
