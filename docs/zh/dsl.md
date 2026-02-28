# Template DSL

Template DSL 定义了 Templater 中模板的编写方式。

模板不仅仅是一个文件夹。  
它是**项目结构和行为的类型化、版本化定义**。

本文档描述：

- `defineTemplate` API
- 支持的配置字段
- 生命周期钩子
- 渲染行为
- 约束与保证
- 最佳实践
- 稳定性政策

---

## 概述

模板必须使用 `defineTemplate` 导出默认配置：

```ts
import { defineTemplate } from "@templater/core";

export default defineTemplate({
  name: "landing-basic",
  version: "1.0.0"
});
````

配置对象定义元数据、问题、文件源和生命周期钩子。

---

## 基本结构

最小示例：

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

有效的模板目录必须包含：

* `templater.config.ts`
* 源目录（默认：`files/`）

---

## 必填字段

### `name: string`

模板标识符。

必须：

* 在其分发上下文中唯一
* 仅包含 URL 安全字符
* 跨版本保持稳定

---

### `version: string`

模板版本。

必须遵循语义化版本（`MAJOR.MINOR.PATCH`）。

Templater 尚未强制版本解析，但需要版本元数据。

---

## 问题

问题定义生成过程中所需的用户输入。

示例：

```ts
questions: [
  {
    type: "input",
    name: "projectName",
    message: "项目名称",
    default: "my-app"
  },
  {
    type: "select",
    name: "css",
    message: "CSS 方案",
    options: ["scss", "tailwind"]
  },
  {
    type: "confirm",
    name: "analytics",
    message: "包含分析？",
    default: false
  }
]
```

---

### 支持的类型 (v0.x)

* `input`
* `select`
* `confirm`

每个问题必须定义：

* `type`
* `name`
* `message`

可选：

* `default`
* `validate(value) => boolean | string`

CLI 和扩展负责呈现这些问题。

核心只消费已解析的答案。

---

## 文件配置

`files` 字段定义模板源目录。

```ts
files: {
  source: "files",
  include?: string[],
  exclude?: string[]
}
```

### `source`

相对于模板根目录的路径。

省略时默认为 `"files"`。

---

### `include` / `exclude`

控制处理哪些文件的 Glob 模式。

省略时：

* 考虑 `source` 下的所有文件

---

## 渲染规则

Templater 使用模板引擎（当前为 Handlebars）渲染文本文件。

支持的语法：

### 变量

```html
<title>{{projectName}}</title>
```

### 条件

```html
{{#if analytics}}
<script src="analytics.js"></script>
{{/if}}
```

---

## 二进制文件

二进制文件会自动检测并直接复制，不进行渲染。

这确保：

* 图片
* 字体
* 媒体资源

可安全保留。

---

## 生命周期钩子

模板可定义生命周期钩子：

```ts
hooks: {
  beforeGenerate(ctx) {},
  afterGenerate(ctx) {}
}
```

钩子为可选。

---

### 钩子执行模型

钩子在受限的 `TemplateContext` 中运行。

概念上：

```ts
interface TemplateContext {
  vars: Record<string, any>;
  log(message: string): void;
  write(path: string, content: string): Promise<void>;
  remove(path: string): Promise<void>;
  exec(command: string): Promise<void>;
}
```

重要：

* 钩子不得假定直接访问文件系统。
* 所有写操作仅限于目标目录。
* `exec` 在安全模式下可能被禁用。

钩子必须具有确定性和幂等性。

---

## 元数据生成

生成后，Templater 创建：

```
.templater/meta.json
```

包含：

* 模板名称
* 模板版本
* 生成时间戳

模板不得覆盖此文件。

---

## 确定性

模板必须具有确定性。

给定：

* 相同模板版本
* 相同输入
* 相同写入策略

输出必须完全相同。

依赖以下内容的模板：

* 随机性
* 外部 API
* 基于时间的值

强烈不建议使用。

---

## 稳定性政策

Template DSL 将谨慎演进。

规则：

* 破坏性变更需要主版本增量。
* 弃用字段在 0.x 期间将保持支持并发出警告。
* 需要在 `1.0.0` 之前实现 DSL 稳定性。

---

## 最佳实践

### 1. 保持模板最小化

避免嵌入：

* 完整的 node_modules
* 大型生成产物

---

### 2. 避免配置中的副作用

`templater.config.ts` 不得：

* 在导入时执行命令
* 修改全局状态

---

### 3. 显式优于隐式

避免在钩子中猜测行为。

---

### 4. 有意地进行版本控制

若模板输出发生变化：

* 递增版本
* 记录变更

---

### 5. 保持问题聚焦

避免过度配置。  
模板应引导用户，而非使其不知所措。

---

## 反模式

避免：

* 基于运行时答案的动态导入
* 向目标目录外写入
* 将钩子用作完整项目生成器
* 用环境特定行为重载模板

Templater 是脚手架引擎 —— 而非部署工具。

---

## 未来扩展（计划中）

尚未实现但架构上支持：

* Feature packs（`templater apply`）
* 模板组合（`extends`）
* 条件文件树
* 注册表元数据集成

---

## 总结

Template DSL 旨在平衡：

* 能力
* 安全
* 可预测性
* 开发体验

模板应感觉结构化，而非魔法。

Templater 设计用于从小型落地页项目扩展到结构化生态 —— 而不牺牲清晰度。
