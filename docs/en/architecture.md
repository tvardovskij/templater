# Architecture

Templater is a composable project scaffolding system built around a simple idea:

> A template is not a folder copy.  
> It is a versioned, typed, executable artifact.

Templater consists of three independent layers:
- a core engine,
- a CLI,
- and a VS Code extension.

The system is CLI-first. The extension is a UX layer — not the engine.

---

## Philosophy

Templater is built around a few non-negotiable principles:

- **Deterministic generation** — same inputs must produce the same output.
- **Safety by default** — no destructive behavior unless explicitly allowed.
- **Separation of concerns** — UI layers never contain generation logic.
- **Typed configuration** — templates are defined as code, not loose JSON.
- **Portability** — templates must be shareable via Git or npm.
- **Minimal magic** — explicit over implicit.

Templater is infrastructure. Infrastructure must be predictable.

---

## High-Level Architecture

Templater is split into three packages:

### 1. `@templater/core`

The engine.

Responsibilities:
- template loading
- config validation
- rendering
- file planning
- write policies
- controlled hook execution
- metadata generation

No UI. No prompts. No networking.

---

### 2. `templater` (CLI)

The command-line interface.

Responsibilities:
- user prompts
- template installation
- cache management
- execution orchestration
- formatted output

The CLI depends on `@templater/core`.

---

### 3. `templater-extension`

The VS Code extension.

Responsibilities:
- command palette integration
- QuickPick UI
- progress notifications
- invoking core logic (directly or via CLI)

The extension contains zero generation logic.

---

## Monorepo Structure

Templater uses a pnpm workspace.

```

templater/
packages/
core/
cli/
extension/
examples/
docs/
.github/

```

This keeps:
- shared types centralized,
- versioning unified,
- development consistent.

---

## Core Engine Design

The core is responsible for deterministic generation.

### Generation Flow

1. Load template directory
2. Parse and validate `templater.config.ts`
3. Resolve question schema
4. Receive answers from caller (CLI/extension)
5. Build template context
6. Create generation plan (in memory)
7. Apply filesystem policy
8. Execute lifecycle hooks
9. Write `.templater/meta.json`

The core never asks questions.  
It receives resolved input.

---

## Templates

A template is a directory containing:

- `templater.config.ts`
- a source files directory (usually `files/`)

Templates are defined as code for:
- type safety
- hooks support
- future extensibility

They must remain:
- self-contained
- side-effect free at import time
- predictable

---

## Rendering

Templater uses a rendering engine (initially Handlebars).

Supported features:
- variables
- conditionals
- simple helpers

Binary files are detected and copied without transformation.

Rendering is applied deterministically and never mutates source templates.

---

## Write Policies

Templater never overwrites silently.

Supported policies:
- `fail`
- `skip`
- `overwrite`
- `prompt` (UI-handled)

The core computes a file plan before writing.

---

## Template Context

Templates may define lifecycle hooks:

- `beforeGenerate`
- `afterGenerate`

Hooks execute within a restricted context API.

The context:
- exposes resolved variables
- allows controlled writes
- optionally allows command execution
- prevents uncontrolled filesystem access

Security and reproducibility are prioritized over flexibility.

---

## Project Metadata

Generated projects contain origin metadata:

```
.templater/meta.json
````

Example:

```json
{
  "template": "landing-basic",
  "version": "1.0.0",
  "generatedAt": "2026-02-28T12:00:00Z"
}
````

This enables:

* future update mechanisms
* provenance tracking
* debugging

---

## Template Distribution

Templater supports multiple distribution models:

### Local templates

Path-based generation.

### Git-based templates

Installed and cached locally.

### npm-based templates

Versioned and reproducible.

Future: hosted registry.

---

## Storage

Templater uses a local user directory:

* macOS/Linux: `~/.templater`
* Windows: `%USERPROFILE%\.templater`

Structure:

```
templates/
cache/
config.json
```

The CLI manages storage.

---

## Error Handling

Errors are:

* typed
* explicit
* actionable

The core never prints directly to stdout.
It returns structured results.

UI layers format output.

---

## Testing Strategy

Core:

* unit tests for rendering and planning
* integration tests with example templates
* snapshot testing for deterministic output

CLI:

* command-level smoke tests
* end-to-end generation tests

The extension is tested through integration scenarios.

---

## Versioning Strategy

Templater follows semantic versioning.

Until DSL stabilizes:

* `0.x`

Once stable:

* `1.0.0`

Breaking changes are documented.

---

## Roadmap

### v0.1

* Local template generation
* CLI create command
* Metadata support

### v0.2

* Git-based install
* Template cache

### v0.3

* VS Code extension (basic UX)

### v0.4+

* Feature packs
* Update engine v1

### v1.0

* Stable DSL
* Compatibility guarantees

---

## Design Summary

Templater is:

* CLI-first
* strongly typed
* minimal by design
* safe by default
* extensible by architecture

It is built to be predictable infrastructure — not a convenience script.