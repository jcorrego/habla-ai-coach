# Investigacion de voz y baja latencia

## 1. Objetivo

El diferencial tecnico de Habla no debe depender solo de "usar voz". La experiencia debe sentirse como una conversacion real: baja latencia, interrupciones naturales, turn-taking fluido y capacidad de extraer datos utiles para el loop pedagogico.

Por eso la Entrega 2 debe incluir un spike comparativo de motores de voz antes de cerrar proveedor definitivo.

## 2. Criterios de evaluacion

| Criterio | Por que importa |
|---|---|
| Primera respuesta | Si tarda demasiado, el alumno sale del modo conversacional. |
| Barge-in real | El alumno debe poder interrumpir y corregir sin esperar silencios artificiales. |
| Falsas interrupciones | Un "yeah", ruido o respiracion no deberia cortar al profesor IA. |
| Full-duplex | Escuchar mientras habla permite solapes y backchannels mas humanos. |
| Transcripcion util | El producto necesita evidencia para feedback, errores y progreso. |
| Control pedagogico | Debe respetar nivel CEFR, objetivo de sesion y tono de profesor. |
| Coste por minuto | Las sesiones son recurrentes; el coste condiciona viabilidad. |
| Facilidad de despliegue | El MVP debe llegar a una URL publica sin infraestructura exotica. |
| Lock-in | Conviene encapsular proveedor para poder cambiarlo. |

## 3. Opciones relevantes

### PersonaPlex

PersonaPlex, basado en la investigacion de NVIDIA, es atractivo porque apunta directamente al problema de conversacion natural full-duplex: speech-to-speech, escucha mientras habla, role conditioning y voice conditioning. La API publica personaplex.io promete latencia de unos 170 ms y soporte de interrupciones.

Ventajas:

- Diferenciador tecnico fuerte.
- Full-duplex como primitiva del modelo, no solo como orquestacion externa.
- Potencial menor lock-in si se exploran pesos abiertos.
- Encaja con la linea de investigacion del proyecto.

Riesgos:

- Ecosistema menos maduro que OpenAI/Gemini.
- Integracion y despliegue pueden ser mas inciertos.
- Si se ejecuta local/self-hosted, puede requerir GPU seria.
- Menos garantias para una demo evaluable en fecha.

Uso recomendado:

- Mantenerlo como spike/research.
- No bloquear el MVP por PersonaPlex.
- Evaluarlo si demuestra latencia, calidad y transcripcion aprovechable.

### OpenAI Realtime

OpenAI Realtime es el candidato pragmatico para MVP por madurez, WebRTC/WebSocket/SIP y foco explicito en baja latencia de voz.

Ventajas:

- Buena probabilidad de funcionar en navegador y despliegue.
- WebRTC reduce latencia y simplifica audio en browser.
- Modelo realtime generalista con tool use y control por eventos.
- Ecosistema de documentacion y ejemplos mas maduro.

Riesgos:

- Coste y limites de uso.
- Menor control sobre internals del modelo.
- Lock-in de proveedor.

Uso recomendado:

- Primer candidato para el MVP si las pruebas de latencia y coste son aceptables.

### Gemini Live API

Gemini Live es el segundo candidato hosted fuerte. Puede ser especialmente interesante si la calidad de Native Audio, multi-turn y multimodalidad encaja con aprendizaje.

Ventajas:

- Buen encaje con sesiones conversacionales.
- Potencial multimodal futuro.
- Integracion con ecosistema Google.

Riesgos:

- Cambios frecuentes en modelos/API.
- Calidad de interrupciones y transcripcion debe validarse empiricamente.

Uso recomendado:

- Compararlo contra OpenAI Realtime con el mismo guion de prueba.

### Vapi

Vapi es mas una plataforma de orquestacion de voice agents que un modelo. Su punto fuerte es que ataca problemas reales de conversacion: endpointing, barge-in, backchanneling, ruido de fondo y deteccion de falsas interrupciones.

Ventajas:

- Capa conversacional especializada.
- Buen fit si queremos llamadas/telefonia o voice agent productivo rapido.
- Configuraciones de interrupcion y endpointing.

Riesgos:

- Mas plataforma cerrada.
- Menos control fino del stack.
- Puede ser excesivo para una app educativa web si solo necesitamos sesiones cortas.

Uso recomendado:

- Evaluarlo como benchmark de UX conversacional y posible fallback de producto.

### Deepgram Voice Agent / Flux

Deepgram destaca por STT, turn detection y barge-in semantico. Es relevante si se decide construir una arquitectura cascada: STT + LLM + TTS.

Ventajas:

- Turn detection mas semantico que un VAD simple.
- Menos falsas interrupciones por ruido.
- Transcripcion de buena calidad, clave para feedback pedagogico.

Riesgos:

- Requiere componer mas piezas.
- La latencia final depende del LLM y TTS elegidos.

Uso recomendado:

- Candidato para una arquitectura modular si OpenAI/Gemini no dan suficiente control de transcripcion.

### ElevenLabs y Cartesia

ElevenLabs y Cartesia son relevantes sobre todo por TTS. ElevenLabs aporta calidad expresiva y configuracion de conversation flow; Cartesia Sonic destaca por WebSocket TTS de muy baja latencia.

Ventajas:

- Voces naturales y expresivas.
- Cartesia puede reducir mucho time-to-first-audio en arquitecturas cascadas.
- ElevenLabs puede acelerar prototipos de agentes conversacionales.

Riesgos:

- No resuelven por si solos todo el problema de dialogo pedagogico.
- Turn-taking/interrupciones dependen de la orquestacion y STT.

Uso recomendado:

- Considerarlos si se construye pipeline modular o si la voz de OpenAI/Gemini no convence.

## 4. Matriz inicial

| Opcion | Madurez MVP | Diferenciacion | Control | Riesgo | Recomendacion |
|---|---:|---:|---:|---:|---|
| OpenAI Realtime | Alta | Media | Media | Bajo/medio | Candidato MVP principal |
| Gemini Live | Media/alta | Media | Media | Medio | Segundo candidato hosted |
| PersonaPlex | Media/baja | Alta | Alta si self-hosted | Alto | Spike research |
| Vapi | Alta | Media/alta | Baja/media | Medio | Benchmark UX / fallback |
| Deepgram + LLM + TTS | Media | Media/alta | Alta | Medio/alto | Opcion modular |
| ElevenLabs/Cartesia | Media | Media | Media | Medio | Piezas TTS/orquestacion |

## 5. Prueba propuesta para Entrega 2

Ejecutar el mismo guion de 3 minutos en al menos dos proveedores hosted y, si es viable, PersonaPlex:

1. Saludo y pregunta abierta.
2. Interrupcion corta del alumno mientras el profesor habla.
3. Correccion del alumno: "No, I meant..."
4. Pausa con backchannel: "yeah", "uh-huh".
5. Mini role-play sobre una situacion de trabajo.
6. Cierre y extraccion de transcripcion.

Medir:

- Tiempo hasta primera respuesta.
- Tiempo despues de interrupcion.
- Numero de falsas interrupciones.
- Calidad subjetiva de turn-taking.
- Calidad de transcripcion.
- Coste estimado por sesion de 10 minutos.

## 6. Decision recomendada hoy

Documentar Habla como producto provider-agnostic con `VoiceProviderGateway`.

Para Entrega 2:

- Implementar primero con OpenAI Realtime o Gemini Live.
- Dejar PersonaPlex como experimento diferencial.
- No acoplar UI ni modelo de datos a ningun proveedor.
