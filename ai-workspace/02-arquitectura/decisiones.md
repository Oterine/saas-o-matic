# Registro de decisiones

Decisiones de diseño relevantes, con las alternativas descartadas. Las de reglas de negocio y contratos están en la [spec](../01-specs/spec.md) y en el [plan §1.4](../01-specs/plan.md); el detalle de cada tarea, en [las notas](../03-vibe-coding/notas.md).

## Backend

| # | Decisión | Alternativas descartadas | Motivo | Tarea |
|---|---|---|---|---|
| 1 | Validación con `schema.safeParse` en un helper propio (`parseOrThrow`) | `fastify-type-provider-zod` | Una dependencia y una capa de magia menos; los errores se convierten en `fields` como pide la spec. | B6 |
| 2 | Errores de dominio, repositorio y servicio con clases propias, traducidas a HTTP en un único sitio | Lanzar errores HTTP desde los servicios | Los servicios no dependen de la capa HTTP (se corrigió en B8). | B6, B8 |
| 3 | JSON mal formado, cuerpo vacío o enorme → 422 con un mensaje según la causa | 400, 413 o 415 | Un solo código para "entrada no válida" (decisión C6), sin mensajes engañosos. | B6 |
| 4 | Mensajes de validación escritos a mano en español | Traducción `es` de Zod | La traducción de Zod da textos como "se esperaba int"; se queda solo como respaldo. | B6, B7 |
| 5 | El identificador fiscal se valida fuera del esquema principal | `superRefine` sobre el objeto | Zod no ejecuta validaciones del objeto si algún campo falla, y el usuario descubriría los errores de uno en uno. | B7 |
| 6 | Un único `quoteFor` para la vista previa y la simulación | Calcular en cada ruta | Lo que ve el comercial es exactamente lo que se guarda. | B10 |
| 7 | `GET /countries` lee la tabla de impuestos | Duplicar la lista en el frontend | Una sola fuente de verdad (decisión F6). | B10b |
| 8 | Sin CORS: proxy de Vite con prefijo `/api` | `@fastify/cors` | Sin dependencia y sin choques entre las rutas del SPA y las de la API. | F1 |

## Frontend

| # | Decisión | Alternativas descartadas | Motivo | Tarea |
|---|---|---|---|---|
| 9 | La validación vive solo en el backend (`noValidate`) | Repetir las reglas en el cliente | Sin reglas duplicadas que se desincronicen; los mensajes son siempre los mismos y en español. | F6, F8 |
| 10 | `useAsync(load, key)` para toda carga de datos | `useEffect` en cada vista o una librería (React Query) | Cancelación, respuestas viejas descartadas, datos conservados y reintento en unas 40 líneas, sin dependencia. La clave evita bucles con funciones inline (se corrigió en F5). | F5 |
| 11 | Caché de tipos de cambio en `localStorage` con respaldo en memoria | Solo memoria | Sobrevive a una recarga durante 1 hora y funciona aunque `localStorage` falle. | F3 |
| 12 | `axe-core` directamente | `vitest-axe` | `vitest-axe` es la versión 0.1.0, de 2022, sin mantenimiento; solo añade un *matcher* sobre `axe-core`. | F9 |
| 13 | CSS plano con variables, una hoja por componente | Tailwind, CSS-in-JS | Sin dependencias. Se dividió cuando `index.css` llegó a 411 líneas (máximo ~200). | F1, F8 |
| 14 | Tests junto a cada fichero; e2e en `frontend/e2e/` con su configuración | Carpeta `tests/` única | Convención de React. La prueba de punta a punta necesita el backend compilado y no debe ralentizar `npm test`. | F1, R1 |

## Entorno

| # | Decisión | Alternativas descartadas | Motivo | Tarea |
|---|---|---|---|---|
| 15 | Node 26 | Node 20 (spec original), Node ≥ 22 | Node 20 ya no tiene soporte; el desarrollador eligió la versión que tenía instalada. | B1 |
| 16 | `ignore-scripts=true` en `.npmrc` | Confiar en la política de scripts de npm | Con un `npm install` anidado (o con otras versiones de npm) se intentaba compilar `better-sqlite3`, que trae binarios precompilados. Además, ninguna dependencia ejecuta código al instalarse. | R1 |
| 17 | `npm ci` en el `postinstall` de la raíz | `npm install` | No reescribe los lockfiles en la máquina de quien clona. | R1 |
| 18 | Un commit por tarea, con su nota en `03-vibe-coding/` | Commits grandes | Historial revisable y trazable con el plan. | Todas |
