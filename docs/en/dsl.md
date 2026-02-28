# Template DSL

The Template DSL defines how templates are authored in Templater.

A template is not just a folder.  
It is a **typed, versioned definition of project structure and behavior**.

This document describes:

- The `defineTemplate` API
- Supported configuration fields
- Lifecycle hooks
- Rendering behavior
- Constraints and guarantees
- Best practices
- Stability policy

---

## Overview

A template must export a default configuration using `defineTemplate`:

```ts
import { defineTemplate } from "@templater/core";

export default defineTemplate({
  name: "landing-basic",
  version: "1.0.0"
});
````

The configuration object defines metadata, questions, file sources, and lifecycle hooks.

---

## Basic Structure

Minimal example:

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

A valid template directory must contain:

* `templater.config.ts`
* a source directory (default: `files/`)

---

## Required Fields

### `name: string`

Template identifier.

Must:

* be unique within its distribution context
* contain only URL-safe characters
* remain stable across versions

---

### `version: string`

Template version.

Must follow semantic versioning (`MAJOR.MINOR.PATCH`).

Templater does not enforce version resolution yet, but version metadata is required.

---

## Questions

Questions define user input required during generation.

Example:

```ts
questions: [
  {
    type: "input",
    name: "projectName",
    message: "Project name",
    default: "my-app"
  },
  {
    type: "select",
    name: "css",
    message: "CSS solution",
    options: ["scss", "tailwind"]
  },
  {
    type: "confirm",
    name: "analytics",
    message: "Include analytics?",
    default: false
  }
]
```

---

### Supported Types (v0.x)

* `input`
* `select`
* `confirm`

Each question must define:

* `type`
* `name`
* `message`

Optional:

* `default`
* `validate(value) => boolean | string`

The CLI and extension are responsible for presenting these questions.

The core only consumes resolved answers.

---

## Files Configuration

The `files` field defines the template source directory.

```ts
files: {
  source: "files",
  include?: string[],
  exclude?: string[]
}
```

### `source`

Path relative to template root.

Defaults to `"files"` if omitted.

---

### `include` / `exclude`

Glob patterns controlling which files are processed.

If omitted:

* all files under `source` are considered

---

## Rendering Rules

Templater renders text files using a templating engine (currently Handlebars).

Supported syntax:

### Variables

```html
<title>{{projectName}}</title>
```

### Conditionals

```html
{{#if analytics}}
<script src="analytics.js"></script>
{{/if}}
```

---

## Binary Files

Binary files are automatically detected and copied without rendering.

This ensures:

* images
* fonts
* media assets

are preserved safely.

---

## Lifecycle Hooks

Templates may define lifecycle hooks:

```ts
hooks: {
  beforeGenerate(ctx) {},
  afterGenerate(ctx) {}
}
```

Hooks are optional.

---

### Hook Execution Model

Hooks run inside a restricted `TemplateContext`.

Conceptually:

```ts
interface TemplateContext {
  vars: Record<string, any>;
  log(message: string): void;
  write(path: string, content: string): Promise<void>;
  remove(path: string): Promise<void>;
  exec(command: string): Promise<void>;
}
```

Important:

* Hooks must not assume direct filesystem access.
* All write operations are sandboxed to the target directory.
* `exec` may be disabled in safe mode.

Hooks must be deterministic and idempotent.

---

## Metadata Generation

After generation, Templater creates:

```
.templater/meta.json
```

This contains:

* template name
* template version
* generation timestamp

Templates must not override this file.

---

## Determinism

Templates must be deterministic.

Given:

* same template version
* same inputs
* same write policy

The output must be identical.

Templates that rely on:

* randomness
* external APIs
* time-based values

are strongly discouraged.

---

## Stability Policy

The Template DSL will evolve carefully.

Rules:

* Breaking changes require major version increments.
* Deprecated fields will remain supported during 0.x with warnings.
* DSL stability is required before `1.0.0`.

---

## Best Practices

### 1. Keep templates minimal

Avoid embedding:

* entire node_modules
* large generated artifacts

---

### 2. Avoid side effects in config

`templater.config.ts` must not:

* execute commands at import time
* mutate global state

---

### 3. Prefer explicit over implicit

Avoid guessing behavior inside hooks.

---

### 4. Version intentionally

If template output changes:

* bump version
* document changes

---

### 5. Keep questions focused

Avoid excessive configuration.
Templates should guide, not overwhelm.

---

## Anti-Patterns

Avoid:

* Dynamic imports based on runtime answers
* Writing outside the target directory
* Using hooks as full project generators
* Overloading templates with environment-specific behavior

Templater is a scaffolding engine — not a deployment tool.

---

## Future Extensions (Planned)

Not yet implemented but architecturally supported:

* Feature packs (`templater apply`)
* Template composition (`extends`)
* Conditional file trees
* Registry metadata integration

---

## Summary

The Template DSL exists to balance:

* power
* safety
* predictability
* developer experience

Templates should feel structured, not magical.

Templater is designed to scale from small landing projects to structured ecosystems — without sacrificing clarity.