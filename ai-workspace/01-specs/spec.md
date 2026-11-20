# SaaS-O-Matic — Especificación funcional y técnica

v2 · Alberto Otero de la Peña · 20/11/2026. Incorpora las decisiones de `plan.md` §1.4.

## 1. Objetivo

Herramienta interna para que el equipo comercial registre clientes corporativos, simule su consumo SaaS y obtenga el presupuesto mensual por tramos, con impuestos y convertido a distintas divisas.

**Fuera de alcance:** autenticación, facturación real, edición o borrado de clientes, multi-tenant.

## 2. Stack y decisiones

| Área | Decisión | Motivo |
|---|---|---|
| Backend | Node.js 26 + TypeScript + Fastify | Tipado estático, API ligera, validación por esquema |
| Base de datos | SQLite con `better-sqlite3` | Pedido en el enunciado, sin servidor |
| Validación de entrada | Zod | Un solo esquema para tipos y validación |
| Tests backend | Vitest | Rápido y sin configuración |
| Frontend | React + Vite + TypeScript | Mismo lenguaje en todo el proyecto |
| Tests frontend | Vitest + Testing Library (solo lógica clave) | Cobertura útil sin dispersarse |

**Principio de diseño:** el dinero se guarda y calcula siempre en **céntimos enteros (EUR)**. La conversión a otra divisa es solo de visualización y se hace en el frontend.

## 3. Reglas de negocio

### 3.1 Tarificación por tramos (acumulativa)

| Tramo | Usuarios | Precio por usuario |
|---|---|---|
| 1 | 1 a 10 | 10 € |
| 2 | 11 a 50 | 8 € |
| 3 | más de 50 | 5 € |

Cada usuario se cobra al precio del tramo en el que cae.

```
base = min(u,10)*10 + max(0, min(u,50)-10)*8 + max(0, u-50)*5
```

**Casos de prueba obligatorios (base en euros):**

| Usuarios | Base |
|---|---|
| 0 | 0 |
| 1 | 10 |
| 10 | 100 |
| 11 | 108 |
| 15 | 140 |
| 50 | 420 |
| 51 | 425 |
| 100 | 670 |

### 3.2 Impuestos

`impuesto = round(base × tasa)` en céntimos (redondeo half-up). `total = base + impuesto`.

**Implementación:** las tasas se guardan como **porcentaje entero** (21 = 21 %) en la configuración, para evitar errores de coma flotante: `impuesto = round(base × porcentaje / 100)`. La API devuelve `taxRate` como fracción (`porcentaje / 100`, por ejemplo 0.21).

**Decisión de diseño (el enunciado no define las tasas):** tabla de IVA/impuesto por país en un único fichero de configuración, fácil de ampliar.

| País (ISO-2) | Tasa |
|---|---|
| ES | 21 % |
| PT | 23 % |
| FR | 20 % |
| DE | 19 % |
| IT | 22 % |
| GB | 20 % |
| US | 0 % |

El código de país se pasa a mayúsculas antes de validarlo (`es` → `ES`). Si el país no está en la tabla, `POST /customers` y `GET /pricing/preview` responden 422 (país no soportado). La tabla se expone en `GET /countries`, para que el frontend no la duplique.

Cada simulación guarda el porcentaje aplicado (`tax_rate_percent`). La API lo devuelve como fracción en `taxRate`.

### 3.3 Planes y otros parámetros

**Decisión de diseño:** el plan (`starter`, `business`, `enterprise`) es una etiqueta comercial del cliente y **no cambia el precio**. El almacenamiento (GB) y las llamadas a la API se guardan en la simulación pero **no afectan al coste**, porque el enunciado solo tarifica por usuarios. Esto debe quedar anotado también en el README.

### 3.4 Validación de datos de la simulación

- `activeUsers`: entero ≥ 0 y ≤ 100000.
- `storageGb`: número ≥ 0 y ≤ 1 000 000, con 2 decimales como máximo.
- `apiCalls`: entero ≥ 0 y ≤ 1 000 000 000.
- `customerId` debe existir (404 si no).

`GET /pricing/preview` aplica la misma regla a `users`.

### 3.5 Validación de datos del cliente

- `companyName`: texto de 1 a 200 caracteres tras quitar espacios al principio y al final.
- `contactEmail`: formato de email válido, 254 caracteres como máximo.
- `country`: ISO-2 soportado (§3.2).
- `plan`: `starter`, `business` o `enterprise`.
- `taxId`: §4.

## 4. Validación del identificador fiscal

### 4.1 Si el país es ES (obligatoria y estricta)

Se normaliza (mayúsculas, sin espacios, guiones ni puntos, así que `B-12.345.674` → `B12345674`) y debe cumplir **uno** de estos formatos:

**DNI:** 8 dígitos + letra. Letra esperada = `"TRWAGMYFPDXBNJZSQVHLCKE"[número % 23]`.

**NIE:** `X`, `Y` o `Z` + 7 dígitos + letra. Se sustituye X→0, Y→1, Z→2 y se aplica el mismo cálculo que el DNI.

**CIF:** letra de tipo + 7 dígitos + control.

- Letra de tipo válida: `A B C D E F G H J N P Q R S U V W`.
- Se suman los dígitos en posiciones pares (2.ª, 4.ª, 6.ª).
- Cada dígito en posición impar (1.ª, 3.ª, 5.ª, 7.ª) se multiplica por 2 y se suman las cifras del resultado.
- `suma = pares + impares`, `dígito = (10 − suma % 10) % 10`, `letra = "JABCDEFGHI"[dígito]`.
- El control debe ser **letra** para los tipos `N P Q R S W`, **dígito** para `A B E H`, y cualquiera de los dos para el resto.

**Fuera de alcance (documentarlo):** NIF especiales que empiezan por K, L o M.

**Ejemplos de prueba:** DNI `12345678Z` válido, `12345678A` inválido. NIE `X1234567L` válido. CIF `A58818501`, `B12345674`, `P1234567D`, `Q2826000H` y `N0123456F` válidos; `A58818502` inválido.

### 4.2 Si el país no es ES

Solo se valida el formato genérico: 5 a 20 caracteres alfanuméricos tras normalizar.

El identificador fiscal se guarda **normalizado** y es **único** por cliente: 409 si ya existe, aunque se haya escrito con otro formato.

## 5. Modelo de datos (SQLite)

```sql
CREATE TABLE customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name  TEXT NOT NULL,
  tax_id        TEXT NOT NULL UNIQUE,
  contact_email TEXT NOT NULL,
  country       TEXT NOT NULL,            -- ISO-2
  plan          TEXT NOT NULL CHECK (plan IN ('starter','business','enterprise')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE simulations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id   INTEGER NOT NULL REFERENCES customers(id),
  active_users  INTEGER NOT NULL CHECK (active_users >= 0),
  storage_gb    REAL    NOT NULL CHECK (storage_gb >= 0),
  api_calls     INTEGER NOT NULL CHECK (api_calls >= 0),
  base_cents    INTEGER NOT NULL,
  tax_rate_percent INTEGER NOT NULL CHECK (tax_rate_percent >= 0), -- tasa aplicada (21 = 21 %)
  tax_cents     INTEGER NOT NULL,
  total_cents   INTEGER NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_simulations_customer ON simulations(customer_id);
CREATE INDEX idx_customers_company ON customers(company_name);
```

Se guarda la tasa aplicada en cada simulación para que el historial no cambie si la tabla de impuestos se modifica. Se guarda como porcentaje entero, igual que en la configuración, para no almacenar floats asociados a importes.

`created_at` se guarda en el formato de SQLite (`YYYY-MM-DD HH:MM:SS`, UTC). El repositorio lo convierte a ISO 8601 (`2026-11-20T10:00:00Z`) al devolverlo.

Las migraciones se aplican automáticamente al arrancar, son idempotentes y se registran en la tabla `schema_migrations`. Las claves foráneas se activan con `PRAGMA foreign_keys = ON`.

## 6. Contratos de la API

Base: `http://localhost:3000`. Todo en JSON. Importes en **céntimos de EUR**.

**Formato de error (común):**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "taxId": "Letra de control incorrecta" } } }
```

| HTTP | `code` | Cuándo |
|---|---|---|
| 200 | — | Lecturas correctas |
| 201 | — | Creación correcta |
| 404 | `NOT_FOUND` | Cliente inexistente |
| 409 | `DUPLICATE_TAX_ID` | Identificador fiscal ya registrado |
| 422 | `VALIDATION_ERROR` | Datos inválidos, JSON mal formado, parámetros de URL o query inválidos (por ejemplo, `:id` no numérico) |
| 500 | `INTERNAL_ERROR` | Error inesperado; nunca expone detalles internos |

`fields` solo aparece en `VALIDATION_ERROR` y tiene un mensaje por campo. Los campos anidados usan la ruta con puntos (`address.country`). Un error que afecta a toda la petición, y no a un campo concreto (por ejemplo, un cuerpo que no es un objeto JSON), va en la clave especial `_`.

### POST /customers

Petición:

```json
{ "companyName": "Acme S.L.", "taxId": "B12345674", "contactEmail": "ops@acme.es", "country": "ES", "plan": "business" }
```

Respuestas: **201** con el cliente creado, **422** validación (email, país, plan, identificador fiscal), **409** identificador fiscal duplicado.

### POST /simulations

Petición:

```json
{ "customerId": 1, "activeUsers": 15, "storageGb": 100, "apiCalls": 50000 }
```

Respuesta **201**:

```json
{ "id": 7, "customerId": 1, "activeUsers": 15, "storageGb": 100, "apiCalls": 50000,
  "baseCents": 14000, "taxRate": 0.21, "taxCents": 2940, "totalCents": 16940,
  "currency": "EUR", "createdAt": "2026-11-20T10:00:00Z" }
```

Otras respuestas: **404** cliente inexistente, **422** datos inválidos.

### Endpoints de lectura (necesarios para el frontend)

- `GET /customers?search=texto`: busca por nombre de empresa o identificador fiscal, de forma parcial y sin distinguir mayúsculas. En el nombre tampoco se distinguen tildes ni diéresis (`alvarez` encuentra `Álvarez`, `nandu` encuentra `ÑANDÚ`). En el identificador se busca el texto normalizado (§4.1), así que `b-123` encuentra `B123…`. Los caracteres `%` y `_` se tratan como literales. Sin `search`, lista todos. Orden alfabético por nombre de empresa, sin distinguir mayúsculas ni tildes (la `ñ` ordena junto a la `n`), con el `id` para desempatar. Devuelve como máximo 100 resultados (configurable), sin paginación. Cada elemento tiene la misma forma que el detalle. `search` admite hasta 200 caracteres (el máximo del nombre de empresa) y debe aparecer una sola vez en la URL; si no, responde 422.
- `GET /customers/:id`: detalle del cliente (404 si no existe).
- `GET /customers/:id/simulations`: historial, de más reciente a más antigua (`created_at DESC, id DESC`). 404 si el cliente no existe.
- `GET /pricing/preview?users=N&country=ES`: cálculo sin guardar, para el slider (así la lógica de tramos vive solo en el backend). Respuesta: `{ activeUsers, baseCents, taxRate, taxCents, totalCents, currency }`.
- `GET /countries`: países soportados, `[{ "code": "ES", "taxRate": 0.21 }, …]`, ordenados por código.

Forma del cliente en las respuestas:

```json
{ "id": 1, "companyName": "Acme S.L.", "taxId": "B12345674", "contactEmail": "ops@acme.es",
  "country": "ES", "plan": "business", "createdAt": "2026-11-20T10:00:00Z" }
```

## 7. Frontend

### Vistas

1. **Dashboard y buscador** (`/`): campo de búsqueda con *debounce* y lista de clientes en tarjetas. Botón para crear cliente.
2. **Alta de cliente** (`/customers/new`): formulario con los errores de validación junto a cada campo. El país se elige de `GET /countries`. Tras crear el cliente, lleva a su detalle.
3. **Detalle del cliente** (`/customers/:id`): tarjetas responsive con sus datos y el historial de simulaciones (importes en la divisa seleccionada).
4. **Simulador interactivo**, dentro del detalle del cliente (usa su país para el impuesto): slider de usuarios de 0 a 200 con un campo numérico sincronizado que admite hasta 100 000 (si el valor pasa de 200, el slider se queda al máximo). Además, campos de almacenamiento y llamadas. Muestra base, impuesto y total en tiempo real, convertidos a la divisa elegida. Botón «Guardar simulación», que añade la simulación al historial sin recargar.

### Divisas

- Selector global de divisa: EUR, USD, GBP, CHF, JPY y MXN.
- Tipos de cambio de `https://open.er-api.com/v6/latest/EUR`, guardados en caché durante 1 hora en `localStorage` (con la memoria como respaldo si `localStorage` no está disponible).
- El historial se convierte con el tipo de cambio **actual**, no con el del día de la simulación. Se documenta en el README.
- **Estados obligatorios:** cargando, error con botón «Reintentar» y *fallback* a EUR si no hay tipos de cambio.
- Conversión: `importe_mostrado = céntimos / 100 × tipo`, formateado con `Intl.NumberFormat`.

### Calidad de interfaz

Diseño responsive (móvil primero), estados vacíos, mensajes de error de validación por campo y accesibilidad básica (etiquetas, foco).

## 8. Estructura de carpetas

```
/
├── ai-workspace/
│   ├── 00-enunciado/      transcripción del enunciado
│   ├── 01-specs/          spec.md, plan.md (plan de implementación)
│   ├── 02-arquitectura/   decisiones, esquema BD, directrices para la IA
│   └── 03-vibe-coding/    prompts clave, hilos y notas de revisión
├── backend/
│   ├── src/
│   │   ├── config/        tasas de impuestos, tramos de precio
│   │   ├── domain/        pricing.ts, taxId.ts (lógica pura, sin I/O)
│   │   ├── db/            conexión, migraciones
│   │   ├── repositories/  acceso a datos
│   │   ├── services/      orquestación de casos de uso (p. ej., crear simulación)
│   │   ├── http/          formato de errores y helper de validación Zod
│   │   ├── routes/        customers.ts, simulations.ts, pricing.ts, countries.ts
│   │   ├── app.ts
│   │   └── server.ts
│   └── tests/
├── frontend/
│   └── src/ (api/, components/, config/, features/, hooks/, utils/)
├── package.json           arranque conjunto (concurrently)
├── CLAUDE.md
└── README.md
```

## 9. Directrices para la IA

Resumen; el detalle está en `CLAUDE.md`.

- La lógica de negocio vive en `domain/` como funciones puras y testeables; las rutas solo validan, llaman y responden.
- Ningún fichero de más de ~200 líneas; una responsabilidad por módulo.
- TypeScript en modo `strict`, sin `any`.
- Dinero siempre en céntimos enteros; nada de `float` en cálculos.
- Consultas SQL parametrizadas, nunca concatenadas.
- Todo cambio en `domain/` va acompañado de tests.
- Antes de programar una feature, leer su spec en `ai-workspace/01-specs/`.

## 10. Plan de acción (orden de implementación)

El desglose en tareas, con criterios de aceptación y verificación, está en `plan.md`.

1. Estructura del repo, `CLAUDE.md` y esta spec. **(hecho)**
2. `domain/pricing.ts` con tests de tramos (tabla de la sección 3.1). **(hecho)**
3. `domain/taxId.ts` con tests de DNI, NIE y CIF. **(hecho)**
4. `package.json`, `tsconfig.json` y Vitest.
5. Base de datos y migraciones.
6. `POST /customers` y `POST /simulations` con sus validaciones.
7. Endpoints de lectura y `pricing/preview`.
8. Frontend: cliente de API, selector de divisa, dashboard, detalle y simulador.
9. Pulido, README y recopilación del material de `ai-workspace/03-vibe-coding/`.

## 11. Criterios de aceptación

- Todos los casos de la sección 3.1 pasan en los tests.
- Un DNI, NIE o CIF español con control incorrecto devuelve 422 con mensaje claro.
- Las simulaciones persisten y aparecen en el historial tras recargar.
- Cambiar la divisa actualiza todos los importes sin recargar la página.
- Si la API de divisas falla, la app sigue funcionando en EUR y muestra el aviso.
- El proyecto arranca en local con pocos comandos (`npm install` y `npm run dev` en backend y frontend, o una sola vez desde la raíz), con migración automática de la base de datos.

## 12. Decisiones cerradas (20/11/2026)

- Se confirman la tabla de impuestos de §3.2 y el límite de 100 000 usuarios.
- El almacenamiento y las llamadas a la API **no** se tarifican: el enunciado solo tarifica por usuarios. Se documenta en el README.
- El resto de decisiones tomadas al revisar el plan están en `plan.md` §1.4.
