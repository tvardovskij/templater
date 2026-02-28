# Template DSL

El Template DSL define cómo se crean las plantillas en Templater.

Una plantilla no es solo una carpeta.  
Es una **definición tipada y versionada de la estructura y el comportamiento del proyecto**.

Este documento describe:

- La API `defineTemplate`
- Los campos de configuración admitidos
- Los hooks del ciclo de vida
- El comportamiento de renderizado
- Restricciones y garantías
- Buenas prácticas
- Política de estabilidad

---

## Resumen

Una plantilla debe exportar una configuración por defecto usando `defineTemplate`:

```ts
import { defineTemplate } from "@templater/core";

export default defineTemplate({
  name: "landing-basic",
  version: "1.0.0"
});
````

El objeto de configuración define metadatos, preguntas, fuentes de archivos y hooks del ciclo de vida.

---

## Estructura básica

Ejemplo mínimo:

```ts
export default defineTemplate({
  name: "my-template",
  version: "1.0.0",

  questions: [],

  files: {
    source: "files"
  }
});
```

Un directorio de plantilla válido debe contener:

* `templater.config.ts`
* un directorio de fuentes (por defecto: `files/`)

---

## Campos obligatorios

### `name: string`

Identificador de la plantilla.

Debe:

* ser único dentro de su contexto de distribución
* contener solo caracteres seguros para URLs
* permanecer estable entre versiones

---

### `version: string`

Versión de la plantilla.

Debe seguir el versionado semántico (`MAJOR.MINOR.PATCH`).

Templater aún no aplica resolución de versiones, pero los metadatos de versión son obligatorios.

---

## Preguntas

Las preguntas definen la entrada del usuario necesaria durante la generación.

Ejemplo:

```ts
questions: [
  {
    type: "input",
    name: "projectName",
    message: "Nombre del proyecto",
    default: "my-app"
  },
  {
    type: "select",
    name: "css",
    message: "Solución CSS",
    options: ["scss", "tailwind"]
  },
  {
    type: "confirm",
    name: "analytics",
    message: "¿Incluir analítica?",
    default: false
  }
]
```

---

### Tipos admitidos (v0.x)

* `input`
* `select`
* `confirm`

Cada pregunta debe definir:

* `type`
* `name`
* `message`

Opcional:

* `default`
* `validate(value) => boolean | string`

La CLI y la extensión son responsables de presentar estas preguntas.

El core solo consume las respuestas resueltas.

---

## Configuración de archivos

El campo `files` define el directorio fuente de la plantilla.

```ts
files: {
  source: "files",
  include?: string[],
  exclude?: string[]
}
```

### `source`

Ruta relativa a la raíz de la plantilla.

Por defecto `"files"` si se omite.

---

### `include` / `exclude`

Patrones glob que controlan qué archivos se procesan.

Si se omiten:

* todos los archivos bajo `source` se consideran

---

## Reglas de renderizado

Templater renderiza archivos de texto usando un motor de plantillas (actualmente Handlebars).

Sintaxis admitida:

### Variables

```html
<title>{{projectName}}</title>
```

### Condicionales

```html
{{#if analytics}}
<script src="analytics.js"></script>
{{/if}}
```

---

## Archivos binarios

Los archivos binarios se detectan automáticamente y se copian sin renderizar.

Esto garantiza que:

* imágenes
* fuentes
* recursos multimedia

se conserven de forma segura.

---

## Hooks del ciclo de vida

Las plantillas pueden definir hooks del ciclo de vida:

```ts
hooks: {
  beforeGenerate(ctx) {},
  afterGenerate(ctx) {}
}
```

Los hooks son opcionales.

---

### Modelo de ejecución de hooks

Los hooks se ejecutan dentro de un `TemplateContext` restringido.

Conceptualmente:

```ts
interface TemplateContext {
  vars: Record<string, any>;
  log(message: string): void;
  write(path: string, content: string): Promise<void>;
  remove(path: string): Promise<void>;
  exec(command: string): Promise<void>;
}
```

Importante:

* Los hooks no deben asumir acceso directo al sistema de archivos.
* Todas las operaciones de escritura están limitadas al directorio de destino.
* `exec` puede estar deshabilitado en modo seguro.

Los hooks deben ser deterministas e idempotentes.

---

## Generación de metadatos

Después de la generación, Templater crea:

```
.templater/meta.json
```

Contiene:

* nombre de la plantilla
* versión de la plantilla
* marca de tiempo de generación

Las plantillas no deben sobrescribir este archivo.

---

## Determinismo

Las plantillas deben ser deterministas.

Dados:

* la misma versión de plantilla
* las mismas entradas
* la misma política de escritura

La salida debe ser idéntica.

Las plantillas que dependen de:

* aleatoriedad
* APIs externas
* valores basados en tiempo

están fuertemente desaconsejadas.

---

## Política de estabilidad

El Template DSL evolucionará con cuidado.

Reglas:

* Los cambios que rompen compatibilidad requieren incrementos de versión mayor.
* Los campos deprecados seguirán soportados durante 0.x con advertencias.
* Se requiere estabilidad del DSL antes de `1.0.0`.

---

## Buenas prácticas

### 1. Mantén las plantillas mínimas

Evita embeber:

* node_modules completos
* artefactos generados grandes

---

### 2. Evita efectos secundarios en la configuración

`templater.config.ts` no debe:

* ejecutar comandos en tiempo de importación
* mutar estado global

---

### 3. Prefiere explícito sobre implícito

Evita adivinar el comportamiento dentro de los hooks.

---

### 4. Versiona intencionalmente

Si la salida de la plantilla cambia:

* incrementa la versión
* documenta los cambios

---

### 5. Mantén las preguntas enfocadas

Evita configuración excesiva.  
Las plantillas deben guiar, no abrumar.

---

## Anti-patrones

Evita:

* Importaciones dinámicas basadas en respuestas en tiempo de ejecución
* Escribir fuera del directorio de destino
* Usar hooks como generadores completos de proyectos
* Sobrecargar plantillas con comportamiento específico del entorno

Templater es un motor de scaffolding — no una herramienta de despliegue.

---

## Extensiones futuras (planificado)

Aún no implementado pero soportado arquitectónicamente:

* Feature packs (`templater apply`)
* Composición de plantillas (`extends`)
* Árboles de archivos condicionales
* Integración de metadatos del registro

---

## Resumen

El Template DSL existe para equilibrar:

* poder
* seguridad
* predictibilidad
* experiencia del desarrollador

Las plantillas deben sentirse estructuradas, no mágicas.

Templater está diseñado para escalar desde pequeños proyectos de landing hasta ecosistemas estructurados — sin sacrificar claridad.
