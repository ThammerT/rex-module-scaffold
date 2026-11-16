/**
 * 本地模拟 App 调用 Rex 资源模块
 * 用于在未接入真实 App 前做快速回测
 *
 * 用法：
 *   node tester/mock-app.js <module.js>
 *
 * 模拟 App 调用：
 *   1. 加载模块，取出 WidgetMetadata
 *   2. 调用模块顶层 handler（{{FUNCTION_NAME}}）
 *   3. 调用 loadDetail(link)（若模块内定义）
 *   4. 调用 search(keyword)
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const FILE = process.argv[2];
if (!FILE) {
  console.error("用法：node tester/mock-app.js <module.js>");
  process.exit(1);
}

const code = fs.readFileSync(FILE, "utf8");
const sandbox = {
  WidgetMetadata: null,
  console,
  setTimeout,
  setInterval,
  clearTimeout,
  clearInterval,
  fetch: undefined, // 本地无网络，保留占位
};

const script = new vm.Script(code);
try {
  script.runInNewContext(sandbox);
} catch (err) {
  console.error("❌ 模块加载失败：", err.message);
  process.exit(1);
}

const meta = sandbox.WidgetMetadata;
if (!meta) {
  console.error("❌ 模块未导出 WidgetMetadata");
  process.exit(1);
}

console.log("📦 模块元数据：");
console.log("   id:", meta.id);
console.log("   title:", meta.title);
console.log("   version:", meta.version);
console.log("   modules:", meta.modules.map((m) => `${m.id}(${m.functionName})`).join(", "));

// 调用每个模块的列表 handler
for (const mod of meta.modules) {
  const fnName = mod.functionName;
  if (typeof sandbox[fnName] !== "function") {
    console.warn(`⚠️  找不到函数 ${fnName}，跳过列表测试`);
    continue;
  }

  console.log(`\n🔍 调用 ${fnName}({page:1}) ...`);
  try {
    const result = sandbox[fnName]({ page: 1 });
    const items = result instanceof Promise ? result : Promise.resolve(result);
    items.then((arr) => {
      if (!Array.isArray(arr)) {
        console.error("   ❌ 返回值不是数组");
        return;
      }
      console.log(`   ✅ 返回 ${arr.length} 条条目`);
      arr.slice(0, 3).forEach((item, i) => {
        console.log(`   [${i + 1}] id=${item.id} type=${item.type} title=${item.title} link=${item.link || "-"}`);
      });
    });
  } catch (err) {
    console.error("   ❌ 调用失败：", err.message);
  }
}

// 调用 search（若存在）
if (meta.search && typeof sandbox.search === "function") {
  console.log(`\n🔎 调用 search({keyword:"示例", page:1}) ...`);
  try {
    const result = sandbox.search({ keyword: "示例", page: 1 });
    const items = result instanceof Promise ? result : Promise.resolve(result);
    items.then((arr) => {
      console.log(`   ✅ 搜索返回 ${arr.length} 条条目`);
    });
  } catch (err) {
    console.error("   ❌ 搜索失败：", err.message);
  }
}

// 调用 loadDetail（若存在）
if (typeof sandbox.loadDetail === "function") {
  console.log(`\n📄 调用 loadDetail("detail:movie-550") ...`);
  try {
    const result = sandbox.loadDetail("detail:movie-550");
    const detail = result instanceof Promise ? result : Promise.resolve(result);
    detail.then((d) => {
      if (!d) {
        console.log("   ⚠️  返回 null");
        return;
      }
      console.log("   ✅ 详情页：", JSON.stringify(d, null, 2).slice(0, 500));
    });
  } catch (err) {
    console.error("   ❌ 详情页失败：", err.message);
  }
}

console.log("\n✅ 本地回测完成");
