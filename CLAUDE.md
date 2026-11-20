# SaaS-O-Matic: guía para el asistente de IA

Herramienta interna para registrar clientes corporativos, simular su consumo SaaS y presupuestar la suscripción mensual (tramos + impuestos + multi-divisa).

**Fuente de verdad:** `ai-workspace/01-specs/spec.md`. Antes de implementar cualquier feature, léela. Si algo no está en la spec o la contradice, **pregunta antes de decidir**.

## Stack

- Backend: Node.js 26 (`engines >=26`, `.nvmrc`), TypeScript (strict), Fastify, better-sqlite3, Zod, Vitest.
- Frontend: React + Vite + TypeScript, Vitest + Testing Library.
- Un solo gestor de paquetes: npm.

## Estructura (no la alteres sin avisar)

```
backend/src/
  config/        tasas de impuestos, variables de entorno
  domain/        lógica de negocio PURA: pricing.ts, taxId.ts (sin I/O)
  db/            conexión y migraciones
  repositories/  acceso a datos (único sitio con SQL de datos; el esquema vive en db/migrations/)
  services/      orquestación de casos de uso (repositorios + dominio)
  http/          formato de errores y helper de validación Zod
  routes/        customers.ts, simulations.ts, pricing.ts, countries.ts (solo HTTP)
  app.ts         composición de la app
  server.ts      arranque (entorno, BD, migraciones, listen)
backend/tests/
frontend/src/    api/, components/, config/, features/, hooks/, utils/ (tests junto a cada fichero)
frontend/e2e/    prueba de punta a punta contra el backend real (npm run test:e2e)
package.json     raíz: npm install / dev / test / build / test:e2e de los dos proyectos
ai-workspace/    specs, arquitectura y registro del proceso con IA
```

## Reglas de arquitectura

1. **Capas:** `routes` valida entrada (Zod), llama a `services`, `domain` o `repositories` y responde. Nada de lógica de negocio ni SQL en las rutas.
2. **`domain/` es puro:** funciones sin acceso a BD, red ni reloj. Deben poder testearse sin mocks.
3. **Dinero en céntimos enteros (EUR).** Prohibido usar `float` para calcular importes. La conversión a otra divisa solo ocurre en el frontend, al mostrar.
4. **SQL parametrizado** siempre. Nunca concatenar strings en consultas.
5. **Un fichero, una responsabilidad.** Máximo ~200 líneas por fichero; si crece, divídelo.
6. **Errores con formato único** (ver spec, sección 6). Códigos HTTP: 200, 201, 404, 409, 422 (también para JSON mal formado) y 500 sin detalles internos.
7. **Configuración, no constantes mágicas:** tasas de impuestos y precios por tramo viven en `config/`.

## Calidad de código

- TypeScript `strict`. Prohibido `any` y `@ts-ignore` salvo justificación en comentario.
- Nombres descriptivos en inglés para código; textos de interfaz en español.
- Sin código muerto, sin `console.log` olvidados, sin comentarios que repitan el código.
- Funciones cortas y con un solo propósito. Evita anidar más de 2 niveles.
- No añadas dependencias sin proponerlo antes y justificarlo.

## Tests (obligatorios)

- Todo cambio en `domain/` lleva tests en el mismo commit.
- `pricing`: cubrir 0, 1, 10, 11, 15, 50, 51 y 100 usuarios (tabla de la spec, sección 3.1).
- `taxId`: DNI, NIE y CIF válidos e inválidos, con minúsculas, espacios y guiones.
- Endpoints: casos felices y de error (422, 404, 409).
- Antes de dar una tarea por terminada: `npm test` y `npm run build` en verde (desde la raíz cubren los dos proyectos).
- `.npmrc` con `ignore-scripts=true` en backend y frontend: ninguna dependencia necesita scripts de instalación (better-sqlite3 trae binarios precompilados). No lo quites sin comprobar una instalación limpia.

## Frontend

- Estados obligatorios al consumir la API de divisas: cargando, error con reintento, y *fallback* a EUR.
- Responsive y móvil primero. Etiquetas y foco accesibles en formularios.
- La lógica de tramos **no se duplica** en el frontend: usa `GET /pricing/preview`.
- Formato de importes con `Intl.NumberFormat`.

## Forma de trabajar

1. Para cada feature: resume qué vas a hacer y qué ficheros tocarás **antes** de escribir código.
2. Cambios pequeños y revisables; no reescribas ficheros enteros si basta con editar.
3. Al terminar, explica brevemente qué hiciste y qué decisiones tomaste, para anotarlo en `ai-workspace/03-vibe-coding/`.
4. Si detectas un fallo o deuda técnica en código previo, avísalo en vez de ocultarlo.
