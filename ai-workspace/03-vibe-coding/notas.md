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

## 20/11/2026 — B5: repositorio de simulaciones

**Qué se pidió:** concentrar el SQL de `simulations`: guardar una simulación y listar el historial de un cliente.

**Qué se hizo:**
- `domain/simulation.ts` (solo tipos), con `SimulationRow` y `mapSimulationRow` en `repositories/mappers.ts`.
- `repositories/simulationRepository.ts`: `create` (con `RETURNING`) y `listByCustomer` (`created_at DESC, id DESC`).
- `tests/repositories/simulationRepository.test.ts` (6 casos).
- Resultado: **86/86 tests en verde**; typecheck y build sin errores.

**Decisiones de diseño:**
- **El repositorio no calcula nada:** guarda los importes que recibe. El cálculo vive en `domain/pricing.ts` y la orquestación irá en el servicio (B8).
- **La tasa se guarda como `taxRatePercent` entero.** La conversión a la fracción `taxRate` y el campo `currency` pertenecen a la respuesta HTTP (B8), no a los datos.
- **Los tests de orden fijan `created_at` a mano** para no depender del reloj. Uno de ellos tiene el `id` y la fecha en sentidos opuestos, para demostrar que manda la fecha.

**Correcciones del desarrollador:** ninguna.

**Problemas detectados (revisión con `/revisar`, aprobada):**
- Si el servicio no comprobara antes que el cliente existe, la FK haría que la API respondiera 500 en vez de 404. Queda como requisito para B8, con su test.
- `mapSimulationRow` solo se prueba de forma indirecta, a través de `create`. Se acepta.

## 20/11/2026 — B6: app Fastify, formato de errores y validación

**Qué se pidió:** montar la app con un formato de error único (spec §6), un helper de validación con Zod y el arranque del servidor.

**Qué se hizo:**
- `src/http/errors.ts`: `HttpError`, `ValidationError` (422), `NotFoundError` (404) y `toErrorResponse`, que traduce además `DuplicateTaxIdError` (409), los 4xx de Fastify (422) y cualquier otro error (500 genérico).
- `src/http/validate.ts`: `parseOrThrow`, que convierte los errores de Zod en `fields`, con Zod configurado en español.
- `src/app.ts` (`buildApp` con los manejadores de error y de rutas inexistentes) y `src/server.ts` (`.env` opcional, entorno validado, BD, migraciones, `listen` y cierre ordenado).
- Scripts `dev` (`tsx watch`) y `start`. Dependencias `fastify` y `tsx`.
- Tests: `tests/http/errors.test.ts` y `validate.test.ts`.
- Resultado: **100/100 tests en verde**; typecheck y build sin errores. Prueba manual con `npm run dev` y `npm start`: la BD se crea sola y las respuestas 404 y 422 reales tienen el formato correcto (comprobado con `curl`).

**Decisiones de diseño:**
- **Los errores del repositorio se traducen a HTTP en un único sitio** (`toErrorResponse`). Así las rutas no capturan errores.
- **`.env` con `process.loadEnvFile`, nativo de Node,** en lugar de `dotenv` o flags de `tsx`. No añade dependencias y funciona igual con `dev` y con `start`.
- **El 500 nunca devuelve el mensaje interno.** El detalle va al log de Fastify.

**Correcciones del desarrollador:** ninguna. Aprobó corregir el punto importante de la revisión.

**Problemas detectados:**
- **La IA escribió primero un manejador de 404 enrevesado** (construía una respuesta 500 y la sobrescribía). Lo detectó al releer y lo simplificó antes de los tests.
- **Un test falló por un motivo real:** la traducción al español de Zod no sirve para la interfaz ("se esperaba int, recibido número"). Decisión: los esquemas de B7 y B8 llevarán mensajes propios en español, y la traducción de Zod queda como respaldo.
- **Revisión (`/revisar`), importante, corregido:** todo 4xx de Fastify decía "no es un JSON válido", también un cuerpo de más de 1 MB o una petición sin `content-type` (comprobado ejecutándolo). Ahora se mantiene el 422, con un mensaje según la causa: 413 → demasiado grande, 415 → falta JSON. Tres tests nuevos.
- npm bloquea el `postinstall` de `esbuild` (lo usa `tsx`). Se comprobó que `tsx` funciona igualmente.

## 20/11/2026 — B7: `POST /customers`

**Qué se pidió:** dar de alta clientes con validación estricta: email, país, plan e identificador fiscal con el algoritmo oficial si el país es España.

**Qué se hizo:**
- `routes/schemas/customerSchemas.ts`: esquema Zod con mensajes propios en español y `parseNewCustomer`, que valida aparte el identificador fiscal con `validateTaxId` del dominio y lo devuelve normalizado.
- `routes/customers.ts`: `POST /customers` (valida, guarda y responde 201). `app.ts` crea el repositorio y registra la ruta.
- `tests/helpers/testApp.ts` (app sobre una BD en memoria migrada) y `tests/routes/customers.post.test.ts` (25 casos).
- Spec §6: documentada la clave `_` de `fields` para los errores generales de la petición.
- Resultado: **120/120 tests en verde**; typecheck y build sin errores. Prueba manual con el servidor real: 201 (ejemplo de la spec), 422 ("La letra de control del DNI no es correcta") y 409 (duplicado escrito como `b-12345674`).

**Decisiones de diseño:**
- **El identificador fiscal se valida fuera del esquema principal.** Depende del país, y una validación de Zod sobre el objeto entero solo se ejecuta si el resto de campos es válido. Así el usuario recibe a la vez el error del email y el del CIF, en vez de descubrirlos de uno en uno.
- **El 409 no necesita código en la ruta:** el repositorio lanza `DuplicateTaxIdError` y `toErrorResponse` lo traduce.
- **Mensajes escritos a mano,** que distinguen entre "es obligatorio" y "no es válido" (lo aprendido en B6).

**Correcciones del desarrollador:** ninguna. Aprobó aplicar las tres mejoras menores de la revisión.

**Problemas detectados:**
- Al conectar el repositorio en `buildApp`, fallaron los 9 tests de `errors.test.ts` (B6): creaban la app sobre una BD sin migrar. Se pasaron al helper común `createTestApp`.
- Revisión (`/revisar`, aprobada), tres mejoras menores aplicadas:
  - documentar la clave `fields._` en la spec;
  - mensaje "El plan es obligatorio" cuando falta el plan, coherente con el resto de campos;
  - tests de los límites exactos (nombre de 200 aceptado, email de más de 254 rechazado).

## 20/11/2026 — B8: `POST /simulations`

**Qué se pidió:** calcular el presupuesto de una simulación con la tasa del país del cliente y guardarlo.

**Qué se hizo:**
- `services/simulationService.ts`: busca el cliente, obtiene la tasa de su país, llama a `calculateQuote` del dominio y guarda. Si el cliente no existe, lanza `CustomerNotFoundError` (`services/errors.ts`), que `toErrorResponse` traduce a 404.
- `routes/schemas/simulationSchemas.ts` (reglas de la spec §3.4 con mensajes en español), `routes/presenters.ts` (porcentaje → `taxRate` y `currency: "EUR"`) y `routes/simulations.ts`.
- `routes/schemas/fields.ts`: campos compartidos (`requiredText` y `supportedCountry` vienen de `customerSchemas.ts`; se añaden los numéricos y `activeUsersField`, que reutilizará `/pricing/preview`).
- `config/limits.ts` (límites de la §3.4) y `config/currency.ts`.
- Resultado: **146/146 tests en verde**; typecheck y build sin errores.

**Decisiones de diseño:**
- **Un servicio para orquestar:** la ruta solo valida y responde, y el cálculo sigue estando solo en `domain/pricing.ts`.
- **Los 2 decimales del almacenamiento se comprueban sobre el texto del número,** no multiplicando por 100, porque en coma flotante `0.29 * 100 = 28.999999999999996`. Hay un test con `0.29`.
- **La tasa se guarda como porcentaje entero** y se convierte a fracción solo en la respuesta (presenter), nunca para calcular.
- **Un país sin tasa configurada da 500,** no 422: el alta ya lo impide, así que indicaría una configuración incoherente.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar dos mejoras de la revisión.

**Problemas detectados:**
- **Al releer antes de probar, la IA quitó dos cosas:** un tipo exportado que nadie usaba (`SimulationInput`) y un presenter que copiaba campo a campo lo que podía propagar.
- **Revisión (`/revisar`, aprobada), dos mejoras aplicadas:**
  - el servicio lanzaba `NotFoundError`, una clase de `http/`, así que la orquestación dependía de la capa HTTP. Ahora lanza `CustomerNotFoundError` propio, igual que el repositorio con `DuplicateTaxIdError`;
  - `customerId` aceptaba 0 y su máximo producía el mensaje "no puede superar 9.007.199.254.740.991". Ahora es un entero positivo con el mensaje "El cliente debe ser un identificador válido" (4 tests nuevos).

## 20/11/2026 — B9: endpoints de lectura

**Qué se pidió:** `GET /customers?search=`, `GET /customers/:id` y `GET /customers/:id/simulations` para el frontend.

**Qué se hizo:**
- `routes/schemas/params.ts`: `:id` como entero positivo escrito solo con dígitos.
- `customerSearchQuerySchema`: `search` opcional, de hasta 200 caracteres y sin repetirse.
- `routes/customers.ts`: listado/búsqueda y detalle. `routes/simulations.ts`: historial con el mismo presenter que el `POST`.
- `simulationService.listForCustomer`, con `requireCustomer` compartido con `create`.
- Spec §6: límite y unicidad de `search`.
- Resultado: **167/167 tests en verde**; typecheck y build sin errores.

**Decisiones de diseño:**
- **El `:id` se valida con una expresión regular sobre el texto,** no con `Number()`, que aceptaría por error `1e3`, `1.5` o `-1`. También se rechazan los números que no caben en un entero seguro.
- **El historial pasa por el servicio:** aplica la misma regla de 404 que la creación, en vez de devolver `[]` para un cliente que no existe.
- **`search` de hasta 200 caracteres,** igual que el nombre de empresa: un texto más largo no puede coincidir con nada.

**Correcciones del desarrollador:** ninguna.

**Problemas detectados (revisión con `/revisar`, aprobada):**
- La spec no recogía el límite ni la unicidad de `search`. Se documentaron.
- "Buscar el cliente o 404" aparece en la ruta de detalle y en el servicio. Se acepta: son dos líneas que usan la misma clase de error.

## 20/11/2026 — B10: `GET /pricing/preview`

**Qué se pidió:** calcular sin guardar, para el slider del frontend, de modo que la lógica de tramos viva solo en el backend.

**Qué se hizo:**
- `services/pricingService.ts`: `quoteFor(activeUsers, country)`. `simulationService` también lo usa.
- `routes/schemas/pricingSchemas.ts` (`users` solo con dígitos y después las reglas de `activeUsers`; `country` soportado), `toQuoteResponse` en `presenters.ts` y `routes/pricing.ts`.
- `fields.ts`: mensaje "… debe ser un único valor" para un parámetro repetido o un array.
- Resultado: **192/192 tests en verde**; typecheck y build sin errores.

**Decisiones de diseño:**
- **Una sola función de cálculo para la vista previa y la simulación guardada.** Así el número que ve el comercial en el slider es exactamente el que se guarda. La regla "país sin tasa → 500" queda en un único sitio.
- **`users` se valida primero como texto de dígitos** (en la query todo llega como texto) y después con las mismas reglas que `activeUsers`, reutilizando el mismo campo.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar la mejora de la revisión.

**Problemas detectados:**
- **El primer borrador del test de la tabla §3.1 calculaba el impuesto esperado con la misma fórmula que el código,** así que no habría detectado un error en ella. La IA lo vio antes de la revisión y puso los valores esperados escritos a mano.
- **Revisión (`/revisar`, aprobada), corregido:** `country` repetido en la URL respondía "El país debe ser texto", un mensaje confuso (comprobado ejecutándolo). Ahora cualquier valor repetido o array responde "… debe ser un único valor", también en `search` y en los cuerpos JSON. Spec §6 actualizada.

## 20/11/2026 — B10b: `GET /countries`

**Qué se pidió:** exponer los países soportados para que el frontend no duplique la tabla de impuestos (decisión F6 del plan).

**Qué se hizo:**
- `routes/countries.ts`: `[{ code, taxRate }]` ordenado por código, leído de `config/taxRates.ts`. Registrado en `app.ts`.
- `tests/routes/countries.test.ts`: la tabla exacta de la spec §3.2 y la coincidencia con la configuración.
- Resultado: **194/194 tests en verde**; typecheck y build sin errores.

**Decisiones de diseño:**
- **La lista se calcula una vez al registrar la ruta,** porque la configuración no cambia mientras el servidor está en marcha.
- **La respuesta solo trae el código ISO.** El nombre en español lo obtendrá el frontend con `Intl.DisplayNames('es', { type: 'region' })`, sin dependencias ni traducciones duplicadas. Queda como requisito para F6.

**Correcciones del desarrollador:** ninguna.

**Problemas detectados (revisión con `/revisar`, aprobada):** ninguno que requiera cambios.

## 20/11/2026 — B11: prueba de punta a punta del backend

**Qué se pidió:** comprobar manualmente el backend completo sobre una BD limpia, reiniciar y verificar que los datos persisten (criterio de la spec §11).

**Qué se hizo:**
- `backend/requests.http`: peticiones de ejemplo de toda la API (REST Client), pensadas para lanzarse en orden sobre una BD vacía.
- Prueba manual con `npm run dev`:
  - la migración automática crea la BD;
  - se recorrió toda la API: países, alta, 422 por DNI, 409, búsqueda, detalle, 404, vista previa, simulaciones e historial;
  - tras reiniciar, el cliente y el historial seguían ahí;
  - `schema_migrations` tenía una sola fila después de dos arranques.
- Resultado: **194/194 tests en verde**; build sin errores. La BD de prueba se borró al terminar.

**Decisiones de diseño:**
- **La prueba arranca con `npm run dev`,** tal y como lo hará quien siga el README, en vez de usar `app.inject`.
- **La vista previa y la simulación guardada se compararon con los mismos datos:** 14000 / 2940 / 16940 en ambas.

**Correcciones del desarrollador:** ninguna.

**Problemas detectados:**
- **Falsa alarma investigada antes de tocar código:** la búsqueda "alvarez" devolvió `[]` y el nombre salía como `Ãlvarez`. La causa no estaba en el backend: el script de prueba se guardó en UTF-8 sin BOM y PowerShell 5.1 lo leyó como ANSI, así que corrompió la "Á" antes de enviarla. Las pistas fueron que los textos del servidor ("válidos") se veían bien y que las cabeceras del propio script estaban corrompidas. Al repetir la prueba con un escape JSON (`Á`), la búsqueda funcionó (comprobado comparando bytes UTF-8).
- Este riesgo puede afectar a quien pruebe con `curl` desde PowerShell. Se añadió al plan del README (D1) recomendar `requests.http` o escapes JSON.
- **Backend completo: B1–B11 cerradas.**

## 20/11/2026 — F1: proyecto frontend (Vite + React + TypeScript)

**Qué se pidió:** preparar el proyecto frontend con tests y un proxy hacia el backend.

**Qué se hizo:**
- `frontend/package.json` (scripts `dev`, `build` con typecheck, `preview`, `typecheck` y `test`), `tsconfig.json` (app) y `tsconfig.node.json` (`vite.config.ts`), `vite.config.ts` (proxy `/api` y Vitest con jsdom), `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css` (variables de diseño, móvil primero, foco visible, tema oscuro), `src/setupTests.ts`, un test de humo y `.env.example`.
- Dependencias: React 19, Vite 8, Vitest 5, jsdom y Testing Library. Además, `@types/node` y `@testing-library/dom` (*peer* obligatoria), justificadas.
- Resultado: test de humo y build en verde. Prueba manual: `localhost:5173/api/*` llega al backend, y `/` y `/customers/1` sirven la app.

**Decisiones de diseño:**
- **Proyecto montado a mano, sin `create-vite`:** no hay código de ejemplo que borrar.
- **Proxy `/api` que quita el prefijo:** no hace falta CORS ni otra dependencia, y las rutas del SPA no chocan con las de la API.
- **Tests junto a su fichero y configuración en `src/setupTests.ts`,** como es habitual en React, sin crear carpetas que CLAUDE.md no recoge.
- **CSS plano con variables,** sin framework de estilos, para no añadir dependencias.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar la mejora de la revisión.

**Problemas detectados:**
- **Revisión (`/revisar`, aprobada), corregido:** el proxy apuntaba siempre a `localhost:3000`, así que cambiar `PORT` en el backend rompía el frontend sin un error claro. Ahora se lee `BACKEND_URL`, con `localhost:3000` por defecto (probado con el backend en el puerto 3100). Queda anotado para el README.
- Pendiente para F4: quitar el comentario de `App.tsx` que cita la tarea del plan.

## 20/11/2026 — F2: cliente de API tipado

**Qué se pidió:** un único punto de acceso HTTP al backend, con errores tipados.

**Qué se hizo:**
- `src/api/http.ts`: `request<T>` y `ApiError { status, code, message, fields }`.
- `src/api/types.ts`: contratos de la spec §6.
- Una función por endpoint: `customers.ts`, `simulations.ts`, `pricing.ts` y `countries.ts` (adelantada desde F6 por ser trivial).
- Tests: `http.test.ts` (9 casos) y `endpoints.test.ts` (URLs, métodos y cuerpos).
- Resultado: **16/16 tests en verde**; build con typecheck sin errores.

**Decisiones de diseño:**
- **Todo fallo acaba en un `ApiError`:**
  - un error con el formato de la API conserva `code`, `message` y `fields`;
  - un error sin formato (502 del proxy) o un 200 que no es JSON → `UNEXPECTED_RESPONSE`;
  - un fallo de red → `NETWORK_ERROR`, con un mensaje en español.
- **Una cancelación no se convierte en error:** se propaga tal cual, para que los hooks con `AbortController` puedan descartar respuestas viejas sin mostrar nada.
- **Sin validar las respuestas en tiempo de ejecución** (`as T`): se confía en nuestro backend, que está probado, y así no hace falta Zod en el frontend.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar la mejora de la revisión.

**Problemas detectados:**
- **Antes de la revisión, la IA cubrió un caso que faltaba:** una respuesta 200 que no es JSON habría lanzado un `SyntaxError` crudo.
- **Revisión (`/revisar`, aprobada):**
  - se comprobó contra el backend compilado que el `+` con el que `URLSearchParams` codifica los espacios se lee como espacio (`search=acme+s.l` encuentra "Acme S.L.");
  - corregido: la cancelación solo se reconocía como `AbortError`, y un `abort(motivo)` se habría mostrado como fallo de red. Ahora se comprueba también `signal.aborted` (test nuevo).
- Se acepta que `types.ts` duplique los contratos del backend: compartir un paquete de tipos no compensa en un proyecto de este tamaño.

## 20/11/2026 — F3: divisas (servicio, caché, contexto y selector)

**Qué se pidió:** un selector global de divisa con la API pública de tipos de cambio, con los estados obligatorios de carga, error con reintento y *fallback* a EUR.

**Qué se hizo:**
- `config/currencies.ts`: divisas, URL, TTL de 1 hora y configuración regional.
- `api/exchangeRates.ts`: llamada a la API externa con la respuesta validada y caché previa.
- `utils/ratesCache.ts`: `localStorage` con caducidad y memoria como respaldo.
- `utils/money.ts`: `formatMoney` con `Intl.NumberFormat`.
- `hooks/useExchangeRates.ts`: carga → listo | error, con `retry`.
- `features/currency/` (contexto y `CurrencyProvider`) y `hooks/useCurrency.ts`.
- `components/CurrencySelector.tsx` y `ExchangeRateStatus.tsx`, integrados de forma provisional en la cabecera de `App`.
- Resultado: **43/43 tests en verde**; build sin errores. Se comprobó el parser contra la API real.

**Decisiones de diseño:**
- **La divisa efectiva es la elegida solo si hay tipo de cambio para ella; si no, EUR.** El selector solo ofrece las divisas disponibles y está deshabilitado mientras carga o si hay error.
- **`formatCents` en el contexto:** todas las vistas formatean igual y la conversión es solo de visualización (spec §7).
- **El cargador de tipos se inyecta (`loadRates`):** los tests de integración funcionan sin red y sin mocks globales.
- **Contexto, provider y hook en ficheros separados,** para que el refresco en caliente de React funcione bien.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar dos mejoras de la revisión.

**Problemas detectados:**
- **Dos tests de integración fallaron por un error del propio test:** el importe de prueba se pintaba en un `<output>`, que tiene `role="status"` implícito y chocaba con el aviso de carga. Se cambió a `<span>`.
- **Antes de la revisión, la IA reescribió `parseRatesResponse`** con un guard `isRecord` en vez de una conversión de tipo difícil de leer.
- **Revisión (`/revisar`, aprobada), dos mejoras aplicadas:**
  - las opciones muestran el nombre en español ("USD · dólar estadounidense") con `Intl.DisplayNames`, sin dependencias;
  - el valor del `<select>` se busca en las divisas disponibles en vez de convertirlo a ciegas.
- Se acepta no recordar la divisa elegida al recargar: la spec no lo pide.

## 20/11/2026 — F4: layout y enrutado

**Qué se pidió:** una cabecera con el selector de divisa y la navegación entre las vistas.

**Qué se hizo:**
- `react-router-dom` 7, aprobada en el plan.
- `components/Layout.tsx`: enlace de salto, cabecera con la marca y la divisa, aviso de tipos de cambio y `<main>` enfocable.
- `App.tsx`: rutas `/`, `/customers/new`, `/customers/:id` y 404.
- Páginas mínimas (encabezado y título de pestaña) para que las rellenen F5–F7, y `NotFoundPage` completa.
- Componentes comunes `Card`, `Loading`, `ErrorMessage` y `EmptyState`; hook `useDocumentTitle`; `testUtils.tsx` con `renderApp(path)`.
- Resultado: **51/51 tests en verde**; build sin errores.

**Decisiones de diseño:**
- **URLs reales con `BrowserRouter`:** el detalle de un cliente sobrevive a una recarga (criterio §11). Con el proxy `/api` de F1, las rutas no chocan con la API.
- **Accesibilidad desde el layout:** enlace "Saltar al contenido", `<main>` enfocable, un `h1` por página y título de pestaña por página.
- **Estados de carga, error y vacío como componentes comunes,** con sus roles ARIA, para que todas las vistas los muestren igual.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar la mejora de la revisión.

**Problemas detectados:**
- **La IA creó una carpeta `src/test/` para el helper de tests,** contra la convención que ella misma fijó en F1. Lo vio enseguida y lo movió a `src/testUtils.tsx` antes de la revisión.
- **Revisión (`/revisar`, aprobada):**
  - corregido: `Layout.tsx` exportaba una constante que nadie usaba, contra el criterio de F3 de que los ficheros de componentes solo exporten componentes;
  - pendiente para F9 (anotado en el plan): mover el foco al contenido en cada cambio de ruta.
- No hay navegador en la sesión de la IA, así que la comprobación visual en móvil y escritorio queda para el desarrollador.

## 20/11/2026 — F5: dashboard y buscador

**Qué se pidió:** la lista de clientes en tarjetas, con un buscador con debounce y los estados de carga, error y vacío.

**Qué se hizo:**
- `hooks/useAsync.ts`: carga genérica con `loading`/`success`/`error`, `retry`, cancelación, descarte de respuestas viejas y datos conservados durante la recarga. `useExchangeRates` se reescribió sobre él.
- `hooks/useDebouncedValue.ts` y `config/search.ts` (300 ms).
- `utils/display.ts` (país en español con `Intl.DisplayNames` y etiqueta del plan) y `utils/errors.ts` (mensaje para mostrar).
- `features/customers/CustomerListPage.tsx` y `CustomerCard.tsx`, con estilos de cuadrícula responsive.
- Resultado: **63/63 tests en verde**; build sin errores.

**Decisiones de diseño:**
- **Un único hook de carga para todas las vistas.** Elimina la lógica duplicada de `useExchangeRates`.
- **Mientras se recarga, la lista anterior sigue visible** (`aria-busy`), para que no parpadee con cada búsqueda.
- **Dos estados vacíos distintos:** sin clientes (con enlace para crear el primero) y sin coincidencias para la búsqueda.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar el punto importante de la revisión.

**Problemas detectados:**
- **Un test hizo caer el proceso de Vitest por falta de memoria (código 134).** Pasaba a `useAsync` una función nueva en cada render, así que el efecto se volvía a ejecutar en bucle infinito. El hook cumplía lo que decía su comentario ("`load` debe ser estable"), pero una trampa tan fácil de pisar no puede depender de un comentario.
- **Revisión (`/revisar`), importante, corregido:** la firma pasó a `useAsync(load, key)`. Solo se recarga al cambiar `key` o al reintentar, y `load` se lee de una ref, así que una función inline ya no provoca el bucle. Test nuevo con una función inline y varios renders: una sola carga. La página quedó más simple, sin `useCallback`.
- Se acepta no guardar el texto buscado en la URL (la spec no lo pide).

## 20/11/2026 — F6: alta de cliente

**Qué se pidió:** el formulario de alta con los errores de validación del backend junto a cada campo, foco accesible y navegación al detalle tras crear el cliente.

**Qué se hizo:**
- `components/FormField.tsx`: etiqueta, ayuda y error, con `fieldA11y` para enlazar `aria-invalid` y `aria-describedby`.
- `features/customers/useCustomerForm.ts`: estado y envío del formulario.
- `features/customers/CustomerFormPage.tsx`: países desde `GET /countries` con su nombre en español y España por defecto; plan como grupo de opciones.
- Estilos de formulario en `index.css`.
- `CustomerFormPage.test.tsx` (10 casos).
- Resultado: **73/73 tests en verde**; build sin errores.

**Decisiones de diseño:**
- **Una sola fuente de validación: el backend.** `noValidate` evita los mensajes nativos del navegador, con otro idioma y estilo. Los mensajes llegan en español desde B7 y no hay reglas duplicadas que puedan desincronizarse.
- **Dónde va cada error:**
  - `fields` → junto a cada campo;
  - `fields._`, error de red u otro error → aviso general del formulario;
  - el 409 → en el campo del identificador fiscal.
- **El foco va al primer error solo tras un envío rechazado,** mediante un contador de envíos rechazados.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar dos mejoras de la revisión.

**Problemas detectados:**
- **Antes de probar, la IA detectó al releer un fallo de usabilidad:** el efecto del foco dependía de `fieldErrors`, así que al corregir un campo el foco saltaba al siguiente con error mientras el usuario escribía. Se corrigió y hay un test que lo cubre. En la misma relectura se corrigieron una cadena `'hint'` pasada en lugar de la ayuda real, un `aria-invalid` sin sentido en la primera opción del plan y un `setField` inestable.
- **Se quitó un comentario `eslint-disable`** que no hacía nada (el proyecto no usa ESLint).
- **Dos tests fallaron por errores del propio test:** contaban también las opciones del selector de divisa de la cabecera, y comprobaban el país por defecto antes de que se aplicara.
- **Revisión (`/revisar`, aprobada), dos mejoras aplicadas:**
  - el campo País se pinta siempre, para que su error se vea aunque la lista de países no cargue;
  - el plan enlaza su ayuda y su error a la vez.

  Hay dos tests nuevos para estos casos.

## 20/11/2026 — F7: detalle del cliente e historial

**Qué se pidió:** tarjetas responsive con los datos del cliente y su historial de simulaciones en la divisa seleccionada.

**Qué se hizo:**
- `utils/format.ts`: fechas, números y porcentajes con `Intl`.
- `features/customer-detail/CustomerDetailPage.tsx`: id comprobado antes de llamar a la API, cliente e historial pedidos en paralelo, 404, error con reintento y título de pestaña con el nombre del cliente.
- `CustomerInfoCard.tsx` y `SimulationHistory.tsx`, con `formatCents` de la divisa global y la nota del tipo de cambio actual (A14).
- `Card` admite `labelledBy` (regiones con nombre) y `.data-list` es ahora la clase común.
- Resultado: **84/84 tests en verde**; build sin errores.

**Decisiones de diseño:**
- **Historial como lista de tarjetas (`<ol>`) en lugar de una tabla:** se lee mejor en móvil, que es la prioridad (móvil primero).
- **Cambiar de divisa solo reformatea:** el historial no se vuelve a pedir (lo comprueba un test).
- **Un error del historial se muestra dentro de su sección,** sin ocultar los datos del cliente.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar la mejora de la revisión.

**Problemas detectados:**
- **Antes de probar, la IA vio al releer que tras un 404 el título de la pestaña quedaba mal:** el efecto del padre se ejecuta después del del hijo y lo sobrescribía. Ahora el título lo pone un solo componente en cada caso (con test).
- **Los tests de región por nombre obligaron a dar nombre accesible a las secciones** con `aria-labelledby`, lo que además mejora la navegación con lector de pantalla.
- **Ajustes en tests anteriores por el nuevo detalle:**
  - `App.test` respondía `[]` para cualquier URL y ahora da 404 en el detalle;
  - el test de alta de F6 ahora comprueba que se llega al detalle del cliente creado.
- **Revisión (`/revisar`, aprobada), corregido:** la flecha de "← Volver a clientes" se leía en voz alta; ahora está oculta al lector de pantalla.

## 20/11/2026 — F8: simulador interactivo

**Qué se pidió:** un simulador con deslizador de usuarios y campo numérico sincronizado, almacenamiento y llamadas, presupuesto en tiempo real en la divisa elegida y botón para guardar.

**Qué se hizo:**
- `config/simulator.ts` (deslizador 0–200, máximo 100 000, debounce de 250 ms y valores iniciales) y `hooks/usePricingPreview.ts` (debounce + `useAsync` con clave).
- `features/simulator/`:
  - `UsersInput` (deslizador y número sincronizados);
  - `QuoteSummary` (base, impuesto y total con `formatCents`);
  - `useSaveSimulation` (guardado con errores por campo);
  - `Simulator` (formulario completo, integrado en el detalle).
- Al guardar se llama a `history.retry` de F7, que refresca el historial sin recargar.
- `index.css` (411 líneas) se dividió en seis hojas, cada una importada por su componente.
- Resultado: **96/96 tests en verde**; build sin errores. El fichero más largo tiene 173 líneas.

**Decisiones de diseño:**
- **Los tramos solo se calculan en el backend:** el simulador muestra lo que devuelve `GET /pricing/preview`. Una búsqueda en el código lo confirma.
- **El texto escrito se envía tal cual.** Si no es válido, el 422 del backend explica el motivo junto al campo, así que no hay validación duplicada.
- **Con un error de la vista previa se ocultan los importes anteriores,** que no corresponderían a lo escrito.

**Correcciones del desarrollador:** ninguna. Aprobó aplicar la mejora de la revisión.

**Problemas detectados:**
- **La IA escribió dos veces conversiones que engañaban al compilador** (`as unknown as number` y `undefined as number`) y las corrigió antes de la revisión, cambiando los tipos para que digan la verdad:
  - `getPricingPreview` acepta texto;
  - `createSimulation` acepta `SimulationInput`, con campos posiblemente ausentes.
- **Al contar líneas antes de la revisión apareció `index.css` con 411 líneas,** el doble del máximo de CLAUDE.md. Había crecido tarea a tarea sin que nadie lo vigilara. Se dividió por responsabilidad, y la base se importa la primera para respetar la cascada.
- **Los tests de F6 y F7 que llegan al detalle necesitaron simular también `api/pricing`.**
- **Revisión (`/revisar`, aprobada), corregido:** el layout de escritorio dependía del orden de los hijos (`:nth-child`); ahora asigna las áreas por clase.
- **Pendiente para F9:** probar el simulador de punta a punta con el backend real (los tests usan respuestas simuladas).

## 20/11/2026 — F9: pulido de accesibilidad y responsive

**Qué se pidió:** repasar los criterios de la spec §7 de calidad de interfaz (responsive, accesibilidad, foco) y cerrar los pendientes de F4 y F8.

**Qué se hizo:**
- `Layout.tsx`: al cambiar de ruta, el foco pasa a `<main>` (pendiente de F4). No salta al cargar la página, aunque React esté en modo estricto.
- `index.css`:
  - variable `--color-input-border` para los bordes de los controles;
  - `overflow-wrap` en los encabezados, para que los nombres largos no desborden a 360 px.
- `src/a11y.test.tsx`: `axe-core` revisa las cuatro pantallas con reglas WCAG 2.0/2.1/2.2 A y AA, también con estados de error y validación, más un control negativo.
- Prueba **temporal** de punta a punta contra el backend real (pendiente de F8). Pasó y se borró; en R1 se convierte en un comando permanente.
- Resultado: **frontend 104/104 tests en verde y backend 194/194**; builds sin errores.

**Decisiones de diseño:**
- **Lighthouse requiere navegador y aquí no lo hay.** Se sustituyó por comprobaciones objetivas:
  - contraste calculado con la fórmula WCAG para 13 pares en los dos temas;
  - `axe-core` sobre el DOM real de cada pantalla.
- **`color-contrast` desactivada en `axe`:** jsdom no calcula estilos; el contraste se calculó aparte.
- **`axe-core` directamente en lugar de `vitest-axe`:** el desarrollador aprobó `vitest-axe`, pero al revisarlo resultó ser la versión 0.1.0 de 2022, sin mantenimiento. Solo añade un *matcher* sobre `axe-core`, así que se usa el motor directamente: las mismas comprobaciones con una dependencia menos.

**Correcciones del desarrollador:**
- Aprobó añadir la comprobación automática de accesibilidad.
- Pidió convertir la prueba de punta a punta en un comando permanente (`npm run test:e2e`, en R1).

**Problemas detectados:**
- **Fallo real de contraste:** el borde de los campos tenía 1,36:1 en el tema claro y 1,43:1 en el oscuro, cuando WCAG 1.4.11 exige 3:1 para controles. Se corrigió con una variable propia: ahora es 3,84:1 en el tema claro y 3,87:1 en el oscuro. El resto de pares ya cumplían, de 5,7:1 a 16,6:1.
- **La prueba de punta a punta no pudo cargar el backend dentro del entorno jsdom de Vitest** (`import.meta.url` deja de ser `file:`). Se arrancó el servidor compilado como proceso aparte y se le habló por HTTP real, una prueba aún más fiel. El recorrido completo pasó: alta con DNI incorrecto y CIF normalizado, vista previa con los tramos reales (121,00 € → 514,25 €), 422 por campo, guardado, historial refrescado y búsqueda sin tildes.
- **Dos fallos de la IA en el propio test de `axe`:**
  - un test prometía comprobar el formulario "con errores visibles" y no los provocaba;
  - el control negativo comprobaba el mensaje del error en lugar del contenido.

  Los dos se corrigieron antes del commit.
- **Pendiente:** el desarrollador debe revisar visualmente la app en móvil y escritorio (la IA no tiene navegador).

## 20/11/2026 — R1: arranque conjunto desde la raíz y prueba de punta a punta

**Qué se pidió:** levantar backend y frontend con un solo comando y convertir la prueba de punta a punta de F9 en un comando permanente.

**Qué se hizo:**
- `package.json` en la raíz con `concurrently`:
  - `npm install` (con un `postinstall` que hace `npm ci` en los dos proyectos);
  - `npm run dev` (dos servidores con la salida etiquetada);
  - `npm test`, `npm run build` y `npm run test:e2e`.
- `frontend/e2e/fullFlow.e2e.test.tsx` con su `vitest.e2e.config.ts` y su `tsconfig.e2e.json`. Arranca el backend compilado con una BD temporal y recorre el flujo completo por HTTP.
- `backend/.npmrc` y `frontend/.npmrc` con `ignore-scripts=true`.
- CLAUDE.md y spec §8/§11 actualizados.
- Resultado: **backend 194/194, frontend 104/104 y e2e 1/1 en verde**; builds sin errores.

**Decisiones de diseño:**
- **Prueba de punta a punta separada de `npm test`,** para que los tests unitarios sigan siendo rápidos y no dependan del backend compilado.
- **tsconfig propio para `e2e/`,** que añade los tipos de Node sin mezclarlos con el código del navegador.
- **`npm ci` en el `postinstall`:** instala exactamente lo bloqueado y no reescribe los lockfiles en la máquina de quien clona.

**Correcciones del desarrollador:**
- Pidió la prueba de punta a punta permanente (decidido en F9).
- Aprobó usar `npm ci` tras la revisión.

**Problemas detectados:**
- **Fallo grave detectado al simular un clon limpio** (borrando todos los `node_modules`): el `npm install` desde la raíz fallaba. El `npm install` anidado del `postinstall` ejecutaba el `node-gyp rebuild` que npm deduce para `better-sqlite3`, y sin Build Tools fallaba.
  - Hasta ahora no había aparecido porque el npm 11.20 del desarrollador bloquea esos scripts en una instalación directa, pero no en una anidada, y otras versiones de npm no los bloquean nunca.
  - **Solución:** `.npmrc` con `ignore-scripts=true`, que fija el estado ya verificado en B1 (binarios precompilados) con cualquier versión de npm. Además es una mejora de seguridad: ninguna dependencia ejecuta código al instalarse.
  - Tras el cambio, la instalación limpia completa tarda unos 20 s, sin avisos.
- **Limpieza en Windows de la prueba de punta a punta:** ahora espera a que el proceso del backend termine antes de borrar la BD. No queda ningún fichero residual.
- **El typecheck de `e2e/` no veía los tipos de `jest-dom`;** se añadió `src/setupTests.ts` al tsconfig de la prueba.
- **Revisión (`/revisar`, aprobada):** `npm install` en el `postinstall` podía reescribir los lockfiles (se vio con un metadato en `backend/package-lock.json`); se cambió a `npm ci`.

## 20/11/2026 — D1: README

**Qué se pidió:** un README para levantar backend y frontend en local en pocos pasos y explicar las decisiones del proyecto.

**Qué se hizo:**
- `README.md` con estas secciones:
  - requisitos y arranque rápido (`git clone` → `npm install` → `npm run dev`);
  - cada proyecto por separado, scripts y configuración opcional;
  - problemas frecuentes y uso;
  - tabla de la API (con el aviso de tildes en PowerShell 5.1);
  - decisiones de negocio y arquitectura;
  - enlace a `ai-workspace/` y notas técnicas.
- **Comprobación:** se clonó el repositorio de GitHub en una carpeta temporal y se siguió el README al pie de la letra:
  - `npm install` tardó 9 s, sin avisos ni compilación;
  - `npm test` (194 + 104), `npm run test:e2e` (1/1) y `npm run dev` funcionaron, y la BD se creó sola;
  - los 12 enlaces del README apuntan a ficheros que existen.

**Decisiones de diseño:**
- **Orden pensado para quien llega por primera vez:** requisitos, cuatro comandos y la URL al principio; detalle, API y arquitectura después.
- **Las decisiones de negocio en una tabla,** incluidas todas las que la spec pedía documentar (§3.3, §4.1, A14).

**Correcciones del desarrollador:** ninguna. Aprobó aplicar dos mejoras de la revisión.

**Problemas detectados (revisión con `/revisar`, aprobada), dos mejoras aplicadas:**
- qué pasa con una versión de Node anterior a la 26 (aviso `EBADENGINE` y `nvm use`);
- un apartado de problemas frecuentes: puertos ocupados, backend sin conexión y API de divisas caída.

## 20/11/2026 — D2: documentación de arquitectura y cierre del registro

**Qué se pidió:** documentar la arquitectura final y cerrar el registro del proceso.

**Qué se hizo:**
- `02-arquitectura/arquitectura.md`: vista general, capas del backend y traducción de errores, flujo de una simulación (diagramas Mermaid), frontend y niveles de prueba.
- `02-arquitectura/modelo-datos.md`: diagrama entidad-relación, esquema y el porqué de cada decisión de datos, con una limitación conocida.
- `02-arquitectura/decisiones.md`: 18 decisiones con sus alternativas descartadas, el motivo y la tarea.
- `02-arquitectura/directrices-ia.md`: reescrito. Explica cómo se configuró el asistente y cómo evolucionaron sus reglas, y remite a CLAUDE.md como versión viva.
- `03-vibe-coding/README.md`: resumen del proceso, con cifras, problemas detectados y decisiones del desarrollador.
- `01-specs/plan.md`: estado final con el commit de cada tarea y los cambios respecto a lo planificado.
- Comprobado: los 17 enlaces relativos apuntan a ficheros que existen.

**Decisiones de diseño:**
- **No duplicar las reglas:** `directrices-ia.md` era una copia de CLAUDE.md y se había desfasado (le faltaban `services/`, `http/`, los códigos 200 y 500, `e2e/` y `.npmrc`). Ahora cuenta la evolución de las reglas y remite a CLAUDE.md.
- **Todo lo que dice el resumen sale de `notas.md`;** no añade nada que no esté registrado allí.

**Correcciones del desarrollador:**
- Eligió **documentar** el índice que no se usa, en lugar de quitarlo con una migración.
- Pidió reformular en el resumen la mención a la corrección de la sección inicial del plan. La nota original de la primera sesión se mantiene tal cual, como registro de lo que pasó.

**Problemas detectados (revisión con `/revisar`):**
- **Importante, corregido:** `directrices-ia.md` decía que `.claude/settings.json` permitía comandos de test, build y git. Sus reglas son `Bash(...)` y aquí se usa PowerShell, algo que se avisó en B1 y **no se volvió a revisar en ninguna tarea**: el pendiente se perdió. Ahora el documento lo describe con exactitud como limitación conocida, sin inventar una sintaxis de reglas para PowerShell que no está verificada.
- **Importante, corregido:** `arquitectura.md` atribuía mal a `npm test` los niveles de prueba que ejecuta.
- **Menor, documentado:** el índice `idx_customers_company` (del esquema original) no lo usa ninguna consulta desde B4, porque la búsqueda y el orden usan `fold(company_name)`.

**Pendientes al cerrar el proyecto:**
- Revisión visual en un navegador real, en móvil y escritorio (la IA no tenía navegador).
- Reglas de `.claude/settings.json` para PowerShell.
