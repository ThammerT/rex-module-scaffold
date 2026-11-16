/**
 * 构建脚本 — 打包 Rex 资源模块
 * 输出：dist/forward-demo.js（可直接加密发布）
 */

const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "../forward-demo.js");
const OUT = path.resolve(__dirname, "../dist");
const OUT_FILE = path.join(OUT, "forward-demo.js");

if (!fs.existsSync(SRC)) {
  console.error("源文件不存在：", SRC);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(SRC, OUT_FILE);

console.log("构建完成：" + OUT_FILE);
