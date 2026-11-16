#!/usr/bin/env node
/**
 * Rex 资源模块本地回测工具（mock-app）
 * 用法：node tester/mock-app.js <模块文件路径> [关键词]
 *
 * 能力：
 * 1. 加载模块，读取 WidgetMetadata
 * 2. 提供全局 fetch（允许模块内做真实网络请求）
 * 3. 调用 Demo / Search / LoadDetail / LoadDanmu，打印返回结构
 * 4. 自动校验返回是否符合 Rex VideoItem 规范
 */

const fs = require("fs");
const path = require("path");

// 兼容 CommonJS / ESM 加载模块
async function loadModule(modulePath) {
  const absPath = path.resolve(modulePath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ 模块文件不存在：${absPath}`);
    process.exit(1);
  }

  // 先尝试 ESM import
  try {
    const mod = await import(absPath);
    return mod;
  } catch (e) {
    // 降级：如果是 CommonJS（module.exports），用 require 包装
    try {
      // 删除 require 缓存，避免重复加载
      delete require.cache[require.resolve(absPath)];
      const mod = require(absPath);
      return mod;
    } catch (e2) {
      console.error(`❌ 加载模块失败：${e2.message}`);
      process.exit(1);
    }
  }
}

// 全局 fetch（供模块内使用）
globalThis.fetch = globalThis.fetch || require("node-fetch") || (async (url, opts) => {
  const http = await import("http");
  const https = await import("https");
  // 简单降级：实际项目建议环境自带 fetch
  throw new Error("本环境未提供 fetch，请在 Rex 运行环境中测试真实网络请求");
});

function isVideoItem(obj) {
  return obj && typeof obj === "object" && obj.id && obj.name;
}

function printResult(label, data) {
  console.log(`\n🔹 ${label}`);
  if (data === undefined || data === null) {
    console.log("   返回：null/undefined");
    return;
  }
  if (Array.isArray(data)) {
    console.log(`   返回数组，共 ${data.length} 项`);
    data.slice(0, 3).forEach((item, i) => {
      if (isVideoItem(item)) {
        console.log(`   [${i}] ${item.name} | id=${item.id} | poster=${item.poster || "无"}`);
      } else {
        console.log(`   [${i}] 非标准 VideoItem：`, JSON.stringify(item).slice(0, 120));
      }
    });
    if (data.length > 3) console.log(`   ... 共 ${data.length} 项，仅显示前 3 项`);
  } else if (typeof data === "object") {
    if (isVideoItem(data)) {
      console.log(`   名称：${data.name}`);
      console.log(`   ID：${data.id}`);
      console.log(`   封面：${data.poster || "无"}`);
      console.log(`   描述：${(data.desc || "").slice(0, 80)}${data.desc && data.desc.length > 80 ? "..." : ""}`);
    } else {
      console.log("   返回对象：", JSON.stringify(data, null, 2).slice(0, 500));
    }
  } else {
    console.log("   返回：", String(data));
  }
}

async function main() {
  const modulePath = process.argv[2];
  const keyword = process.argv[3] || "测试";

  if (!modulePath) {
    console.log("用法：node tester/mock-app.js <模块文件路径> [搜索关键词]");
    console.log("示例：node tester/mock-app.js ./demo.js 漫威");
    process.exit(1);
  }

  console.log(`╔═══════════════════════════════════════════╗`);
  console.log(`║   Rex 模块本地回测                          ║`);
  console.log(`║   模块：${modulePath.padEnd(30)}║`);
  console.log(`╚═══════════════════════════════════════════╝\n`);

  const mod = await loadModule(modulePath);

  // 兼容 ESM import CommonJS：{ default: module.exports }
  const realMod = mod.default && (mod.default.WidgetMetadata || mod.default.Demo || mod.default.Search) ? mod.default : mod;

  // 1. 读取元数据
  const meta = realMod.WidgetMetadata || realMod.metadata || realMod;
  console.log("📦 元数据：");
  console.log(`   ID：${meta.id || "未知"}`);
  console.log(`   标题：${meta.title || "未知"}`);
  console.log(`   版本：${meta.version || "未知"}`);
  console.log(`   作者：${meta.author || "未知"}`);
  console.log(`   模块列表：${JSON.stringify(meta.modules || [])}`);

  // 2. 调用 Demo（列表）
  console.log("\n────────────────────────────────────────");
  console.log("📋 调用 Demo({page:1}) ...");
  try {
    const demoHandler = realMod.Demo || realMod.demo || realMod.list;
    if (typeof demoHandler === "function") {
      const result = await demoHandler({ page: 1 });
      printResult("Demo 返回", result);
    } else {
      console.log("   ⚠️  未找到 Demo handler，跳过");
    }
  } catch (e) {
    console.log(`   ❌ 报错：${e.message}`);
  }

  // 3. 调用 Search（搜索）
  console.log("\n────────────────────────────────────────");
  console.log(`🔍 调用 Search({keyword:"${keyword}", page:1}) ...`);
  try {
    const searchHandler = realMod.Search || realMod.search;
    if (typeof searchHandler === "function") {
      const result = await searchHandler({ keyword, page: 1 });
      printResult("Search 返回", result);
    } else {
      console.log("   ⚠️  未找到 Search handler，跳过");
    }
  } catch (e) {
    console.log(`   ❌ 报错：${e.message}`);
  }

  // 4. 调用 LoadDetail（详情）
  console.log("\n────────────────────────────────────────");
  console.log("🎬 调用 LoadDetail({id:'detail:movie-1'}) ...");
  try {
    const detailHandler = realMod.LoadDetail || realMod.loadDetail || realMod.detail;
    if (typeof detailHandler === "function") {
      const result = await detailHandler({ id: "detail:movie-1" });
      printResult("LoadDetail 返回", result);
    } else {
      console.log("   ⚠️  未找到 LoadDetail handler，跳过");
    }
  } catch (e) {
    console.log(`   ❌ 报错：${e.message}`);
  }

  // 5. 调用 LoadDanmu（弹幕，可选）
  console.log("\n────────────────────────────────────────");
  console.log("💬 调用 LoadDanmu({id:'danmu:1'}) ...");
  try {
    const danmuHandler = realMod.LoadDanmu || realMod.loadDanmu || realMod.danmu;
    if (typeof danmuHandler === "function") {
      const result = await danmuHandler({ id: "danmu:1" });
      printResult("LoadDanmu 返回", result);
    } else {
      console.log("   ℹ️  未实现 LoadDanmu（可选，可跳过）");
    }
  } catch (e) {
    console.log(`   ❌ 报错：${e.message}`);
  }

  console.log("\n✅ 回测结束。");
}

main().catch((err) => {
  console.error("❌ 回测失败：", err.message);
  process.exit(1);
});
