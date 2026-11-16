# 新手指南：从零做一个 Rex 资源模块（含 TV Topshelf）

你不需要会编程基础也能跟着做——照着下面每一步敲命令、改文件就行。遇到不懂的红色报错，把报错贴出来即可。

## 0. 前置

- 一台能跑终端的设备（本仓库已在 Minis 的 Linux 环境验证，Node 22）。
- `npm install` 安装测试依赖（只有一个 cheerio）。

## 1. 克隆并生成模块

```bash
git clone <仓库地址> && cd rex-module-scaffold
npm install
node bin/create-rex-module.js
```

按提示输入：模块 ID（如 `forward.mysite`）、标题、作者、输出目录。

## 2. 理解生成的文件

- `<模块名>.js`：你的模块代码，只有两个地方需要改——`parseList`（列表页怎么抓条目）和 `parseDetail`（详情页怎么拿视频地址）。
- 关键规则：模块是宿主全局脚本，只能用 `Widget.http.get` 抓网页、`Widget.html.load` 解析 HTML。

## 3. 填抓取逻辑

打开浏览器看目标站列表页和详情页的 HTML：

- 列表页：找条目链接（通常是 `<a href>` 里带详情路径）和封面 `<img>`，改 `parseList` 里的选择器。
- 详情页：找 `<video src>` 或 `<source src>`，改 `parseDetail`。

## 4. 本地回测

```bash
# 普通回测
node tester/mock-app.js ./my-module/forward-mysite.js '{"pg":"1"}'

# 电视 Topshelf 必做：确认每条都有封面+视频地址
node tester/mock-app.js ./my-module/forward-mysite.js '{}' --topshelf
```

看到 JSON 输出且命令成功退出（退出码 0）就是通过。失败会打印具体哪条缺什么。

## 5. TV / Topshelf 专项

Topshelf 列表里每条都要能直接播放预览，所以：

1. `getList` 里必须对每条调用 `loadDetail`，把视频地址并入列表项；
2. 拿不到视频的条目直接过滤，不要留 `videoUrl: null` 的条目；
3. 用 `--topshelf` 模式验收，全部通过才算能上 TV。

参考成品：`modules/yuanqi-wallpaper/yuanqi-wallpaper.js`。

## 6. 导入 Rex / 加密发布

- 最简单：把 `.js` 文件直接导入 Rex 播放器。
- 加密分发：`node encrypt/rexenc.js <模块.js>`。

## 常见报错

| 报错 | 含义 |
|---|---|
| `Widget is not defined` | 模块里用了 Node 写法，改成 `Widget.http.get` / `Widget.html.load` |
| `Topshelf 缺少有效视频地址` | 列表项没带 videoUrl/previewUrl，检查 getList 是否合并了 loadDetail 结果 |
| `返回空，不能确认成功` | 列表解析没抓到条目，检查 parseList 选择器 |
| `HTTP 404/500` | 目标 URL 错了或站点改版，用浏览器核对真实地址 |
