#!/usr/bin/env node
/**
 * create-rex-module
 * Rex 资源类模块脚手架（Forward/Rex 播放器源模块）
 *
 * 用法：
 *   node bin/create-rex-module.js --id forward.demo --title "示例模块" --output ./widgets
 *   node bin/create-rex-module.js --interactive
 *
 * 生成的模块遵循 Rex 播放器模块规范：
 *   - WidgetMetadata 元数据（id/title/version/modules 等）
 *   - loadList / loadDetail / search 顶层 handler
 *   - danmu 三段式固定 id 模块
 *   - VideoItem 精确字段约定
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const TEMPLATES = path.join(ROOT, "templates");
const PKG_TMPL = path.join(TEMPLATES, "package.json.tmpl");
const MOD_TMPL = path.join(TEMPLATES, "module", "module.js.tmpl");
const BUILD_TMPL = path.join(TEMPLATES, "build", "build.js.tmpl");

function readTmpl(rel) {
  return fs.readFileSync(path.join(TEMPLATES, rel), "utf8");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(rel, content) {
  const full = path.resolve(rel);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, "utf8");
  return full;
}

function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function validateModuleId(id) {
  if (!/^[a-z0-9]+(\.[a-z0-9]+)+$/.test(id)) {
    throw new Error(`模块 id 不合法：${id}，应为反向域名风格，如 forward.demo`);
  }
  return id;
}

function prompt(question) {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    readline.question(question + " ", (ans) => {
      readline.close();
      resolve(ans.trim());
    })
  );
}

async function interactive() {
  const id = await prompt("模块 id（如 forward.demo）：");
  const title = await prompt("模块标题：");
  const author = await prompt("作者 [Forward]:") || "Forward";
  const version = await prompt("版本 [1.0.0]:") || "1.0.0";
  const out = await prompt("输出目录 [./widgets]:") || "./widgets";
  return { id, title, author, version, out, modules: [] };
}

function buildModuleJS({ id, title, version, author, modules }) {
  const kebab = camelToKebab(id.split(".").pop());
  const moduleId = kebab;
  const functionName = kebab.charAt(0).toUpperCase() + kebab.slice(1);

  const mod = {
    id: moduleId,
    title,
    functionName,
    type: "stream",
    cacheDuration: 3600,
    params: [
      { name: "page", title: "页码", type: "page", value: 1 },
    ],
  };

  const modulesJSON = JSON.stringify([mod], null, 2);

  return `/**
 * ${title}
 * Rex 资源类模块 — 自动生成
 * 模块 id：${id}
 */

WidgetMetadata = {
  id: "${id}",
  title: "${title}",
  version: "${version}",
  requiredVersion: "0.0.1",
  description: "${title} — Rex 播放器资源模块",
  author: "${author}",
  site: "https://rexnow.tv",
  detailCacheDuration: 60,
  modules: ${modulesJSON},
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page", value: 1 },
    ],
  },
};

/**
 * 资源列表 — 返回 VideoItem[]
 * params.page 由 App 注入（声明了 type: "page" 参数）
 */
async function ${functionName}(params) {
  const page = params.page || 1;

  // TODO: 替换为你的真实数据源抓取逻辑
  const items = [
    {
      id: "tmdb-550",
      type: "tmdb",
      mediaType: "movie",
      title: "示例影片",
      posterPath: "/example/poster.jpg",
      backdropPath: "/example/backdrop.jpg",
      coverUrl: "https://example.com/cover.jpg",
      releaseDate: "2025-01-01",
      rating: 8.4,
      description: "这是一个自动生成的示例条目，请替换为真实数据。",
      link: "detail:movie-550",
    },
  ];

  return items;
}

/**
 * 详情页 — loadDetail 接收 link 字符串，返回富 VideoItem
 * 仅对 type: "url" 的条目生效；tmdb/douban/imdb 由 App 内置处理
 */
async function loadDetail(link) {
  const key = String(link).split(":")[1] || link;

  // TODO: 根据 key 抓取详情，返回完整 VideoItem
  if (!key) return null;

  return {
    id: key,
    type: "url",
    title: "详情页示例",
    mediaType: "movie",
    link,
    backdropPaths: ["https://example.com/still1.jpg"],
    trailers: [{ coverUrl: "https://example.com/trailer.jpg", url: "https://example.com/trailer.mp4" }],
    genreItems: [{ id: "drama", title: "剧情" }],
    relatedItems: [],
    videoUrl: "https://example.com/play.m3u8",
  };
}

/**
 * 搜索 — 顶层 search 处理，非模块
 * params.keyword / params.page 由 App 注入
 */
async function search(params) {
  const keyword = params.keyword || "";
  const page = params.page || 1;

  // TODO: 实现搜索逻辑
  return [];
}
`;
}

function buildPackageJSON({ id, title, version, author }) {
  const name = id.replace(/\./g, "-");
  return JSON.stringify(
    {
      name,
      title,
      version,
      description: `Rex 资源模块：${title}`,
      author,
      license: "MIT",
      main: `${name}.js`,
      scripts: {
        build: "node build.js",
        test: "node tester/mock-app.js",
        encrypt: "node encrypt/rexenc.js",
      },
      rex: {
        moduleId: id,
        entry: `${name}.js`,
        encrypt: true,
      },
    },
    null,
    2
  );
}

function buildBuildJS({ id }) {
  const name = id.replace(/\./g, "-");
  return `/**
 * 构建脚本 — 打包 Rex 资源模块
 * 输出：dist/${name}.js（可直接加密发布）
 */

const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "../${name}.js");
const OUT = path.resolve(__dirname, "../dist");
const OUT_FILE = path.join(OUT, "${name}.js");

if (!fs.existsSync(SRC)) {
  console.error("源文件不存在：", SRC);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(SRC, OUT_FILE);

console.log("构建完成：" + OUT_FILE);
`;
}

async function main() {
  const args = process.argv.slice(2);
  let opts = {};

  if (args.includes("--interactive") || args.includes("-i")) {
    opts = await interactive();
  } else {
    for (let i = 0; i < args.length; i++) {
      const k = args[i];
      const v = args[++i];
      if (k === "--id") opts.id = v;
      else if (k === "--title") opts.title = v;
      else if (k === "--author") opts.author = v;
      else if (k === "--version") opts.version = v;
      else if (k === "--output") opts.out = v;
    }
  }

  opts.id = validateModuleId(opts.id);
  opts.title = opts.title || "Rex Module";
  opts.author = opts.author || "Forward";
  opts.version = opts.version || "1.0.0";
  opts.out = opts.out || "./widgets";

  const moduleFile = path.join(opts.out, opts.id.replace(/\./g, "-") + ".js");

  writeFile(moduleFile, buildModuleJS(opts));
  writeFile(path.join(opts.out, "package.json"), buildPackageJSON(opts));
  writeFile(path.join(opts.out, "build.js"), buildBuildJS(opts));

  console.log(`\n✅ 模块已生成：`);
  console.log(`   模块文件：${moduleFile}`);
  console.log(`   项目配置：${path.join(opts.out, "package.json")}`);
  console.log(`   构建脚本：${path.join(opts.out, "build.js")}`);
  console.log(`\n下一步：`);
  console.log(`   cd ${opts.out}`);
  console.log(`   node build.js          # 构建到 dist/`);
  console.log(`   node tester/mock-app.js  # 本地回测（需补充 tester）`);
  console.log(`   node encrypt/rexenc.js   # REXENC 加密发布`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
