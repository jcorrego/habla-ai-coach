# prompts.md — Registro de uso de IA

Este archivo documenta el uso de IA durante la Entrega 2 del Proyecto Final AI4Devs.

## Contexto general entregado a IA

```text
Producto: Habla, AI speaking coach para práctica de inglés conversacional.
Objetivo Entrega 2: código funcional con backend, frontend y base de datos conectados, flujo principal casi completo.
Base: documentación de Entrega 1 en docs/.
Restricción: no hay avance de código previo; construir un MVP pragmático y ejecutable.
Iniciales para rama/PR: JCO.
```

## Prompt de planificación usado con Hermes/Zoe

```text
Revisa la documentación de la primera entrega en el PR abierto del repo. Confirma si el nombre del producto es PersonaPlex o Habla. Usa las iniciales JCO para la rama de Entrega 2. Implementa un MVP funcional que conecte frontend, backend y base de datos, aunque voz/LLM queden mockeados si es necesario para cerrar el flujo E2E.
```

## Decisiones humanas aplicadas

- El producto confirmado es **Habla**.
- PersonaPlex queda como línea de investigación de voz, no como nombre del producto.
- La Entrega 2 se hace sobre el repo existente de la primera entrega.
- La rama debe usar iniciales **JCO**.
- Como no había código previo, se priorizó un MVP ejecutable sobre integración real de voz.

## Prompt lógico implementado para profesor IA

El sistema genera prompts de sesión con esta plantilla:

```text
You are Habla, a patient English speaking coach.
Student: <name>.
CEFR target: <level>.
Session focus: <focus>.
Keep the session under 10 minutes, speak only English during practice, ask one question at a time, and collect evidence for feedback. After the session, provide bilingual feedback.
```

## Prompt lógico del análisis post-sesión

En Entrega 2 el análisis es una simulación determinista inspirada en este comportamiento esperado:

```text
Analyze the student's transcript for grammar, fluency, vocabulary and pronunciation signals. Return a bilingual report with strengths, practice points, new vocabulary, a global score and a recommended next session focus. Be conservative: give actionable feedback, not long explanations.
```

## Herramientas de IA usadas

- Hermes/Zoe: coordinación, lectura de documentación, implementación, verificación, planificación de entrega.
- Claude/Codex: disponibles para delegación si el tiempo requiere refactors o revisión; en esta primera pasada el MVP fue implementado directamente por Hermes para reducir overhead.

## Limitaciones conocidas

- No se usó voz real; el proveedor de voz está mockeado.
- No se conectó Supabase; se usa SQLite local para cumplir conexión backend/frontend/BD de forma ejecutable.
- No hay autenticación real; se usa usuario demo.
- Los scores de pronunciación son heurísticos porque no existe audio real en el MVP.

## Cómo se corrigió el rumbo con criterio humano

La documentación original proponía una arquitectura más completa con Next.js + FastAPI + Supabase + proveedor de voz. Dado el plazo y la ausencia de código previo, se eligió reducir alcance para entregar valor verificable:

- mantener el modelo de datos conceptual,
- implementar flujo E2E,
- documentar mocks,
- dejar puntos de sustitución claros para la entrega final.
