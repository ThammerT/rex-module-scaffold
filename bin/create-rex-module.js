#!/usr/bin/env node
/**
 * Rex 资源模块脚手架 — 交互式初始化入口
 * 支持两种用法：
 *   1. 交互式向导（推荐非开发者使用）： node bin/create-rex-module.js
 *   2. 快速参数模式： node bin/create-rex-module.js --id forward.demo --title "示例模块" --author "吴主任" --output ./my-module
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) =>
  new Promise((resolve) => rl.question(text, resolve));

const close = () => rl.close();

/** 把模板里的 {{NAME}} 等占位符替换成实际值 */
function render(template, values) {
  let out = template;
  for (const [key, val] of Object.entries(values)) {
    out = out.replace(new RegExp(`{{${key}}}`, "g"), val);
  }
  return out;
}

/** 从 moduleId 提取建议的包名（forward.demo -> forward-demo） */
function slugify(moduleId) {
  return moduleId.replace(/\./g, "-").replace(/[^a-z0-9-]/gi, "");
}

/** 生成项目文件 */
function generateModule(outDir, values) {
  const files = [
    { src: "package.json.tmpl", dst: "package.json" },
    { src: path.join("module", "module.js.tmpl"), dst: `${values.NAME}.js` },
    { src: "build/build.js.tmpl", dst: "build.js" },
  ];

  fs.mkdirSync(outDir, { recursive: true });

  for (const { src, dst } of files) {
    const srcPath = path.join(TEMPLATES_DIR, src);
    const tmpl = fs.readFileSync(srcPath, "utf8");
    const content = render(tmpl, values);
    const dstPath = path.join(outDir, dst);
    fs.writeFileSync(dstPath, content, "utf8");
    console.log(`   📄 生成：${dst}`);
  }

  // 生成示例测试数据目录（供本地回测 fixtures 使用）
  const examplesDir = path.join(outDir, "examples");
  fs.mkdirSync(examplesDir, { recursive: true });

  console.log(`\n✅ 模块已生成到：${outDir}`);
  console.log(`\n📋 下一步：`);
  console.log(`   cd ${outDir}`);
  console.log(`   # 1. 编辑 ${values.NAME}.js，把 parseList / parseDetail 的抓取逻辑填实`);
  console.log(`   # 2. 本地回测： node ../../tester/mock-app.js ./${values.NAME}.js '{"pg":"1"}'`);
  console.log(`   #    TV/Topshelf 专用： node ../../tester/mock-app.js ./${values.NAME}.js '{}' --topshelf`);
  console.log(`   # 3. 元数据校验： node ../../validators/metadata.js ./${values.NAME}.js`);
  console.log(`   # 4. 发布：直接把 ${values.NAME}.js 导入 Rex，或走 encrypt/rexenc.js 加密`);
}

/** 参数快速模式 */
async function fastMode(args) {
  const parse = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : null;
  };

  const id = parse("--id");
  const title = parse("--title");
  const author = parse("--author");
  const output = parse("--output");

  if (!id || !title) {
    console.error("❌ 缺少必填参数：--id 和 --title");
    console.log("示例：node bin/create-rex-module.js --id forward.demo --title \"我的模块\" --author \"吴主任\" --output ./my-module");
    process.exit(1);
  }

  const values = {
    MODULE_ID: id,
    NAME: slugify(id),
    TITLE: title,
    AUTHOR: author || "未知",
    VERSION: "1.0.0",
  };

  const outDir = output || `./${values.NAME}`;
  generateModule(outDir, values);
  close();
}

/** 交互式向导 */
async function interactiveMode() {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║   Rex 资源模块脚手架 — 交互式初始化向导         ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  const moduleId = await question("模块 ID（例如 forward.demo，建议用前缀.模块名）：");
  const title = await question("模块标题（会显示在 Rex 里的模块列表）：");
  const author = await question("作者名（可留空）：");
  const output = await question("输出目录（回车使用默认 ./<模块名>）：");

  const name = slugify(moduleId.trim());
  const values = {
    MODULE_ID: moduleId.trim(),
    NAME: name,
    TITLE: title.trim(),
    AUTHOR: author.trim() || "未知",
    VERSION: "1.0.0",
  };

  const outDir = output.trim() || `./${name}`;

  // 确认
  console.log(`\n📦 即将生成：`);
  console.log(`   模块 ID：${values.MODULE_ID}`);
  console.log(`   模块名：${values.NAME}.js`);
  console.log(`   标题：${values.TITLE}`);
  console.log(`   作者：${values.AUTHOR}`);
  console.log(`   输出目录：${outDir}`);
  const confirm = await question("\n确认生成？(y/n)：");

  if (confirm.toLowerCase() !== "y") {
    console.log("已取消。");
    close();
    return;
  }

  generateModule(outDir, values);
  close();
}

const args = process.argv.slice(2);

if (args.includes("--id") || args.includes("--title")) {
  fastMode(args);
} else {
  interactiveMode().catch((err) => {
    console.error("❌ 向导出错：", err.message);
    close();
    process.exit(1);
  });
}
