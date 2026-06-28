# Production deploy — Habla Entrega 2

## URL final

```text
https://habla.tuklon.ai
```

## Branch de auto deploy

Forge despliega automáticamente desde:

```text
feature-entrega2-JCO
```

## Runtime

- Next.js App Router
- API routes server-side
- PM2 gestionado por Laravel Forge
- Dominio y SSL gestionados desde Forge

## Base de datos

Localmente se usa SQLite para desarrollo rápido:

```env
HABLA_DB_DRIVER=sqlite
HABLA_DB_PATH=data/habla.db
```

En producción Forge se usa MySQL 8:

```env
HABLA_DB_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=habla
MYSQL_USER=habla
MYSQL_PASSWORD=[REDACTED]
MYSQL_CONNECTION_LIMIT=5
```

Los secretos reales viven en el `.env` del site en Forge y no se commitean al repo.

## Healthcheck

```text
GET /api/health
```

Respuesta esperada en producción:

```json
{
  "ok": true,
  "app": "habla-ai-coach",
  "product": "Habla",
  "db": "mysql",
  "environment": "production"
}
```

También existe una página visual:

```text
/status
```

## Demo seed

Para preparar una demo limpia:

```text
POST /api/demo/seed
```

Esto reinicia los datos del usuario demo y crea sesiones históricas con escenarios predefinidos. Es intencionalmente simple para la Entrega 2: demuestra persistencia real sin introducir autenticación/multiusuario todavía.

## Flujo demo recomendado

1. Abrir `https://habla.tuklon.ai`.
2. Mostrar badges de app, DB y environment.
3. Abrir `/status` para mostrar healthcheck visual.
4. Volver a `/`.
5. Pulsar `Seed demo` si se quiere historial limpio.
6. Seleccionar escenario.
7. Preparar sesión.
8. Iniciar sesión.
9. Finalizar y analizar.
10. Mostrar reporte, vocabulario, score e historial persistido.

## Riesgos controlados

- Voz/LLM real siguen mockeados.
- Solo hay usuario demo.
- El endpoint de seed es para demo; en una versión productiva real se protegería con auth/admin.
- MySQL se usa en producción, SQLite local sigue disponible para desarrollo.
