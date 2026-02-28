# Arquitectura

Templater es un sistema composable de scaffolding de proyectos construido en torno a una idea simple:

> Una plantilla no es una copia de carpeta.  
> Es un artefacto ejecutable, tipado y versionado.

Templater consta de tres capas independientes:
- un motor core,
- una CLI,
- y una extensión para VS Code.

El sistema es CLI-first. La extensión es una capa de UX — no el motor.

---

## Filosofía

Templater se construye en torno a unos principios no negociables:

- **Generación determinista** — las mismas entradas deben producir la misma salida.
- **Seguridad por defecto** — ningún comportamiento destructivo a menos que se permita explícitamente.
- **Separación de responsabilidades** — las capas de UI nunca contienen lógica de generación.
- **Configuración tipada** — las plantillas se definen como código, no JSON suelto.
- **Portabilidad** — las plantillas deben ser compartibles vía Git o npm.
- **Mínima magia** — explícito sobre implícito.

Templater es infraestructura. La infraestructura debe ser predecible.

---

## Arquitectura de alto nivel

Templater se divide en tres paquetes:

### 1. `@templater/core`

El motor.

Responsabilidades:
- carga de plantillas
- validación de configuración
- renderizado
- planificación de archivos
- políticas de escritura
- ejecución controlada de hooks
- generación de metadatos

Sin UI. Sin prompts. Sin red.

---

### 2. `templater` (CLI)

La interfaz de línea de comandos.

Responsabilidades:
- prompts al usuario
- instalación de plantillas
- gestión de caché
- orquestación de ejecución
- salida formateada

La CLI depende de `@templater/core`.

---

### 3. `templater-extension`

La extensión para VS Code.

Responsabilidades:
- integración con la paleta de comandos
- UI QuickPick
- notificaciones de progreso
- invocación de la lógica core (directamente o vía CLI)

La extensión no contiene lógica de generación.

---

## Estructura del monorepo

Templater usa un workspace de pnpm.

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

Esto mantiene:
- tipos compartidos centralizados
- versionado unificado
- desarrollo consistente

---

## Diseño del motor core

El core es responsable de la generación determinista.

### Flujo de generación

1. Cargar directorio de plantilla
2. Parsear y validar `templater.config.ts`
3. Resolver esquema de preguntas
4. Recibir respuestas del llamador (CLI/extensión)
5. Construir contexto de plantilla
6. Crear plan de generación (en memoria)
7. Aplicar política de sistema de archivos
8. Ejecutar hooks del ciclo de vida
9. Escribir `.templater/meta.json`

El core nunca hace preguntas.  
Recibe entradas resueltas.

---

## Plantillas

Una plantilla es un directorio que contiene:

- `templater.config.ts`
- un directorio de archivos fuente (normalmente `files/`)

Las plantillas se definen como código para:
- seguridad de tipos
- soporte de hooks
- extensibilidad futura

Deben permanecer:
- autocontenidas
- sin efectos secundarios en tiempo de importación
- predecibles

---

## Renderizado

Templater usa un motor de renderizado (inicialmente Handlebars).

Características soportadas:
- variables
- condicionales
- helpers simples

Los archivos binarios se detectan y copian sin transformación.

El renderizado se aplica deterministicamente y nunca muta las plantillas fuente.

---

## Políticas de escritura

Templater nunca sobrescribe en silencio.

Políticas soportadas:
- `fail`
- `skip`
- `overwrite`
- `prompt` (manejado por UI)

El core calcula un plan de archivos antes de escribir.

---

## Contexto de plantilla

Las plantillas pueden definir hooks del ciclo de vida:

- `beforeGenerate`
- `afterGenerate`

Los hooks se ejecutan dentro de una API de contexto restringida.

El contexto:
- expone variables resueltas
- permite escrituras controladas
- opcionalmente permite ejecución de comandos
- previene acceso no controlado al sistema de archivos

La seguridad y reproducibilidad tienen prioridad sobre la flexibilidad.

---

## Metadatos del proyecto

Los proyectos generados contienen metadatos de origen:

```
.templater/meta.json
```

Ejemplo:

```json
{
  "template": "landing-basic",
  "version": "1.0.0",
  "generatedAt": "2026-02-28T12:00:00Z"
}
```

Esto permite:

* mecanismos futuros de actualización
* seguimiento de procedencia
* depuración

---

## Distribución de plantillas

Templater soporta múltiples modelos de distribución:

### Plantillas locales

Generación basada en ruta.

### Plantillas basadas en Git

Instaladas y cacheadas localmente.

### Plantillas basadas en npm

Versionadas y reproducibles.

Futuro: registro hospedado.

---

## Almacenamiento

Templater usa un directorio de usuario local:

* macOS/Linux: `~/.templater`
* Windows: `%USERPROFILE%\.templater`

Estructura:

```
templates/
cache/
config.json
```

El almacenamiento lo gestiona la CLI.

---

## Manejo de errores

Los errores son:

* tipados
* explícitos
* accionables

El core nunca imprime directamente a stdout.  
Devuelve resultados estructurados.

Las capas de UI formatean la salida.

---

## Estrategia de pruebas

Core:

* pruebas unitarias de renderizado y planificación
* pruebas de integración con plantillas de ejemplo
* pruebas de snapshot para salida determinista

CLI:

* pruebas smoke a nivel de comandos
* pruebas end-to-end de generación

La extensión se prueba a través de escenarios de integración.

---

## Estrategia de versionado

Templater sigue el versionado semántico.

Hasta que el DSL se estabilice:

* `0.x`

Una vez estable:

* `1.0.0`

Los cambios que rompen compatibilidad se documentan.

---

## Hoja de ruta

### v0.1

* Generación de plantillas locales
* Comando create de CLI
* Soporte de metadatos

### v0.2

* Instalación basada en Git
* Caché de plantillas

### v0.3

* Extensión VS Code (UX básico)

### v0.4+

* Feature packs
* Update engine v1

### v1.0

* DSL estable
* Garantías de compatibilidad

---

## Resumen del diseño

Templater es:

* CLI-first
* fuertemente tipado
* mínimo por diseño
* seguro por defecto
* extensible por arquitectura

Está construido para ser infraestructura predecible — no un script de conveniencia.
