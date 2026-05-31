# Historias de usuario y tickets

## 1. Priorizacion MVP

La Entrega 2 debe centrarse en cerrar un flujo E2E demostrable. El orden recomendado es:

1. Autenticacion y perfil.
2. Preparacion de sesion.
3. Sesion oral minima.
4. Persistencia y analisis.
5. Reporte.
6. Plan adaptativo y dashboard.

## 2. Historias Must-have

### US-01 — Iniciar una sesion de practica

Como alumno, quiero pulsar "empezar sesion" para que el sistema genere una practica oral y conecte con un profesor IA, para practicar ingles sin tener que planificar el tema.

**Criterios de aceptacion**

- Existe una pantalla para iniciar sesion de practica.
- Al pulsar "Empezar", el backend crea una sesion en estado `prepared`.
- El prompt se genera usando perfil, nivel objetivo y plan curricular activo.
- Al iniciar, la sesion pasa a `in_progress`.
- La primera intervencion del profesor IA se reproduce en menos de 3 segundos en condiciones normales.
- La sesion registra `prompt_used`, `prompt_version`, `focus`, `level` y `user_id`.

**Tickets**

| ID | Titulo | Descripcion | Estimacion |
|---|---|---|---|
| T-01 | Crear perfil autenticado | Integrar Supabase Auth y tabla `profile`. | 5 |
| T-02 | Endpoint preparar sesion | Implementar `POST /sessions/prepare`. | 5 |
| T-03 | PromptBuilder inicial | Generar prompt de profesor IA segun nivel y foco. | 3 |
| T-04 | UI de inicio de sesion | Pantalla con CTA, foco propuesto y estado de carga. | 3 |
| T-05 | Conexion inicial proveedor voz | Prototipo WebRTC/WebSocket con proveedor elegido. | 8 |

### US-02 — Terminar sesion y obtener reporte

Como alumno, quiero ver al terminar la sesion que hice bien y que practicar, para saber en que enfocarme.

**Criterios de aceptacion**

- El alumno puede finalizar la sesion desde la interfaz.
- La sesion pasa a `processing`.
- El sistema guarda audio o referencia a audio.
- Se genera transcripcion completa.
- Se detectan errores de gramatica, vocabulario, fluidez y pronunciacion.
- En menos de 60 segundos aparece un reporte con fortalezas, puntos de practica, vocabulario nuevo y score global.
- El reporte queda asociado a la sesion y puede consultarse despues.

**Tickets**

| ID | Titulo | Descripcion | Estimacion |
|---|---|---|---|
| T-06 | Finalizar sesion | Implementar `POST /sessions/{id}/finish`. | 3 |
| T-07 | Storage de audio | Guardar archivo o referencia en Supabase Storage. | 5 |
| T-08 | Integrar transcripcion | Conectar Whisper API o faster-whisper. | 5 |
| T-09 | AnalysisPipeline MVP | Extraer errores, scores y vocabulario desde transcripcion. | 8 |
| T-10 | Reporte de sesion | UI de reporte con resumen, scores y recomendaciones. | 5 |

### US-03 — Ver progreso a lo largo del tiempo

Como alumno, quiero ver mi evolucion por dimension para saber si estoy mejorando.

**Criterios de aceptacion**

- Existe dashboard con ultimas sesiones.
- Se muestran scores de fluidez, gramatica, vocabulario y pronunciacion.
- Se listan errores recurrentes ordenados por frecuencia.
- Se muestra vocabulario visto/usado/dominado.
- El dashboard no muestra datos de otros usuarios.

**Tickets**

| ID | Titulo | Descripcion | Estimacion |
|---|---|---|---|
| T-11 | Endpoint progreso | Implementar `GET /progress`. | 5 |
| T-12 | Persistir snapshots | Crear `progress_snapshot` por sesion reportada. | 3 |
| T-13 | Dashboard progreso | Graficas basicas y resumen de tendencias. | 5 |
| T-14 | Errores recurrentes | Query agregada por tipo y excerpt normalizado. | 3 |

### US-04 — Enfocar la siguiente sesion en mis huecos

Como alumno, quiero que la siguiente sesion practique lo que mas necesito, para no repetir lo que ya domino.

**Criterios de aceptacion**

- El sistema lee errores y snapshots recientes del alumno.
- El `CurriculumPlanner` genera `next_focus` y `rationale`.
- El plan se guarda en `curriculum_plan`.
- La siguiente sesion consume el plan activo.
- El alumno puede ver el foco sugerido antes de empezar.

**Tickets**

| ID | Titulo | Descripcion | Estimacion |
|---|---|---|---|
| T-15 | CurriculumPlanner MVP | Generar foco siguiente con reglas + LLM. | 5 |
| T-16 | Consumir plan activo | Marcar `consumed_at` al preparar sesion. | 3 |
| T-17 | UI foco siguiente | Mostrar foco y motivo en dashboard. | 3 |

### US-05 — Registrarse y entrar

Como alumno, quiero crear mi cuenta para que mi progreso se mantenga entre dispositivos.

**Criterios de aceptacion**

- Login con email magic link o Google OAuth.
- El primer acceso lleva a onboarding.
- El perfil incluye nombre, idioma nativo y nivel objetivo CEFR.
- El usuario autenticado vuelve al dashboard si ya completo onboarding.

**Tickets**

| ID | Titulo | Descripcion | Estimacion |
|---|---|---|---|
| T-18 | Configurar Supabase Auth | Crear proyecto, variables y cliente frontend. | 3 |
| T-19 | Onboarding inicial | Formulario de perfil y validaciones. | 3 |
| T-20 | Guards de rutas | Proteger pantallas privadas en frontend. | 3 |

## 3. Historias Should-have

### US-06 — Practicar pronunciacion de una frase dificil

Como alumno, quiero repetir una frase dificil hasta mejorar la pronunciacion, para corregir errores concretos detectados en mis sesiones.

**Criterios de aceptacion**

- El reporte permite seleccionar una frase marcada como dificil.
- El alumno escucha una referencia.
- El alumno graba repeticiones.
- El sistema devuelve feedback por intento.

### US-07 — Exportar reporte a PDF

Como alumno, quiero exportar mi reporte para revisarlo fuera de la aplicacion o compartirlo con un profesor.

**Criterios de aceptacion**

- Cada reporte tiene opcion de exportar.
- El PDF incluye resumen, scores, errores principales y vocabulario.
- El PDF no expone datos tecnicos internos ni prompts completos.

## 4. Backlog ordenado

| Prioridad | Ticket | Motivo |
|---|---|---|
| 1 | T-18 | Sin autenticacion no hay persistencia de progreso. |
| 2 | T-19 | El perfil alimenta el plan inicial. |
| 3 | T-01 | Base de usuario para el backend. |
| 4 | T-02 | Crea la unidad central del producto: la sesion. |
| 5 | T-03 | Permite personalizacion minima. |
| 6 | T-04 | Hace usable el inicio del flujo. |
| 7 | T-05 | Valida el mayor riesgo tecnico: voz en tiempo real. |
| 8 | T-06 | Cierra el ciclo de sesion. |
| 9 | T-08 | Transcripcion habilita el analisis. |
| 10 | T-09 | Genera valor diferencial del producto. |
| 11 | T-10 | Entrega feedback visible al usuario. |
| 12 | T-12 | Guarda progreso medible. |
| 13 | T-15 | Activa adaptatividad. |
| 14 | T-16 | Conecta una sesion con la siguiente. |
| 15 | T-11 | Expone datos de progreso. |
| 16 | T-13 | Da visibilidad longitudinal. |
| 17 | T-14 | Ayuda a priorizar practica. |
| 18 | T-17 | Explica al usuario por que practica eso. |
| 19 | T-07 | Puede simplificarse al principio si el proveedor da transcripcion suficiente. |
| 20 | T-20 | Necesario antes de produccion, no bloquea prototipo inicial. |

## 5. Definition of Done

Una historia se considera terminada cuando:

- Tiene codigo en frontend y/o backend segun corresponda.
- Tiene tests unitarios o de integracion para la logica critica.
- Tiene al menos una validacion manual documentada.
- No expone secretos.
- Cumple criterios de aceptacion.
- Esta conectada al flujo E2E del MVP o documenta explicitamente su limitacion.
