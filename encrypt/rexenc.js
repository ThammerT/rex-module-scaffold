/**
 * REXENC 加密封装 — 对接 rexnow.tv 在线加密
 *
 * 用法：
 *   node encrypt/rexenc.js <dist/module.js> [output.enc]
 *
 * 流程：
 *   1. 读取构建后的模块源码
 *   2. POST 到 https://rex-decrypt.jsforbaby.workers.dev/encrypt（若可用）
 *   3. 若在线加密不可用（私有模块返回 403），输出本地占位说明
 *
 * 注意：
 *   - 官方分发的加密件可解；用 rexnow.tv/encrypt 自加密的私有模块可能返回 403，属正常。
 *   - 加密后的模块需配合索引文件 forward-widgets.fwd 发布。
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const SRC = process.argv[2];
const OUT = process.argv[3] || SRC.replace(/\.js$/, ".enc");

if (!SRC || !fs.existsSync(SRC)) {
  console.error("用法：node encrypt/rexenc.js <dist/module.js> [output.enc]");
  process.exit(1);
}

const source = fs.readFileSync(SRC, "utf8");

function postEncrypt(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: "rex-decrypt.jsforbaby.workers.dev",
        port: 443,
        path: "/encrypt",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("🔐 开始加密：", SRC);

  // 尝试在线加密（content 形式）
  try {
    const resp = await postEncrypt({ content: source });
    if (resp.status === 200 && resp.body && resp.body.encrypted) {
      fs.writeFileSync(OUT, resp.body.encrypted, "utf8");
      console.log("✅ 在线加密成功：" + OUT);
      console.log("   加密长度：", resp.body.encrypted.length);
      return;
    }
    console.warn("⚠️  在线加密返回异常：", resp.status, JSON.stringify(resp.body).slice(0, 200));
  } catch (err) {
    console.warn("⚠️  在线加密不可用：", err.message);
  }

  // 回退：本地不可逆占位（仅作打包标记，真实发布需使用 rexnow.tv/encrypt 或官方渠道）
  const placeholder = `// REXENC_PLACEHOLDER\n// 本模块未经在线加密，真实发布前请通过 rexnow.tv/encrypt 或官方加密渠道处理\n// 原始模块：${path.basename(SRC)}\n`;
  fs.writeFileSync(OUT, placeholder, "utf8");
  console.warn("⚠️  已生成本地占位文件：" + OUT);
  console.warn("   该文件仅为标记，不可直接作为加密模块使用。");
  console.warn("   请通过官方加密渠道获取真实 .enc 文件。");
}

main().catch((err) => {
  console.error("❌ 加密失败：", err.message);
  process.exit(1);
});
