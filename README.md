# SaaS-O-Matic

Herramienta interna para que el equipo comercial registre clientes corporativos, simule su consumo SaaS y obtenga el presupuesto mensual: tarificación por tramos, impuesto del país del cliente y conversión a varias divisas.

- **Backend:** Node.js 26, TypeScript, Fastify, SQLite (`better-sqlite3`) y Zod.
- **Frontend:** React 19, Vite y TypeScript.
- **Tests:** Vitest y Testing Library, más `axe-core` para la accesibilidad.

## Requisitos

- **Node.js 26 o superior**, que incluye npm. Compruébalo con `node --version`. Con una versión anterior (por ejemplo, las LTS 22 o 24), npm solo avisa (`EBADENGINE`), pero las herramientas pueden fallar después. Si usas nvm, `nvm use` lee el `.nvmrc` del proyecto.
- **No hace falta** Python ni herramientas de compilación: `better-sqlite3` trae binarios precompilados para Windows, macOS y Linux.
- Conexión a internet solo para los tipos de cambio. Sin ella, la app funciona en EUR.

## Arranque rápido

```bash
git clone https://github.com/Oterine/saas-o-matic.git
cd saas-o-matic
npm install      # instala la raíz, el backend y el frontend
npm run dev      # arranca los dos a la vez
```

Abre **http://localhost:5173**. El backend escucha en http://localhost:3000, y el frontend le reenvía las peticiones a `/api` mediante un proxy, así que no hace falta configurar CORS.

La base de datos se crea y se migra sola al arrancar el backend, en `backend/data/saas-o-matic.db`. Para empezar de cero, para el servidor y borra `backend/data/`.

### Cada proyecto por separado

```bash
cd backend  && npm install && npm run dev     # terminal 1
cd frontend && npm install && npm run dev     # terminal 2
```

## Scripts

Desde la raíz:

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias de la raíz, del backend y del frontend |
| `npm run dev` | Backend y frontend en modo desarrollo, con la salida etiquetada |
| `npm test` | Tests del backend y del frontend |
| `npm run test:e2e` | Compila el backend y recorre el flujo completo de la app contra él (alta → simulación → historial) |
| `npm run build` | Typecheck y build de los dos proyectos |

En cada proyecto también están `dev`, `build`, `test` y `typecheck`. El backend añade `start` (sirve `dist/`) y el frontend, `preview`.

## Configuración (opcional)

No hace falta configurar nada. Para cambiar los valores por defecto, copia los ejemplos:

| Fichero | Variable | Por defecto |
|---|---|---|
| `backend/.env` (desde `.env.example`) | `PORT` | `3000` |
| | `DB_PATH` (relativa a `backend/`) | `./data/saas-o-matic.db` |
| `frontend/.env` (desde `.env.example`) | `BACKEND_URL` | `http://localhost:3000` |

Si cambias `PORT` en el backend, ajusta `BACKEND_URL` en el frontend.

### Problemas frecuentes

- **Puerto 3000 ocupado** (`EADDRINUSE` en la salida `[backend]`): pon otro `PORT` en `backend/.env` y el mismo en `BACKEND_URL` de `frontend/.env`.
- **Puerto 5173 ocupado:** Vite elige el siguiente libre y lo indica en la salida `[frontend]`. Abre esa URL.
- **La app dice que no puede conectar con el servidor:** el backend no está en marcha o `BACKEND_URL` apunta a otro puerto.
- **Aviso de tipos de cambio:** no hay conexión con open.er-api.com. La app sigue funcionando en EUR; pulsa «Reintentar» cuando vuelva la conexión.

## Uso

1. **Clientes:** listado en tarjetas con buscador por nombre o identificador fiscal. No distingue mayúsculas ni tildes, y entiende el identificador escrito con guiones o puntos.
2. **Nuevo cliente:** el identificador fiscal se valida con el algoritmo oficial si el país es España (DNI, NIE y CIF). En otros países solo se comprueba el formato.
3. **Detalle del cliente:**
   - sus datos;
   - el **simulador**: deslizador de 0 a 200 usuarios o campo numérico hasta 100.000, con el presupuesto en tiempo real;
   - el **historial** de simulaciones guardadas.
4. **Divisa:** el selector de la cabecera convierte todos los importes (EUR, USD, GBP, CHF, JPY y MXN) con los tipos de [open.er-api.com](https://open.er-api.com). Los tipos se guardan en caché durante 1 hora. Si la API falla, se muestra un aviso con «Reintentar» y los importes siguen en EUR.

## API

Base `http://localhost:3000`, JSON. Los importes van en **céntimos de EUR**. El contrato completo está en la [spec, §6](ai-workspace/01-specs/spec.md).

| Método y ruta | Descripción | Respuestas |
|---|---|---|
| `POST /customers` | Alta de cliente | 201, 409 (identificador duplicado), 422 |
| `GET /customers?search=` | Listado y búsqueda (orden alfabético, máx. 100) | 200, 422 |
| `GET /customers/:id` | Detalle | 200, 404, 422 |
| `GET /customers/:id/simulations` | Historial (la más reciente primero) | 200, 404, 422 |
| `POST /simulations` | Calcula y guarda una simulación | 201, 404, 422 |
| `GET /pricing/preview?users=N&country=XX` | Presupuesto sin guardar (para el simulador) | 200, 422 |
| `GET /countries` | Países soportados y su tasa | 200 |

Todos los errores tienen el mismo formato: `{ "error": { "code", "message", "fields"? } }`, con un mensaje en español por campo.

Para probar la API a mano, [backend/requests.http](backend/requests.http) tiene ejemplos de todas las rutas, que se pueden lanzar con la extensión REST Client de VS Code.

> **PowerShell 5.1 (Windows):** un script `.ps1` guardado sin BOM se lee como ANSI y corrompe las tildes **antes** de enviarlas, de modo que puede parecer que la API no las admite. Usa `requests.http` o escribe esos caracteres con escapes JSON (`"Álvarez"`).

## Decisiones de negocio

| Tema | Decisión |
|---|---|
| Tarificación | Por tramos acumulativos: usuarios 1–10 a 10 €, 11–50 a 8 € y más de 50 a 5 €. Por ejemplo, 15 usuarios = 100 € + 40 € = **140 €**. |
| Impuesto | Según el país del cliente: ES 21 %, PT 23 %, FR 20 %, DE 19 %, IT 22 %, GB 20 %, US 0 % (`backend/src/config/taxRates.ts`). Redondeo *half-up* al céntimo. |
| Plan | `starter`, `business` y `enterprise` son una **etiqueta comercial: no cambian el precio**. |
| Almacenamiento y llamadas a la API | Se guardan en la simulación, pero **no se tarifican**: el enunciado solo tarifica por usuarios. |
| Usuarios | De 0 a 100.000 por simulación. El deslizador cubre 0–200 y el campo numérico el resto. |
| Dinero | Siempre en **céntimos enteros**; la tasa se guarda como porcentaje entero. La conversión de divisa solo se hace al mostrar. |
| Historial en otra divisa | Se convierte con el tipo de cambio **actual**, no con el del día de la simulación. |
| Identificador fiscal | Se guarda normalizado (mayúsculas, sin espacios, guiones ni puntos) y es único. **Fuera de alcance:** los NIF especiales que empiezan por K, L o M. |
| Fuera de alcance | Autenticación, facturación real y edición o borrado de clientes. |

## Arquitectura

```
backend/src/
  config/        tasas, tramos, límites y entorno (sin constantes mágicas)
  domain/        lógica pura: tramos (pricing.ts) y DNI/NIE/CIF (taxId.ts)
  db/            conexión SQLite y migraciones automáticas
  repositories/  único sitio con SQL de datos (siempre parametrizado)
  services/      casos de uso (simulación, presupuesto)
  http/          formato de errores común y validación con Zod
  routes/        solo HTTP: validar, llamar y responder
frontend/src/
  api/           cliente tipado del backend y API de tipos de cambio
  features/      páginas: clientes, alta, detalle, simulador, divisa
  components/    layout y componentes comunes (estados, formularios)
  hooks/, utils/, config/
frontend/e2e/    prueba de punta a punta contra el backend real
```

- **La lógica de tramos solo existe en el backend.** El simulador pide cada cálculo a `GET /pricing/preview`, así que lo que se ve es exactamente lo que se guarda.
- **La validación también vive solo en el backend.** El frontend muestra sus mensajes junto a cada campo, sin reglas duplicadas.
- **Calidad:**
  - unos 300 tests (dominio, repositorios, rutas, hooks y pantallas);
  - una prueba de punta a punta;
  - `axe-core` (WCAG 2.x A/AA) en todas las pantallas;
  - contraste de la paleta calculado para los temas claro y oscuro.

## Proceso de desarrollo con IA

La carpeta [ai-workspace/](ai-workspace/) recoge cómo se diseñó y construyó el proyecto con un asistente de IA (Claude Code):

- [00-enunciado/](ai-workspace/00-enunciado/): el enunciado del reto.
- [01-specs/](ai-workspace/01-specs/): la [spec](ai-workspace/01-specs/spec.md) (fuente de verdad) y el [plan](ai-workspace/01-specs/plan.md) de tareas, con las dudas detectadas y cómo se resolvieron.
- [02-arquitectura/](ai-workspace/02-arquitectura/): las directrices de arquitectura para la IA.
- [03-vibe-coding/notas.md](ai-workspace/03-vibe-coding/notas.md): el registro de cada tarea, con las decisiones tomadas, las correcciones del desarrollador y los errores de la IA detectados en la revisión.
- [CLAUDE.md](CLAUDE.md) y [.claude/](.claude/): las reglas que sigue el asistente y las skills de revisión (`/revisar`) y registro (`/registrar-sesion`).

## Notas técnicas

- `backend/.npmrc` y `frontend/.npmrc` llevan `ignore-scripts=true`. Ninguna dependencia necesita scripts de instalación, y así npm no intenta compilar `better-sqlite3` desde el código fuente (lo que exigiría Visual Studio Build Tools o Python). Además, ninguna dependencia ejecuta código al instalarse.
- Tipos de cambio: [open.er-api.com](https://open.er-api.com/v6/latest/EUR), API pública y gratuita, sin clave.
