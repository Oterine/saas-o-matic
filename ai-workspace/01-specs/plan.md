# SaaS-O-Matic: plan de implementación

Estado: **aprobado el 20/11/2026.** Todas las dudas de la sección 1 están resueltas (ver 1.4) y la spec está actualizada con ellas.

Fuentes: `CLAUDE.md`, `ai-workspace/00-enunciado/enunciado.md`, `ai-workspace/01-specs/spec.md`.
Punto de partida: `domain/pricing.ts`, `domain/taxId.ts`, `config/pricing.ts`, `config/taxRates.ts` y sus tests ya existen. No hay `package.json` ni otra configuración.

---

## 0. Principios y definición de terminado

**Principios que guían el plan**

- **Especificar antes de programar.** Cada tarea parte de la spec. Las dudas se resuelven y se anotan en ella antes de escribir código (sección 1).
- **Corrección del backend.** Validaciones estrictas, cálculo exacto por tramos en céntimos enteros y persistencia limpia con migraciones automáticas.
- **Robustez del frontend.** Interfaz responsive y accesible, con estados de carga, error y vacío. Si la API de divisas falla, la app sigue funcionando en EUR.
- **Revisión del código generado.** Ningún cambio se acepta sin revisarlo contra CLAUDE.md y la spec. Las correcciones se registran.
- **Arranque sin fricción.** Backend y frontend se levantan en local con pocos comandos.

**Definición de terminado (aplica a todas las tareas)**

1. Se cumple el criterio de aceptación de la tarea.
2. `npm test` y `npm run build` pasan en verde.
3. El cambio está revisado contra CLAUDE.md y la spec (`/revisar`).
4. Hay una nota en `ai-workspace/03-vibe-coding/` con lo pedido, las decisiones tomadas y las correcciones hechas.

---

## 1. Ambigüedades y contradicciones (necesito decisión)

Para cada punto propongo una opción por defecto. No la aplico hasta que la confirmes.

### 1.1 Contradicciones entre documentos o con el código

| # | Qué pasa | Dónde | Propuesta |
|---|---|---|---|
| C1 | El contrato muestra `createdAt: "2026-11-20T10:00:00Z"` (ISO 8601), pero `datetime('now')` en SQLite guarda `2026-11-20 10:00:00`. | spec §5 vs §6 | Guardar tal cual y convertir a ISO UTC en el repositorio al mapear la fila. |
| C2 | `tax_rate REAL` (fracción) choca con el principio "nada de float". Además, la config usa un porcentaje entero. | spec §5 vs §3.2 y CLAUDE.md regla 3 | Guardar `tax_rate_percent INTEGER` y que la API siga devolviendo `taxRate` como fracción (`percent / 100`). **Hay que cambiar el esquema de la spec.** |
| C3 | El slider va de 0 a 200 usuarios, pero la validación admite hasta 100 000. No está claro si el campo numérico sincronizado puede pasar de 200. | spec §7 vs §3.4 | Slider 0–200; el campo numérico admite hasta 100 000 y el slider se queda al máximo. |
| C4 | `normalizeTaxId` quita también **puntos**. La spec y CLAUDE.md solo hablan de espacios y guiones. | `domain/taxId.ts:24` vs spec §4.1 | Mantener los puntos (es habitual escribir `B-12.345.674`) y añadirlo a la spec. |
| C5 | Los ficheros de `domain/` importan con extensión (`'../config/pricing.js'`), los tests sin ella (`'../src/domain/pricing'`). Con `module: NodeNext`, `tsc` rechaza los imports de los tests. | `domain/*.ts` vs `tests/*.ts` | `NodeNext` en el build (excluyendo `tests/`) y añadir `.js` a los imports de los tests para que sean coherentes. |
| C6 | CLAUDE.md enumera los códigos 201, 404, 409 y 422. No menciona 200 (lecturas), 400 (JSON mal formado, que Fastify devuelve por defecto) ni 500. | CLAUDE.md regla 6 | 200 en lecturas. JSON mal formado → **422** `VALIDATION_ERROR`, para no introducir un código nuevo. 500 `INTERNAL_ERROR` con el formato común y sin filtrar detalles. |
| C7 | La spec dice que el dominio "ya está hecho", pero los tests **nunca se han ejecutado** porque no hay `package.json`. | spec §10 | La tarea B1 debe dejarlos en verde. Si alguno falla, lo comunico y no lo arreglo sin tu permiso. |
| C8 | El enunciado está en `ai-workspace/00-enunciado/`, no en `01-specs/`, y la estructura de la spec §8 no recoge la carpeta `00-enunciado`. | spec §8 | Añadir `00-enunciado/` a la spec §8. |

### 1.2 Huecos de la spec

| # | Pregunta | Propuesta |
|---|---|---|
| A1 | Formato de `country`: ¿se acepta `es` en minúsculas? | Normalizar a mayúsculas antes de validar. |
| A2 | ¿El `taxId` se guarda normalizado? Afecta a la unicidad: `b-12345674` frente a `B12345674`. | Guardar normalizado; así la restricción UNIQUE detecta el duplicado. |
| A3 | Límites de `companyName`, `contactEmail`, `storageGb` y `apiCalls`. | `companyName` de 1 a 200 caracteres tras `trim`; email con `z.string().email()`, máximo 254; `storageGb` ≤ 1 000 000 con máximo 2 decimales; `apiCalls` ≤ 1 000 000 000. |
| A4 | Validación de `GET /pricing/preview`: límites y país no soportado. | Mismas reglas que `activeUsers`; país no soportado → 422. |
| A5 | Códigos de error que faltan: solo está definido `VALIDATION_ERROR`. | `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `DUPLICATE_TAX_ID` (409), `INTERNAL_ERROR` (500). |
| A6 | `:id` no numérico, por ejemplo `/customers/abc`. | 422 `VALIDATION_ERROR`. |
| A7 | Búsqueda: ¿se normaliza el texto al buscar por identificador fiscal? (`b-123` debería encontrar `B123…`). ¿Hay paginación? | Buscar el texto tal cual en el nombre de empresa y su versión normalizada en `tax_id`. Escapar `%` y `_` en `LIKE`. Sin paginación, con un límite fijo de 100 resultados configurable en `config/`. |
| A8 | Forma de la respuesta de `GET /customers`: ¿incluye el número de simulaciones o la última? | Solo los datos del cliente (lo mismo que `GET /customers/:id`). |
| A9 | Orden del historial cuando dos filas tienen el mismo `created_at` (resolución de segundos). | `ORDER BY created_at DESC, id DESC`. |
| A10 | ¿Dónde vive el simulador? Para guardar necesita un `customerId`. | Dentro del detalle del cliente (`/customers/:id`), en una sección o pestaña "Simular". No habrá una vista suelta. |
| A11 | El alta de clientes (la spec §7 pide un "botón para crear cliente") no tiene vista definida. | Página `/customers/new` con errores por campo, que lleva al detalle tras el 201. |
| A12 | Divisas: "EUR, USD, GBP y alguna más". | EUR, USD, GBP, CHF, JPY y MXN, en `frontend/src/config`. |
| A13 | Caché de tipos de cambio de 1 hora: ¿en memoria o persistente? | `localStorage` con marca de tiempo, envuelto en try/catch, con la memoria como respaldo. |
| A14 | El historial se convierte con el tipo de cambio **actual**, no con el del día de la simulación. | Aceptarlo y documentarlo en el README. |
| A15 | Pendientes de la spec §12 (tabla de impuestos, límite de usuarios, tarificación del almacenamiento): ¿se dan por cerrados? | Tabla actual, límite de 100 000 y almacenamiento/llamadas sin coste. Documentarlo. |

### 1.3 Dependencias que propongo (CLAUDE.md exige justificarlas)

**Backend**
- `fastify`, `better-sqlite3`, `zod`: definidas en la spec.
- Dev: `typescript`, `vitest`, `@types/node`, `@types/better-sqlite3`.
- Dev: `tsx`, para `npm run dev` con recarga sin compilar. Alternativa: `tsc --watch` + `node --watch`, sin dependencia pero con dos procesos.
- **No** propongo `fastify-type-provider-zod`: valido con `schema.safeParse` en un helper propio y queda un fichero menos de magia.
- **No** propongo `@fastify/cors`: uso el proxy de Vite (ver F1).

**Frontend**
- `react`, `react-dom`; dev: `vite`, `@vitejs/plugin-react`, `typescript`.
- `react-router-dom`, para tener URLs reales (`/`, `/customers/new`, `/customers/:id`) y que el detalle sobreviva a recargar la página (criterio de la spec §11). Alternativa: estado propio sin URLs.
- Dev: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.

**Raíz (opcional)**: `concurrently` para tener un único `npm run dev`. La spec §11 se cumple sin ella (`npm install` + `npm run dev` en cada carpeta). ¿La quieres?

### 1.4 Decisiones tomadas (20/11/2026)

El desarrollador revisó todos los puntos anteriores. Resultado:

| Punto | Decisión |
|---|---|
| C2 | `tax_rate_percent INTEGER` en la BD; la API sigue devolviendo `taxRate` como fracción. |
| C3 | Slider de 0 a 200; el campo numérico admite hasta 100 000. |
| C6 | JSON mal formado → 422 `VALIDATION_ERROR`. |
| Carpetas | Se aprueban `backend/src/http/`, `backend/src/services/` y `frontend/src/config/`. CLAUDE.md actualizado. |
| F6 | Nuevo endpoint `GET /countries`, que lee la configuración del backend (tarea B10b). |
| A10 | El simulador va dentro del detalle del cliente. |
| Dependencias | Se aprueban `tsx`, `react-router-dom`, Testing Library + `jsdom` y `concurrently` en la raíz (tarea R1). |
| A12 | EUR, USD, GBP, CHF, JPY y MXN. |
| A3, A7, A15 | Se aceptan las propuestas. |
| C1, C4, C5, C7, C8, A1, A2, A4–A6, A8, A9, A11, A13, A14 | Se aceptan las propuestas. |

---

## 2. Tareas del backend

Convención: cada tarea termina con `npm test` y `npm run build` en verde dentro de `backend/`, y con una nota en `ai-workspace/03-vibe-coding/`.

### B1. Proyecto backend: `package.json`, TypeScript y Vitest
- **Objetivo:** tener un proyecto que compile y ejecute los tests de dominio que ya existen.
- **Ficheros:** `backend/package.json` (scripts `dev`, `build`, `start`, `test`, `typecheck`), `backend/tsconfig.json` (strict, NodeNext, `outDir: dist`), `backend/tsconfig.test.json` o la sección `include` correspondiente, `backend/vitest.config.ts`, `.gitignore` (añadir `dist/` y `*.db`). Si apruebas C5, también `backend/tests/*.test.ts`, solo los imports.
- **Aceptación:** `npm install` sin errores en Node 26. `better-sqlite3` funciona con su binario precompilado, sin compilar nada. Los tests de `pricing` y `taxId` pasan. `npm run build` genera `dist/` sin errores.
- **Verificación:** `npm test`, `npm run build` y `npm run typecheck`.

### B2. Configuración de entorno
- **Objetivo:** leer `PORT` y `DB_PATH` desde las variables de entorno, con valores por defecto, en un único sitio.
- **Ficheros:** `backend/src/config/env.ts` (validado con Zod) y `backend/.env.example`.
- **Aceptación:** con las variables ausentes usa `PORT=3000` y `DB_PATH=./data/saas-o-matic.db`. Un valor inválido hace fallar el arranque con un mensaje claro.
- **Verificación:** test unitario de `env.ts` con distintos objetos de entorno, inyectados sin tocar `process.env`.

### B3. Conexión SQLite y migraciones
- **Objetivo:** abrir la BD, activar `foreign_keys` y `journal_mode=WAL`, y aplicar las migraciones pendientes de forma automática e idempotente.
- **Ficheros:** `backend/src/db/connection.ts` (`openDatabase(path)`, que acepta `:memory:`), `backend/src/db/migrate.ts` (runner con tabla `schema_migrations` y cada migración en una transacción) y `backend/src/db/migrations/001_initial.ts` (esquema de la spec §5, con el cambio C2 si se aprueba). Las migraciones van como módulos TS que exportan el SQL, para que `tsc` las copie a `dist` sin un paso extra.
- **Aceptación:** migrar dos veces no falla ni duplica nada. Están las tablas e índices de la spec. Insertar una simulación con un `customer_id` inexistente falla porque las FK están activas.
- **Verificación:** `tests/db/migrate.test.ts` con BD en memoria.

### B4. Repositorio de clientes
- **Objetivo:** concentrar todo el SQL de `customers`.
- **Ficheros:** `backend/src/repositories/customerRepository.ts` (`create`, `findById`, `search(text)`, `existsByTaxId`) y `backend/src/repositories/mappers.ts` (fila snake_case → objeto camelCase, fecha a ISO según C1).
- **Aceptación:** consultas solo con parámetros `?`/`@`. La búsqueda es parcial y no distingue mayúsculas en nombre y tax_id, y escapa `%`/`_`. Un `tax_id` duplicado lanza un error tipado (`DuplicateTaxIdError`) traducido desde `SQLITE_CONSTRAINT_UNIQUE`.
- **Verificación:** `tests/repositories/customerRepository.test.ts` con BD en memoria: crear, buscar (mayúsculas, parcial, comodines literales), no encontrado y duplicado.

### B5. Repositorio de simulaciones
- **Objetivo:** concentrar el SQL de `simulations`.
- **Ficheros:** `backend/src/repositories/simulationRepository.ts` (`create`, `listByCustomer`).
- **Aceptación:** guarda base, tasa, impuesto y total recibidos (no calcula nada). El historial sale en orden descendente (A9).
- **Verificación:** `tests/repositories/simulationRepository.test.ts`.

### B6. App Fastify, formato de errores y helper de validación
- **Objetivo:** montar la aplicación con un manejador de errores único (spec §6) e inyección de dependencias para los tests.
- **Ficheros:** `backend/src/app.ts` (`buildApp({ db })` registra las rutas), `backend/src/server.ts` (lee env, abre la BD, migra y escucha), `backend/src/http/errors.ts` (clases `ValidationError`, `NotFoundError`, `ConflictError` y `toErrorResponse`) y `backend/src/http/validate.ts` (`parseOrThrow(schema, data)`, que convierte `ZodError` en `fields`).
- **Aceptación:** cualquier error sale como `{ error: { code, message, fields? } }`. Un JSON mal formado devuelve 422 (C6). Un error inesperado devuelve 500 sin stack.
- **Verificación:** `tests/http/errors.test.ts` con `app.inject` sobre una ruta de prueba.

### B7. `POST /customers`
- **Objetivo:** dar de alta clientes con validación estricta.
- **Ficheros:** `backend/src/routes/customers.ts` (solo el POST por ahora) y `backend/src/routes/schemas/customerSchemas.ts` (Zod).
- **Flujo:** Zod (forma, email, plan) → país soportado (`getTaxRatePercent`) → `validateTaxId` → guardar con el `taxId` normalizado → 201.
- **Aceptación:** 201 con el cliente. 422 por email, país, plan o taxId inválidos, con `fields.<campo>` y el mensaje del dominio. 409 `DUPLICATE_TAX_ID` aunque el duplicado venga escrito de otra forma (A2).
- **Verificación:** `tests/routes/customers.post.test.ts` con `app.inject` y BD en memoria. Incluye el DNI `12345678A` → 422 con "La letra de control del DNI no es correcta".

### B8. `POST /simulations`
- **Objetivo:** calcular y guardar una simulación.
- **Ficheros:** `backend/src/routes/simulations.ts`, `backend/src/routes/schemas/simulationSchemas.ts` y `backend/src/services/simulationService.ts` (orquesta: buscar el cliente → obtener la tasa → `calculateQuote` → guardar). La ruta solo valida, llama al servicio y responde.
- **Verificación adicional:** test unitario del servicio con BD en memoria (404 y cálculo guardado).
- **Aceptación:** con 15 usuarios en ES responde 201 con `baseCents 14000`, `taxCents 2940`, `totalCents 16940`, `taxRate 0.21`, `currency "EUR"` y `createdAt` ISO. 404 si el cliente no existe; 422 por cada regla de la spec §3.4 (negativos, decimales en `activeUsers`/`apiCalls`, > 100 000).
- **Verificación:** `tests/routes/simulations.post.test.ts`.

### B9. Lecturas: `GET /customers`, `GET /customers/:id`, `GET /customers/:id/simulations`
- **Objetivo:** dar al frontend los endpoints de consulta.
- **Ficheros:** `backend/src/routes/customers.ts` (añadir los GET) y `backend/src/routes/schemas/customerSchemas.ts` (query y params).
- **Aceptación:** búsqueda por nombre o taxId, parcial y sin distinguir mayúsculas. Sin `search`, lista todos. 404 si el cliente no existe, también en `/simulations`. `:id` inválido → 422 (A6). Historial ordenado (A9).
- **Verificación:** `tests/routes/customers.get.test.ts`.
- **Nota:** si `customers.ts` supera unas 200 líneas, lo divido en `customers.write.ts` y `customers.read.ts`.

### B10. `GET /pricing/preview`
- **Objetivo:** calcular sin guardar, para el slider.
- **Ficheros:** `backend/src/routes/pricing.ts` y `backend/src/routes/schemas/pricingSchemas.ts`.
- **Aceptación:** `?users=15&country=ES` devuelve `{ activeUsers, baseCents, taxRate, taxCents, totalCents, currency }`. 422 si faltan `users`/`country`, si no son válidos o si el país no está soportado (A4). No escribe en la BD.
- **Verificación:** `tests/routes/pricing.test.ts`, que comprueba los 8 casos de la spec §3.1 a través de HTTP.

### B10b. `GET /countries`
- **Objetivo:** que el frontend obtenga los países soportados de la misma fuente que el backend (decisión F6).
- **Ficheros:** `backend/src/routes/countries.ts` y `backend/src/app.ts` (registrar la ruta).
- **Aceptación:** devuelve `[{ code: "ES", taxRate: 0.21 }, …]` con todos los países de `config/taxRates.ts`, ordenados por código.
- **Verificación:** `tests/routes/countries.test.ts`, que compara la respuesta con la config.

### B11. Cierre del backend
- **Objetivo:** comprobación manual de punta a punta.
- **Verificación manual:** `npm run dev`; borrar `data/*.db`; crear el cliente del ejemplo de la spec con `curl`/REST Client; simular; listar el historial; reiniciar el servidor y ver que los datos siguen ahí (criterio §11). Añadir `backend/requests.http` como ejemplo reproducible (opcional).

---

## 3. Tareas del frontend

Convención: `npm test` y `npm run build` en verde dentro de `frontend/`.

### F1. Proyecto Vite + React + TS
- **Objetivo:** esqueleto que compila, con tests y el proxy hacia el backend.
- **Ficheros:** `frontend/package.json`, `frontend/tsconfig*.json`, `frontend/vite.config.ts` (proxy `/api` → `http://localhost:3000` con *rewrite* del prefijo: evita CORS y que choquen las rutas `/customers/:id` del SPA con la API), `frontend/index.html`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/test/setup.ts` y `frontend/src/styles/*.css` (CSS plano con variables, móvil primero, sin framework de estilos).
- **Aceptación:** `npm run dev` muestra la app y una petición a `/api/customers` llega al backend.
- **Verificación:** `npm run build`, un test de humo que renderiza `App` y una comprobación manual del proxy.

### F2. Cliente de API tipado
- **Objetivo:** un único punto de acceso HTTP con errores tipados.
- **Ficheros:** `frontend/src/api/http.ts` (`request<T>`, que convierte el formato de error en `ApiError { status, code, message, fields }`), `frontend/src/api/types.ts` (DTOs que reflejan la spec §6), `frontend/src/api/customers.ts`, `frontend/src/api/simulations.ts` y `frontend/src/api/pricing.ts`.
- **Aceptación:** ninguna otra parte del frontend llama a `fetch` contra el backend. Las respuestas 4xx llegan como `ApiError` con `fields`.
- **Verificación:** `api/http.test.ts` con `fetch` simulado (2xx, 422 con fields, 404 y error de red).

### F3. Divisas: servicio, caché, contexto y selector
- **Objetivo:** selector global de divisa con los tres estados obligatorios.
- **Ficheros:** `frontend/src/config/currencies.ts` (lista de A12, URL de la API y TTL), `frontend/src/api/exchangeRates.ts` (fetch + caché de A13), `frontend/src/hooks/useExchangeRates.ts`, `frontend/src/features/currency/CurrencyContext.tsx`, `frontend/src/components/CurrencySelector.tsx` y `frontend/src/utils/money.ts` (`formatMoney(cents, currency, rate)` con `Intl.NumberFormat`).
- **Aceptación:**
  - Mientras carga, se ve "Cargando tipos de cambio…" y los importes se muestran en EUR.
  - Si la carga falla, hay un aviso visible con «Reintentar», se fuerza EUR y el selector queda deshabilitado.
  - Si carga bien, cambiar la divisa actualiza todos los importes sin recargar.
  - Una segunda carga antes de 1 h no hace otra petición.
  - Una respuesta sin la divisa elegida vuelve a EUR.
- **Verificación:** tests de `money.ts` (conversión y formato por divisa), de `exchangeRates.ts` (caché vigente, caducada y `localStorage` inaccesible) y de `useExchangeRates` (cargando → ok, cargando → error → reintento → ok).

### F4. Layout y enrutado
- **Objetivo:** cabecera con el selector y la navegación entre vistas.
- **Ficheros:** `frontend/src/components/Layout.tsx`, `frontend/src/App.tsx` (rutas `/`, `/customers/new`, `/customers/:id` y 404) y `frontend/src/components/` comunes: `Card`, `ErrorMessage`, `EmptyState` y `Spinner`.
- **Aceptación:** navegación con teclado y foco visible. La cabecera se adapta a 400 px de ancho.
- **Verificación:** manual en móvil y escritorio con las devtools.

### F5. Dashboard y buscador
- **Objetivo:** lista de clientes en tarjetas con búsqueda.
- **Ficheros:** `frontend/src/hooks/useDebouncedValue.ts`, `frontend/src/features/customers/CustomerListPage.tsx`, `frontend/src/features/customers/CustomerCard.tsx` y `frontend/src/hooks/useCustomers.ts` (cancela la petición anterior con `AbortController`).
- **Aceptación:** debounce de unos 300 ms. Estados de carga, error con reintento y vacío (distinto si hay búsqueda o no). Botón «Nuevo cliente». Tarjeta enlazada al detalle. El campo de búsqueda tiene `<label>`.
- **Verificación:** test de `useDebouncedValue` con timers falsos y test de `CustomerListPage` con la API simulada (lista, vacío y error).

### F6. Alta de cliente
- **Objetivo:** formulario con errores por campo devueltos por la API.
- **Ficheros:** `frontend/src/features/customers/CustomerFormPage.tsx`, `frontend/src/api/countries.ts` y `frontend/src/hooks/useCountries.ts`. El `<select>` de países se rellena con `GET /countries` (B10b).
- **Aceptación:** validaciones del backend mostradas junto a su campo (`aria-describedby`, `aria-invalid`). El foco va al primer campo con error. Botón deshabilitado mientras se envía. Tras el 201, navega al detalle. El 409 se muestra en el campo del identificador fiscal.
- **Verificación:** test con la API simulada (422 con fields y 409) y prueba manual con el DNI `12345678A`.

### F7. Detalle de cliente e historial
- **Objetivo:** tarjetas responsive con los datos del cliente y su historial.
- **Ficheros:** `frontend/src/features/customer-detail/CustomerDetailPage.tsx`, `CustomerInfoCard.tsx`, `SimulationHistory.tsx` y `frontend/src/hooks/useCustomer.ts`.
- **Aceptación:** 404 → mensaje "Cliente no encontrado" con enlace de vuelta. El historial muestra la fecha (formateada con `Intl.DateTimeFormat`), los usuarios y base/impuesto/total en la divisa seleccionada, y tiene estado vacío. Una columna en móvil y varias en escritorio.
- **Verificación:** test con la API simulada (datos, 404 e historial vacío) y prueba manual cambiando la divisa.

### F8. Simulador interactivo
- **Objetivo:** proyección en tiempo real y botón de guardar, sin duplicar la lógica de tramos.
- **Ficheros:** `frontend/src/features/simulator/Simulator.tsx`, `UsersInput.tsx` (slider + número sincronizados, C3), `QuoteSummary.tsx` y `frontend/src/hooks/usePricingPreview.ts` (debounce corto + `AbortController` para descartar respuestas viejas).
- **Aceptación:**
  - Mover el slider actualiza base, impuesto y total (vía `GET /pricing/preview`) en la divisa elegida.
  - Slider y campo numérico siempre coinciden.
  - Almacenamiento y llamadas tienen campos propios con su validación.
  - «Guardar simulación» envía `POST /simulations`, muestra confirmación y la simulación aparece en el historial sin recargar.
  - Los errores de preview y de guardado se muestran.
  - La palabra "tramo" no aparece en ningún cálculo del frontend.
- **Verificación:** test de `UsersInput` (sincronía y límites) y de `Simulator` con la API simulada (pinta el preview y el guardado refresca el historial). Revisión manual en móvil.

### F9. Pulido de accesibilidad y responsive
- **Objetivo:** repasar los criterios de la spec §7 "Calidad de interfaz".
- **Ficheros:** CSS y los componentes que lo necesiten.
- **Aceptación:** sin errores graves de Lighthouse en accesibilidad. Todo usable a 360 px. Foco visible. Contraste suficiente.
- **Verificación:** Lighthouse manual y navegación solo con teclado.

---

## 4. Documentación y entrega

### R1. Arranque conjunto desde la raíz
- **Objetivo:** levantar backend y frontend con un solo comando.
- **Ficheros:** `package.json` en la raíz, con `concurrently` y los scripts `install:all`, `dev` y `test`.
- **Aceptación:** `npm install` y `npm run dev` en la raíz arrancan los dos servicios con la salida etiquetada. Los comandos por carpeta siguen funcionando.
- **Verificación:** manual, desde un clon limpio.

### D1. README
- **Objetivo:** levantar el proyecto en pocos pasos y explicar las decisiones.
- **Ficheros:** `README.md`.
- **Contenido:** requisitos (Node 26 o superior; `better-sqlite3` trae binarios precompilados, así que no hacen falta herramientas de compilación); explicar que el aviso `install-scripts … better-sqlite3` de `npm install` es inofensivo; pasos `cd backend && npm install && npm run dev` y `cd frontend && npm install && npm run dev`, más la alternativa de un solo comando desde la raíz (R1); URLs; scripts de tests; resumen de la API; decisiones de negocio (el plan no cambia el precio; almacenamiento y llamadas no tarifican; tabla de impuestos; NIF K/L/M fuera de alcance; historial convertido con el tipo actual, A14); estructura y enlace a `ai-workspace/`.
- **Aceptación:** con un clon limpio, siguiendo el README al pie de la letra, la app funciona.
- **Verificación:** manual, desde una carpeta nueva y sin `node_modules`.

### D2. Actualizar la spec y el material de `ai-workspace`
- **Objetivo:** documentar la arquitectura final y cerrar el registro del proceso. La spec se actualizó con las decisiones de la sección 1 el 20/11/2026, antes de empezar a programar.
- **Ficheros:** `ai-workspace/02-arquitectura/` (decisiones, esquema y capas) y `ai-workspace/03-vibe-coding/` (una nota por tarea: prompt, resultado y correcciones).
- **Aceptación:** ninguna decisión tomada en el código falta en la spec.
- **Verificación:** revisión manual.

---

## 5. Orden y dependencias

```
B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9 → B10 → B10b → B11
                                         │
F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9   (F2 en adelante necesita B9/B10/B10b para la prueba manual)
                                                    → R1 → D1 → D2
```

D2 se va actualizando a lo largo del proceso: después de cada tarea añado su nota en `03-vibe-coding/`.
