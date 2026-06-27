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
- SQLite local conectado con `node:sqlite`.
- Creación de sesión con prompt generado.
- Inicio/finalización de sesión.
- Análisis mock determinista de transcript.
- Reporte persistido.
- Vocabulario, errores, snapshots de progreso y plan adaptativo persistidos.
- README y `prompts.md`.
- Tests de contrato de Entrega 2.

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

Resultado: se creó una sesión, pasó a `reported`, generó reporte y guardó progreso/vocabulario en SQLite.

## Limitaciones explícitas

- Voz real mockeada.
- Supabase/Auth real pendiente para entrega final.
- SQLite local usado como base de datos conectada para MVP ejecutable.
- Pronunciación estimada heurísticamente porque no hay audio real.
