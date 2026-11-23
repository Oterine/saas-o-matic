# Proceso de desarrollo con IA

Resumen de cómo se construyó SaaS-O-Matic con Claude Code. El detalle de cada tarea (qué se pidió, qué se hizo, decisiones, correcciones del desarrollador y problemas) está en **[notas.md](notas.md)**. Los prompts clave del desarrollador, transcritos literalmente, están en **[prompts.md](prompts.md)**. Cómo se configuró el asistente se explica en [02-arquitectura/directrices-ia.md](../02-arquitectura/directrices-ia.md).

## Cifras

| | |
|---|---|
| Tareas del plan | 24: B1–B11 y B10b (backend), F1–F9 (frontend), R1 (arranque), D1–D2 (documentación) |
| Commits | Uno por tarea, más el inicial (spec, plan y dominio) |
| Tests | 194 backend + 118 frontend + 1 de punta a punta |
| Dudas de la spec resueltas antes de programar | ~30 (contradicciones C1–C8 y huecos A1–A15 del [plan](../01-specs/plan.md)) |

## Cómo se trabajó

1. **Especificar antes de programar.** La IA leyó la spec y el enunciado y propuso un plan, señalando las contradicciones y los huecos **en lugar de decidirlos**. Por ejemplo: `tax_rate REAL` contra la regla de "nada de float"; fechas sin formato ISO; el límite de usuarios del deslizador. El desarrollador decidió cada punto y la spec pasó a la v2 antes de escribir código.
2. **Una tarea cada vez,** con un resumen previo, tests, `/revisar`, una nota y un commit (ver el ciclo en [directrices-ia.md](../02-arquitectura/directrices-ia.md)).
3. **Preguntar ante lo no especificado,** también durante la implementación: el orden del listado de clientes, la versión de Node, la identidad de git, añadir `axe-core` o hacer permanente la prueba de punta a punta.

## Problemas detectados y cómo se resolvieron

### Fallos que habrían llegado al usuario

| Problema | Cómo se detectó | Solución | Tarea |
|---|---|---|---|
| La búsqueda no encontraba `ÑANDÚ` al buscar `ñandú`, y `Álvarez` se ordenaba detrás de `zeta` | `/revisar`, comprobado ejecutando consultas en SQLite | Función SQL `fold()` (minúsculas y sin tildes) | B4 |
| Cualquier error 4xx de Fastify decía "JSON no válido", incluso con un cuerpo de 1 MB válido | `/revisar`, comprobado ejecutándolo | Mensaje según la causa real, manteniendo el 422 | B6 |
| `customerId` gigante → "no puede superar 9.007.199.254.740.991" | `/revisar` | Entero positivo con mensaje propio | B8 |
| El foco saltaba a otro campo mientras el usuario corregía un error | Relectura de la IA antes de probar | Foco solo tras un envío rechazado (con test) | F6 |
| El error del país no se veía si la lista de países no cargaba | `/revisar` | El campo se pinta siempre | F6 |
| Tras un 404, el título de la pestaña volvía a "Detalle del cliente" | Relectura de la IA antes de probar | El título lo decide un solo componente | F7 |
| Con usuarios no válidos se seguía mostrando el total anterior | Relectura de la IA | El resumen se oculta si hay error | F8 |
| **Bordes de los campos con contraste de 1,36:1** (WCAG pide 3:1) | Cálculo del contraste de toda la paleta | Variable propia: 3,84:1 (tema claro) y 3,87:1 (oscuro) | F9 |
| **`npm install` desde un clon limpio fallaba:** intentaba compilar `better-sqlite3` | Simulación de un clon limpio | `.npmrc` con `ignore-scripts=true` (el paquete trae binarios precompilados) | R1 |

### Errores de la IA en su propio código o en sus tests

| Error | Corrección | Tarea |
|---|---|---|
| Manejador de 404 enrevesado (construía un 500 y lo sobrescribía) | Simplificado al releer | B6 |
| Test que calculaba el resultado esperado con la misma fórmula que el código | Valores escritos a mano | B10 |
| Un test pasaba a `useAsync` una función nueva en cada render: bucle infinito y Vitest sin memoria | Firma `useAsync(load, key)`, que no puede entrar en bucle (con test) | F5 |
| Conversiones de tipo que engañaban al compilador (`as unknown as number`, `undefined as number`) | Tipos que describen lo que de verdad se envía | F8 |
| `index.css` llegó a 411 líneas (el máximo es ~200) | Dividido en seis hojas por componente | F8 |
| Carpeta `src/test/` contra la convención fijada por la propia IA; comentario `eslint-disable` sin ESLint en el proyecto | Retirados | F4, F6 |
| Test de accesibilidad que prometía revisar los errores del formulario y no los provocaba | Ahora los provoca | F9 |
| `directrices-ia.md` era una copia de CLAUDE.md y se desfasó | Reescrito para remitir a CLAUDE.md | D2 |

### Investigado antes de cambiar nada (falsas alarmas)

- **Aviso `node-gyp rebuild` de `better-sqlite3` (B1):** se comprobó que el paquete trae binarios N-API precompilados y que funciona sin compilar. El mismo análisis permitió resolver el fallo de R1.
- **"La búsqueda no encuentra Álvarez" (B11):** era el script de prueba, guardado sin BOM, que PowerShell 5.1 leía como ANSI. Se confirmó repitiendo la prueba con escapes JSON y comparando bytes UTF-8, y el aviso se añadió al README.

## El papel del desarrollador

Lo que hizo el desarrollador, separado de lo que propuso la IA. Todo consta en [notas.md](notas.md) o en el historial de git.

### Trabajo previo, antes de la primera sesión con el asistente

- **Spec v1** ([spec.md](../01-specs/spec.md)): reglas de negocio, tasas, validación de DNI/NIE/CIF, modelo de datos, contratos de la API y criterios de aceptación.
- **[CLAUDE.md](../../CLAUDE.md):** capas, dinero en céntimos, SQL parametrizado, ficheros de ~200 líneas, tests obligatorios y la regla de **preguntar antes de decidir** lo que no está en la spec.
- **El dominio con sus tests:** `pricing.ts` (tramos) y `taxId.ts` (algoritmos oficiales), y la estructura de carpetas.
- **Las skills [/revisar](../../.claude/skills/revisar/SKILL.md) y [/registrar-sesion](../../.claude/skills/registrar-sesion/SKILL.md)**, que fijaron el ciclo de revisión y registro de cada tarea. La segunda prohíbe a la IA inventar correcciones.
- **El prompt de arranque** ([prompts.md](prompts.md)): plan antes que código, sin implementar nada y con las ambigüedades señaladas en lugar de decididas.

### Iniciativas propias durante el desarrollo

- **Node 26**, en lugar de la opción Node ≥ 22 que proponía la IA (B1).
- **Revisión visual de la app en el navegador**, que encontró lo que ningún test había detectado:
  - el paso de 0,01 en el almacenamiento;
  - el deslizador deformado;
  - las flechas nativas de desplegables y campos numéricos;
  - el aspecto de los enlaces, los botones y los recuadros de foco.
- **Botones −/+ propios** para los campos numéricos, frente a la opción más barata que recomendaba la IA (ocultar las flechas).
- **El borrado de clientes:** lo propuso al usar la app, lo contrastó con la spec y **decidió no ampliar el alcance** a dos días de la entrega.
- **Adaptar los permisos del asistente a PowerShell**, que estaba pendiente desde B1.
- **Comprobar el resultado contra el enunciado** punto por punto antes de cerrar, lo que añadió [prompts.md](prompts.md) y corrigió una cifra desfasada.

### Decisiones sobre las propuestas de la IA

- **Revisó y resolvió las ~30 dudas del plan** (C1–C8 y A1–A15). En todas eligió la opción propuesta, y con eso se cerró la spec v2 antes de escribir código.
- **Aprobó o rechazó cada dependencia nueva:** `react-router-dom`, `concurrently`, Testing Library y `axe-core`.
- **Tras cada `/revisar`, eligió qué hallazgos se corregían y cómo.** Por ejemplo: documentar el índice sin uso en lugar de quitarlo con una migración, y dejar «Llamadas a la API» de 1 en 1.
- **Decidió el orden alfabético del listado,** que la spec no fijaba.
- **No publicar el `.docx` original** del enunciado en un repositorio público.

## Reflexión del desarrollador

En sus propias palabras, al cerrar el proyecto (23/11/2026).

**¿Por qué preparar la spec, CLAUDE.md y el dominio antes de dejar trabajar a la IA?**
Quería evitar que la IA decidiera cosas sin preguntarme y, sobre todo, empezar con una buena base para que el plan se formase lo más completo posible.

**¿Hubo momentos de desconfianza?**
No desconfié de la IA porque había preparado controles para no tener que hacerlo: la regla de preguntar antes de decidir, la revisión con `/revisar`, los tests y el build en verde en cada tarea, y el registro de cada paso. Aun así, al revisar yo mismo la app en el navegador vi que los tests no lo detectan todo.

**¿Con qué criterio se decidía qué hallazgos de la revisión corregir?**
Priorizaba lo que afectaba a la spec o al usuario. Las mejoras internas pequeñas las aplicaba cuando requerían poco esfuerzo, y lo que no compensaba lo dejaba documentado en lugar de cambiarlo, como el índice sin uso del modelo de datos.

**¿Qué aportó la IA y qué no podía aportar?**
La IA aportó velocidad y revisión, pero no podía ver la app.

**¿Qué haría distinto la próxima vez?**
Empezaría antes la revisión visual en el navegador.
