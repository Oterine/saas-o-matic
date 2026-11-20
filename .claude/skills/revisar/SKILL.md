---
name: revisar
description: Audita los cambios recientes del proyecto contra CLAUDE.md y la spec, y devuelve una lista de problemas sin modificar nada. Úsala al terminar una tarea o antes de un commit.
---

# Revisión de calidad

Revisa los cambios sin commitear (o el último commit si no hay cambios pendientes) con `git diff` y `git status`. **No modifiques ningún fichero**: solo informa.

## Qué comprobar

1. **Contra `CLAUDE.md`**
   - Capas respetadas: las rutas solo validan y responden; no hay lógica de negocio fuera de `domain/` ni SQL de datos fuera de `repositories/` (el esquema vive en `db/migrations/`).
   - `domain/` sigue siendo puro (sin acceso a BD, red ni reloj).
   - Dinero en céntimos enteros, sin `float` en cálculos.
   - SQL parametrizado.
   - Sin `any`, sin `@ts-ignore` injustificados, sin `console.log` olvidados ni código muerto.
   - Ficheros de menos de ~200 líneas y con una sola responsabilidad.
   - No se han añadido dependencias sin justificar.

2. **Contra `ai-workspace/01-specs/spec.md`**
   - Rutas, cuerpos de petición/respuesta y códigos de error (201, 404, 409, 422) como indica la sección 6.
   - Reglas de negocio de la sección 3 y validaciones de la sección 4.
   - Modelo de datos de la sección 5.

3. **Tests**
   - Todo cambio en `domain/` tiene tests.
   - Los casos límite están cubiertos (0, 10, 11, 50, 51 usuarios; DNI/NIE/CIF válidos e inválidos; errores 404/409/422).
   - Ejecuta `npm test` y `npm run build` en `backend/` (y en `frontend/` si hay cambios allí) e indica el resultado real.

4. **Seguridad y robustez**
   - Entradas validadas antes de usarse.
   - No hay secretos ni rutas locales en el código.
   - Los errores no filtran información interna.

## Formato de respuesta

Devuelve una lista ordenada por gravedad:

- **Bloqueante**: incumple la spec, rompe tests o introduce un fallo.
- **Importante**: deuda técnica o desviación de `CLAUDE.md`.
- **Menor**: estilo o mejoras opcionales.

Para cada punto indica el fichero y la línea, qué pasa y cómo corregirlo. Si no encuentras problemas en una categoría, dilo explícitamente. Termina con un veredicto: **aprobado** o **requiere cambios**.
