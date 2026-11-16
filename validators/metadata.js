/**
 * WidgetMetadata 校验器 — 验证 Rex 资源模块元数据结构
 * 用法：node validators/metadata.js <module.js>
 */

const fs = require("fs");
const vm = require("vm");

const FILE = process.argv[2];
if (!FILE) {
  console.error("用法：node validators/metadata.js <module.js>");
  process.exit(1);
}

const code = fs.readFileSync(FILE, "utf8");

// 在沙箱中执行模块，取出 WidgetMetadata
const sandbox = { WidgetMetadata: null };
const script = new vm.Script(code);
try {
  script.runInNewContext(sandbox);
} catch (err) {
  console.error("❌ 模块执行失败：", err.message);
  process.exit(1);
}

const meta = sandbox.WidgetMetadata;
if (!meta) {
  console.error("❌ 缺少 WidgetMetadata");
  process.exit(1);
}

const errors = [];

// 基础字段
["id", "title", "version", "author"].forEach((k) => {
  if (!meta[k]) errors.push(`缺少字段：${k}`);
});

// modules 必须是数组且每个模块有 id / title / functionName
if (!Array.isArray(meta.modules) || meta.modules.length === 0) {
  errors.push("modules 必须是非空数组");
} else {
  meta.modules.forEach((m, i) => {
    ["id", "title", "functionName", "type"].forEach((k) => {
      if (!m[k]) errors.push(`modules[${i}] 缺少字段：${k}`);
    });
    if (m.type && !["stream", "tv", "live"].includes(m.type)) {
      errors.push(`modules[${i}].type 值异常：${m.type}`);
    });
  });
}

// search 可选，若存在需有 functionName
if (meta.search && !meta.search.functionName) {
  errors.push("search 缺少 functionName");
}

if (errors.length) {
  console.error("❌ 校验未通过：");
  errors.forEach((e) => console.error("   - " + e));
  process.exit(1);
}

console.log("✅ WidgetMetadata 校验通过");
console.log("   id:", meta.id);
console.log("   title:", meta.title);
console.log("   version:", meta.version);
console.log("   modules:", meta.modules.map((m) => m.id).join(", "));
