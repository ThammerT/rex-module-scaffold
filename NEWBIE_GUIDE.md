# Rex 资源模块脚手架 — 新手使用指南（零代码基础）

本指南面向**不懂编程**的用户，手把手教你用这个脚手架做一个 Rex 资源类模块（播放器源模块）。

> 什么是“资源类模块”？  
> 它是 Rex 播放器里的一个“片源源”，比如你想在 Rex 里搜索某个网站的电影、电视剧，就需要一个对应的模块去抓取那个网站的数据。

---

## 第一步：准备环境

你只需要一台能运行 Node.js 的电脑（Mac、Windows、Linux 都行）。

1. 打开终端（Mac 里是「终端」App，Windows 里是「命令提示符」或「PowerShell」）。
2. 把这个仓库下载下来：

```bash
git clone https://github.com/ThammerT/rex-module-scaffold.git
cd rex-module-scaffold
```

3. 确认 Node.js 已安装：

```bash
node -v
```

如果看到类似 `v22.23.5` 的版本号，就说明环境OK。

---

## 第二步：生成一个新模块

### 方式 A：交互式向导（推荐）

直接运行：

```bash
node bin/create-rex-module.js
```

然后按提示输入：
- **模块 ID**：比如 `forward.demo`（前缀建议用你的标识，比如 `forward.` 开头，中间用点分隔）
- **模块标题**：比如 `示例资源模块`（会显示在 Rex 里）
- **作者名**：你的名字或昵称，可留空
- **输出目录**：回车即可，默认生成到 `./demo` 文件夹

确认 `y` 后，会在当前目录生成一个模块文件夹，里面有：
- `demo.js` —— 你的模块代码（主要改这里）
- `package.json` —— 项目配置
- `build.js` —— 构建脚本

### 方式 B：命令行快速生成

如果你习惯用命令行参数，也可以一步到位：

```bash
node bin/create-rex-module.js --id forward.mysite --title "我的网站源" --author "吴主任" --output ./mysite
```

---

## 第三步：填写抓取逻辑（最关键一步）

打开生成的 `demo.js`（或 `mysite.js`），你会看到几个函数框架：

```javascript
async function Demo({ page }) { ... }      // 首页/分类列表
async function Search({ keyword, page }) { ... }  // 搜索
async function LoadDetail({ id }) { ... }    // 详情页
async function LoadDanmu({ id }) { ... }     // 弹幕（可选）
```

**你只需要把这几个函数里面的“抓取网页”逻辑填实。**

如果你不懂代码，这步需要开发者帮你写，或者你可以找已经写好的模块代码直接粘贴进去。脚手架只负责搭好“骨架”，具体抓哪个网站、怎么解析网页，取决于你想要的片源站点。

> 开发者视角：这里通常需要用 `fetch` 请求网页，用 `cheerio` 解析 HTML，返回符合 Rex `VideoItem` 格式的数据对象。

---

## 第四步：本地测试（确保模块没坏）

在模块文件夹里运行：

```bash
node tester/mock-app.js ./demo.js
```

你会看到类似输出：

```
📦 加载模块：demo
🔍 元数据检查通过
📋 调用 Demo({page:1}) → 返回 1 条条目
🔎 调用 Search({keyword:...}) → 返回搜索结果
🎬 调用 LoadDetail(...) → 返回详情对象
```

如果看到 `✅ 回测通过`，说明模块结构是正确的，可以继续下一步。

> 注意：mock-app 只是做“结构检查”，不代表真实抓取一定成功。真实抓取是否成功，要在 Rex 里实际安装运行后才知道。

---

## 第五步：构建 + 加密发布

1. **构建**（把代码打包成可发布的文件）：

```bash
node build.js
```

会生成 `dist/demo.js`。

2. **加密发布**（REXENC 加密，防止源码被直接读取）：

```bash
node encrypt/rexenc.js
```

会对接 Rex 官方加密接口生成 `.rexenc` 加密文件，这个文件才是你最终分发给其他 Rex 用户的模块文件。

> 私有模块如果 rexnow.tv 在线加密返回 403 是正常的，可以自行本地加密后分发。

---

## 常见问题（非开发者视角）

| 问题 | 说明 |
|------|------|
| 我不会写抓取代码怎么办？ | 脚手架只搭框架，抓取逻辑需要懂一点网页开发的人来写。你可以在 GitHub 上找已有的 Rex 模块源码参考，或请开发者帮忙。 |
| 生成的模块怎么安装到 Rex 里？ | 把 `dist/` 里的 `.js` 或 `.rexenc` 文件导入 Rex 播放器的模块管理页面即可。 |
| 模块 ID 和模块名有什么区别？ | 模块 ID（如 `forward.demo`）是内部唯一标识，模块名（`demo.js`）是文件名，标题（Title）才是用户在 Rex 里看到的名字。 |
| 可以做多个模块吗？ | 可以，每次运行脚手架生成一个新文件夹即可，互不干扰。 |

---

## 下一步

如果你已经准备好具体的抓取逻辑，或者想让我帮你把某个网站的模块逻辑填进模板，直接告诉我站点地址，我可以帮你写出可直接使用的代码。
