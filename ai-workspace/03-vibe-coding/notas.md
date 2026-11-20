# Notas de desarrollo con IA

## 20/11/2026 — Plan de implementación y limpieza del repositorio

**Qué se pidió:** un plan de tareas pequeñas y ordenadas para el backend, el frontend y el README, con objetivo, ficheros, criterio de aceptación y verificación de cada tarea. Las ambigüedades de la spec debían señalarse, no decidirse. No se escribe código hasta revisar el plan.

**Qué se hizo:**
- `ai-workspace/01-specs/plan.md`: 11 tareas de backend (B1–B11), 9 de frontend (F1–F9) y 2 de documentación (D1–D2), con el orden de dependencias.
- `.claude/settings.json`: movido desde `.claude/skills/`, donde Claude Code no lo lee.
- `.gitignore`: añadido `.claude/settings.local.json`.
- Borrado el `.docx` original del enunciado. Se mantiene la transcripción en `.md`.
- Sin tests: todavía no hay código nuevo.

**Decisiones de diseño:**
- **Puntos abiertos antes de programar.** El plan arranca con una sección de contradicciones (C1–C8) y huecos de la spec (A1–A15). Cada punto lleva una propuesta por defecto que no se aplica hasta que el desarrollador la apruebe.
- **Dependencias justificadas una a una.** Se descartan `@fastify/cors` (se usa el proxy de Vite) y `fastify-type-provider-zod` (basta con un helper de `safeParse`).
- **Definición de terminado común a todas las tareas:** tests y build en verde, revisión contra CLAUDE.md y la spec, y una nota en este registro.

**Correcciones del desarrollador:**
- La IA propuso una sección inicial que relacionaba cada tarea con los criterios de evaluación del enunciado. El desarrollador la cuestionó y se reescribió como "Principios y definición de terminado", para que el plan hable del proyecto y no de cómo se evalúa.
- Se aprobó borrar el `.docx` original para no publicar en un repositorio público un documento de la empresa.

**Problemas detectados:**
- Los tests de dominio no se han ejecutado nunca porque no existe `package.json`. Queda pendiente para B1.
- Los imports de `domain/` llevan extensión `.js` y los de los tests no, lo que es incompatible con `tsc` en modo NodeNext (C5).
- La spec guarda `tax_rate` como `REAL`, en tensión con la regla de no usar float para el dinero (C2).
- `settings.json` usa reglas `Bash(...)` y el entorno ejecuta PowerShell; está por comprobar si se aplican.
- Quedan pendientes las decisiones de la sección 1 del plan.

## 20/11/2026 — Resolución de las dudas del plan

**Qué se pidió:** decidir todos los puntos abiertos del plan (C1–C8, A1–A15, dependencias y carpetas nuevas) y dejarlos reflejados en la documentación antes de programar.

**Qué se hizo:**
- La IA agrupó las ~30 dudas en tres rondas de preguntas, empezando por las que cambian la arquitectura o la spec.
- `plan.md`: estado "aprobado", tabla de decisiones (§1.4), dos tareas nuevas (B10b `GET /countries` y R1 arranque conjunto) y quitados los avisos ya resueltos.
- `spec.md` pasa a v2: esquema con `tax_rate_percent INTEGER`, límites de los campos, validación del cliente (§3.5), normalización y unicidad del identificador fiscal, tabla de códigos HTTP, detalle del buscador, `GET /countries`, rutas del frontend, divisas y estructura de carpetas. §12 queda cerrada.
- `CLAUDE.md`: carpetas `services/`, `http/` y `frontend/src/config/`, `server.ts`, y códigos 200 y 500.

**Decisiones de diseño:**
- **Tasa de impuesto como porcentaje entero en la BD.** Mantiene la regla de no usar float junto a importes y coincide con la configuración. La API la sigue devolviendo como fracción.
- **`GET /countries` en vez de duplicar la lista de países en el frontend.** Así hay una sola fuente de verdad.
- **Simulador dentro del detalle del cliente.** Guardar necesita un `customerId`, y el historial se actualiza al lado.
- **JSON mal formado → 422,** para no ampliar los códigos de error.
- **Dependencias aprobadas:** `tsx`, `react-router-dom`, Testing Library + `jsdom` y `concurrently`. Descartadas: `@fastify/cors` y `fastify-type-provider-zod`.
- **Las preguntas originales se mantienen en el plan.** Dejan constancia de qué detectó la IA y qué decidió el desarrollador.

**Correcciones del desarrollador:** ninguna. Se aceptaron todas las propuestas por defecto.

**Problemas detectados:** ninguno nuevo. Siguen pendientes para B1 los tests de dominio sin ejecutar, los imports de los tests sin `.js` y las reglas `Bash(...)` de `settings.json`.

## 20/11/2026 — B1: proyecto backend (package.json, TypeScript, Vitest)

**Qué se pidió:** preparar el proyecto backend para compilar y ejecutar por primera vez los tests de dominio que ya existían.

**Qué se hizo:**
- Se crearon `backend/package.json` (ESM, `engines >=26`, scripts `build`, `typecheck`, `test`), `tsconfig.json` (strict + `noUncheckedIndexedAccess`; incluye los tests, sin emitir), `tsconfig.build.json` (solo `src` → `dist/`), `vitest.config.ts` y `.nvmrc`.
- Se añadió `.js` a los imports de `backend/tests/*.test.ts` (C5).
- Se instalaron `better-sqlite3` y, como dependencias de desarrollo, `typescript`, `vitest`, `@types/node` y `@types/better-sqlite3`.
- Se inicializó el repositorio git, con identidad configurada solo para el repo.
- Resultado: **36/36 tests en verde**; typecheck y build sin errores.

**Decisiones de diseño:**
- **Dos tsconfig.** El de typecheck cubre también los tests; el de build solo emite `src`, para no meter los tests en `dist/`.
- **Dependencias por tarea.** Solo se instala lo que usa cada tarea. `better-sqlite3` se adelantó para descubrir pronto si había problemas de compilación nativa en Windows.
- **Sin scripts `dev`/`start` todavía.** Se añadirán en B6, cuando exista `server.ts`, para no dejar un script que falla.

**Correcciones del desarrollador:**
- La spec fijaba Node 20, que ya no tiene soporte (abril de 2026). La IA propuso Node ≥ 22; el desarrollador decidió **Node 26**, la versión que tiene instalada. Se actualizaron la spec, CLAUDE.md, el plan y `directrices-ia.md`.
- La identidad de git (nombre y email) la eligió el desarrollador.

**Problemas detectados:**
- Node y git estaban instalados, pero no en el PATH de la sesión de VS Code. Se añadió la ruta en cada comando; se arregla reiniciando VS Code.
- `npm install` avisa de que no ejecutó `node-gyp rebuild` para `better-sqlite3`. Se investigó antes de darlo por bueno: la v13 trae binarios N-API precompilados para todas las plataformas, así que no hace falta compilar (comprobado con una consulta en memoria). El aviso se explicará en el README.
- La revisión (`/revisar`) encontró referencias a Node 20 en el plan y en `directrices-ia.md` que contradecían la decisión; se corrigieron.
- Versiones mayores muy recientes (TypeScript 7, Vitest 5, better-sqlite3 13): todo funciona, pero hay que tenerlo en cuenta al consultar documentación.

## 20/11/2026 — B2: configuración de entorno

**Qué se pidió:** leer `PORT` y `DB_PATH` desde el entorno, con valores por defecto, en un único sitio validado.

**Qué se hizo:**
- `backend/src/config/env.ts` con `loadEnv(source)`, validado con Zod (`PORT` entero entre 1 y 65535, por defecto 3000; `DB_PATH` no vacío, por defecto `./data/saas-o-matic.db`).
- `backend/.env.example` y `backend/tests/config/env.test.ts` (8 casos).
- Dependencia `zod` (4.6.7), prevista en la spec.
- Resultado: **44/44 tests en verde**; typecheck y build sin errores.

**Decisiones de diseño:**
- **`loadEnv` recibe el entorno como parámetro** en lugar de leer `process.env`. Así se testea sin mocks y queda un único punto de lectura en `server.ts` (B6).
- **Un valor inválido hace fallar el arranque** con un mensaje que nombra la variable, en vez de usar el valor por defecto en silencio.
- Cómo se carga el fichero `.env` se decide en B6, junto con el script `dev`.

**Correcciones del desarrollador:** ninguna.

**Problemas detectados (revisión con `/revisar`, aprobada):**
- Un `PORT=` vacío en `.env` falla en vez de usar el valor por defecto. Se acepta como está.
- `DB_PATH` relativo depende del directorio de trabajo. Se resolverá respecto a `backend/` en B3.

## 20/11/2026 — B3: conexión SQLite y migraciones

**Qué se pidió:** abrir la base de datos con claves foráneas activas y aplicar las migraciones de forma automática e idempotente.

**Qué se hizo:**
- `src/db/connection.ts`: `resolveDbPath` (rutas relativas respecto a `backend/`, no al directorio de trabajo) y `openDatabase` (crea la carpeta y activa `foreign_keys=ON` y `journal_mode=WAL`).
- `src/db/migrate.ts`: `runMigrations` con la tabla `schema_migrations`; cada migración se aplica en su propia transacción.
- `src/db/migrations/001_initial.ts` (esquema de la spec v2, con `tax_rate_percent INTEGER`) e `index.ts`.
- `.gitignore`: `backend/data/` (cubre también los ficheros `-wal` y `-shm` de SQLite).
- Tests: `tests/db/migrate.test.ts` y `tests/db/connection.test.ts` (14 casos).
- Resultado: **58/58 tests en verde**; typecheck y build sin errores.

**Decisiones de diseño:**
- **Migraciones como módulos TS que exportan el SQL,** no como ficheros `.sql`. Así `tsc` las copia a `dist/` sin un paso extra de build.
- **Runner propio en lugar de una librería de migraciones:** son unas 40 líneas y no añaden dependencias.
- **La ruta de la BD se resuelve con `import.meta.url`.** Funciona igual desde `src/` y desde `dist/`, se lance desde donde se lance (comprobado desde `%TEMP%`). Resuelve el punto pendiente de B2.

**Correcciones del desarrollador:** ninguna. Aprobó corregir dos puntos menores que señaló la revisión.

**Problemas detectados (revisión con `/revisar`, aprobada):**
- CLAUDE.md decía que `repositories/` era el "único sitio con SQL", lo que contradice tener el esquema en `db/migrations/`. Se precisó como "SQL de datos" en CLAUDE.md, en `directrices-ia.md` y en la skill `revisar`, que además nombraba `domain/` como sitio permitido para el SQL.
- Se borraron los `.gitkeep` de las carpetas que ya tienen contenido.
- Pendiente sin urgencia: el runner no avisa de forma específica si dos migraciones tienen la misma versión (falla igualmente y revierte).

## 20/11/2026 — B4: repositorio de clientes

**Qué se pidió:** concentrar todo el SQL de `customers` (crear, buscar por id y buscar por texto) con consultas parametrizadas.

**Qué se hizo:**
- `config/plans.ts` (planes y tipo `Plan`), `config/search.ts` (límite de 100) y `domain/customer.ts` (solo tipos).
- `repositories/mappers.ts` (filas a camelCase y `createdAt` a ISO UTC), `repositories/errors.ts` (`DuplicateTaxIdError`) y `repositories/customerRepository.ts` (`create` con `RETURNING`, `findById` y `search`).
- `db/functions.ts`: función SQL `fold` (minúsculas y sin tildes), registrada en `openDatabase`.
- Spec §6: orden del listado y búsqueda que no distingue tildes.
- Resultado: **80/80 tests en verde**; typecheck y build sin errores.

**Decisiones de diseño:**
- **Repositorio como factoría `createCustomerRepository(db)`:** las sentencias se preparan una vez y la BD se inyecta (en los tests, en memoria).
- **Se quitó `existsByTaxId`, previsto en el plan:** comprobar antes de insertar abre una ventana para condiciones de carrera. La restricción `UNIQUE`, traducida a `DuplicateTaxIdError`, lo cubre de forma atómica.
- **En la búsqueda se escapan `%`, `_` y `\`.** Si el texto queda vacío al normalizarse, no se busca en `tax_id`, para no devolver todos los clientes.

**Correcciones del desarrollador:**
- La spec no fijaba el orden del listado. Ante la pregunta de la IA, el desarrollador eligió **orden alfabético por empresa**.

**Problemas detectados (revisión con `/revisar`):**
- **Importante, corregido:** `LIKE` y `COLLATE NOCASE` de SQLite solo ignoran mayúsculas en ASCII. Se comprobó ejecutándolo: `ÑANDÚ` no aparecía al buscar `ñandú` y `Álvarez` se ordenaba después de `zeta`. Se resolvió con la función `fold` en el `WHERE` y el `ORDER BY`, más tests con tildes y ñ. Efecto aceptado: la ñ ordena junto a la n.
- Menor, corregido: se justificó con un comentario la conversión del resultado de `RETURNING`.
- Limitación conocida: si se abre la BD con una herramienta externa, `fold` no existe. Solo afecta a las consultas de búsqueda, no al esquema.
