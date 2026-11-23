# Prompts clave

Selección de los prompts con los que el desarrollador guió al asistente (Claude Code) en cada fase del proyecto. Están **transcritos literalmente**, con su redacción original, y en orden cronológico. Lo que hizo la IA con cada uno está en [notas.md](notas.md).

Las reglas permanentes que el asistente cargaba en cada sesión no se repiten aquí: están en [CLAUDE.md](../../CLAUDE.md) y en las skills de [.claude/skills/](../../.claude/skills/).

## 1. Arranque: plan antes de código

El prompt que abrió el proyecto. Pide un plan de tareas con criterios de aceptación, prohíbe implementar todavía y obliga a señalar las ambigüedades en lugar de decidirlas.

```text
Lee CLAUDE.md, ai-workspace/01-specs/enunciado.md y ai-workspace/01-specs/spec.md.

Contexto: el dominio (backend/src/domain/pricing.ts y taxId.ts, con su configuración en backend/src/config/ y sus tests en backend/tests/) ya está hecho y revisado. La estructura de carpetas ya existe.

Antes de escribir código, proponme un plan de tareas pequeñas y ordenadas para el resto del proyecto:
1. Backend: package.json, tsconfig, Vitest, base de datos SQLite con migraciones, repositorios, endpoints (POST /customers, POST /simulations, GET /customers, GET /customers/:id, GET /customers/:id/simulations, GET /pricing/preview) y sus validaciones.
2. Frontend: React + Vite + TypeScript, cliente de API, selector de divisa con la API de tipos de cambio, dashboard con buscador, detalle de cliente y simulador con slider.
3. README con arranque en pocos pasos.

Para cada tarea indica: objetivo, ficheros que se crearán o tocarán, criterio de aceptación y cómo se verifica (tests o comprobación manual).

Si algo del enunciado o de la spec es ambiguo o se contradice, dímelo en vez de decidir tú.

No implementes nada todavía. Guarda el plan en ai-workspace/01-specs/plan.md y espera a que yo lo revise.
```

Resultado: [plan.md](../01-specs/plan.md), con 8 contradicciones y 15 huecos de la spec señalados para decidir.

## 2. Resolver todas las dudas antes de programar

```text
vamos con el plan, vamos a decidir todas las dudas
```

Resultado: tres rondas de preguntas, una tabla de decisiones en el plan y la spec v2.

## 3. Ciclo de cada tarea

Una vez fijado el método (registrar, revisar, commit), cada tarea se lanzaba con prompts cortos que encadenaban el ciclo completo:

```text
registra la sesión y luego empieza con B1
```

```text
sí, aplícalo, nota, commit, push y sigue con F3
```

## 4. Decidir sobre lo que encuentra la revisión

Tras cada `/revisar`, el desarrollador elegía qué hallazgos se corregían y cómo:

```text
sí, aplica la 1 y la 2, nota, commit y push
```

```text
sí, corrige 1 y 2, documenta el índice y reformula el resumen
```

## 5. Ampliar el alcance de forma controlada

Cuando la revisión de F9 propuso convertir una prueba temporal en permanente y añadir una comprobación automática de accesibilidad, que implicaba una dependencia nueva:

```text
sí a las dos, nota, commit, push y sigue con R1
```

## 6. Revisión en el navegador

La IA no tenía navegador. Estos prompts, escritos al usar la app, detectaron problemas que los tests no veían:

```text
en el combo de almacenamiento no seria optimo subir de 1 en 1 y no de 0.01?
```

```text
vale no lo veo mal, quiza algunas cosas esteticas pero bien, no veo capacidad para eliminar una empresa si quiero
```

```text
venga no lo añadimos
```

```text
los enlaces no me gusta verlos asi, si queremos hacer algo bonito cambiaria un poco el diseño
```

```text
esa flecha de la derecha es fea
```

```text
no veo muy intuitivo la barra de usuarios activos, y las flechas de los inputs se ven como la flecha del desplegable de antes
```

```text
esos recuadreos aparecen en todos los sitios, no me gustan
```

Resultado: el paso del almacenamiento, el rediseño del deslizador, los botones −/+, los estados de los botones y el foco con halo. El borrado de clientes se descartó por estar fuera de alcance en la spec.

## 7. Comprobación final contra el enunciado

```text
vale ahora con esto terminado, quiero que revises el enunciado y comparemos con los resultados que tenemos para ver si nos hemos dejado nada o si estamos cumpliendo exactamente con lo que piden
```

Resultado: todos los requisitos cubiertos, una cifra desfasada corregida y este fichero.
