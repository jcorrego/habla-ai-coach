# Entrega 2 — Implementation notes

## Rama

```text
feature-entrega2-JCO
```

## Nombre del producto

Confirmado desde PR #1 y documentación: **Habla**.

PersonaPlex queda como research de proveedor/modelo de voz, no como nombre del producto.

## Qué implementa este PR

- App web Next.js con UI de dashboard/perfil/sesión/reporte.
- Backend por API routes.
- SQLite local conectado con `node:sqlite` y MySQL 8 opcional para producción Forge.
- Creación de sesión con prompt generado.
- Inicio/finalización de sesión.
- Análisis mock determinista de transcript.
- Reporte persistido.
- Vocabulario, errores, snapshots de progreso y plan adaptativo persistidos.
- README y `prompts.md`.
- Tests de contrato de Entrega 2.

## Producción Forge

Forge usa auto deploy desde `feature-entrega2-JCO`. En producción se configura MySQL 8 por variables de entorno:

```env
HABLA_DB_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=habla
MYSQL_USER=habla
MYSQL_PASSWORD=[REDACTED]
```

Localmente se mantiene SQLite:

```env
HABLA_DB_DRIVER=sqlite
HABLA_DB_PATH=data/habla.db
```

El endpoint `GET /api/health` reporta si la app puede conectar a la base de datos y qué driver está activo.

## Verificación realizada

```bash
npm run test
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Flujo verificado con `curl`:

1. `GET /api/profile`
2. `POST /api/sessions`
3. `POST /api/sessions/:id/start`
4. `POST /api/sessions/:id/finish`
5. `GET /api/progress`
6. `GET /api/health`

Resultado: se creó una sesión, pasó a `reported`, generó reporte y guardó progreso/vocabulario en la base de datos activa.

## Limitaciones explícitas

- Voz real mockeada.
- Supabase/Auth real pendiente para entrega final.
- SQLite local usado como base de datos conectada para MVP ejecutable; MySQL 8 usado en producción Forge.
- Pronunciación estimada heurísticamente porque no hay audio real.
