# DemoSite 示例模块

这是一个可直接运行的 Rex 资源模块示例，适合非开发者学习和修改。

## 文件结构

```
demo-site/
├── demo-site.js   // 模块主代码（本文件）
└── README.md      // 本说明
```

## 如何把这个示例改成你自己的模块

### 第一步：复制并重命名

把 `demo-site.js` 复制到你的模块目录，重命名为你想要的模块名，例如 `tencent.js` 或 `mytv.js`。

### 第二步：修改元数据

打开文件顶部的 `WidgetMetadata`，修改：

```js
const WidgetMetadata = {
  id: "mytv",           // 改成你的模块唯一 ID，英文小写，不要重复
  title: "我的TV源",     // 改成你想在 Rex 里显示的名称
  version: "1.0.0",
  author: "吴主任",
  modules: ["video"],
};
```

### 第三步：填入真实抓取逻辑

文件里标了 `⚠️` 的地方，就是你需要填真实站点抓取代码的地方：

1. **Demo（首页列表）**：把 `fetchText("https://目标站点.com")` 替换成真实站点的 URL，然后从返回的 HTML 里解析出视频列表，用 `makeVideoItem` 包装后返回。
2. **Search（搜索）**：把搜索关键词拼进真实站点的搜索 URL，请求并解析结果。
3. **LoadDetail（详情）**：根据视频 ID 请求详情页，解析出封面、简介、播放源 URL。

### 第四步：本地回测

在终端里运行：

```bash
node /var/minis/workspace/rex-module-scaffold/tester/mock-app.js ./demo-site.js
```

如果看到 `✅ 回测通过`，说明模块结构正确，可以继续填真实逻辑。

### 第五步：构建与加密

```bash
# 构建到 dist/
node /var/minis/workspace/rex-module-scaffold/templates/build/build.js

# REXENC 加密（可选，用于分发）
node /var/minis/workspace/rex-module-scaffold/encrypt/rexenc.js
```

## 注意事项（非开发者必读）

1. **不要随便抓取他人网站**：只在你有权访问、或站点明确允许的情况下编写抓取逻辑。
2. **视频 URL 必须是直接可播放的**：Rex 播放器需要直接的视频文件地址（.mp4 / .m3u8 等），不是网页地址。
3. **模块 ID 不要重复**：两个模块如果 id 相同，Rex 会把它们当成同一个，后安装的会覆盖先安装的。
4. **首次运行失败很正常**：抓取逻辑需要根据目标站点的实际 HTML 结构编写，可能需要多次调试。
