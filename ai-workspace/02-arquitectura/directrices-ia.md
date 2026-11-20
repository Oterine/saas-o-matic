# Directrices para la IA y configuración del entorno

Cómo se configuró el asistente (Claude Code) para que el código siguiera patrones limpios y modulares, y cómo evolucionaron esas reglas durante el proyecto.

> **Las reglas vigentes están en [CLAUDE.md](../../CLAUDE.md).** Este documento empezó siendo una copia, pero la copia se desfasó en cuanto las reglas cambiaron. Ahora explica el sistema y su evolución, y remite a CLAUDE.md como única versión viva.

## Piezas del entorno

| Pieza | Qué hace |
|---|---|
| [CLAUDE.md](../../CLAUDE.md) | Reglas que el asistente carga en cada sesión: stack, estructura, capas, dinero en céntimos, SQL parametrizado, ficheros de ~200 líneas como máximo, tests obligatorios, accesibilidad y forma de trabajar. |
| [spec.md](../01-specs/spec.md) | Fuente de verdad funcional. CLAUDE.md obliga a leerla antes de cada tarea y a **preguntar** si algo no está o la contradice. |
| [plan.md](../01-specs/plan.md) | Tareas con objetivo, ficheros, criterio de aceptación y verificación, más la definición de terminado común. |
| [/revisar](../../.claude/skills/revisar/SKILL.md) | Skill que audita los cambios contra CLAUDE.md y la spec, ejecuta tests y build, y devuelve problemas por gravedad **sin modificar nada**. |
| [/registrar-sesion](../../.claude/skills/registrar-sesion/SKILL.md) | Skill que añade la nota de cada tarea a `03-vibe-coding/notas.md`. Prohíbe inventar correcciones: si no las conoce, pregunta. |
| [.claude/settings.json](../../.claude/settings.json) | Permisos del asistente: reglas para permitir test, build y git y para denegar la lectura de `.env`. **Limitación conocida:** las reglas están escritas para Bash (`Bash(npm test:*)`…), pero en este entorno Windows los comandos se ejecutaron con PowerShell, y no se ha verificado que se apliquen. Además, `Bash(npm install)` es anterior al `npm ci` que usa ahora la raíz. Pendiente de revisar. |

## Ciclo de cada tarea

1. El asistente **resume qué va a hacer y qué ficheros tocará** antes de escribir código (CLAUDE.md, "Forma de trabajar").
2. Implementa en cambios pequeños, con tests.
3. Ejecuta `npm test` y `npm run build`.
4. Pasa **`/revisar`**. Los problemas se clasifican como bloqueante, importante o menor, y el desarrollador decide cuáles se corrigen.
5. **`/registrar-sesion`** anota lo pedido, lo hecho, las decisiones, las correcciones del desarrollador y los problemas detectados.
6. Un commit por tarea y `push`.

Ante cualquier hueco de la spec, el asistente pregunta en lugar de decidir. Así se resolvieron las ~30 dudas iniciales del plan y otras que surgieron después, como el orden del listado de clientes o la versión de Node.

## Evolución de las reglas

Las reglas no se escribieron una sola vez: se ajustaron cuando la práctica mostró un hueco.

| Cambio en CLAUDE.md | Por qué | Tarea |
|---|---|---|
| Node 20 → **Node 26** | Node 20 ya no tiene soporte; el desarrollador eligió la versión instalada. | B1 |
| "único sitio con SQL" → **"único sitio con SQL de datos; el esquema vive en `db/migrations/`"** | La regla, leída al pie de la letra, prohibía las migraciones. Se corrigió también en `/revisar`. | B3 |
| Nuevas carpetas **`services/`, `http/`** (backend) y **`config/`** (frontend) | Aprobadas al resolver las dudas del plan, para no meter orquestación ni formato de errores en las rutas. | Plan |
| Códigos HTTP **200 y 500** añadidos a 201/404/409/422; **JSON mal formado → 422** | La lista original no cubría las lecturas ni los errores inesperados. | Plan, B6 |
| Estructura con **`frontend/e2e/`** y `package.json` en la raíz | La prueba de punta a punta pasó a ser permanente. | R1 |
| **`.npmrc` con `ignore-scripts=true`** y la advertencia de no quitarlo sin una instalación limpia | Una instalación limpia intentaba compilar `better-sqlite3`. | R1 |

## Qué funcionó para evitar código desorganizado

- **Reglas concretas y comprobables** ("máximo ~200 líneas", "SQL solo en `repositories/`", "dinero en céntimos"): `/revisar` las verifica una por una. Así se detectó `index.css` con 411 líneas en F8.
- **Revisar antes de cada commit, no al final:** cada problema se corrigió en su tarea, con su test, en lugar de acumularse.
- **Pedir pruebas de cada afirmación:** los fallos más importantes se encontraron ejecutando cosas, no leyendo el código:
  - las tildes en SQLite;
  - el contraste de los bordes;
  - la instalación limpia.

  El resumen está en [03-vibe-coding/README.md](../03-vibe-coding/README.md).
