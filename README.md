# create-rex-module

Rex 资源类模块脚手架（Forward/Rex 播放器源模块）。与 `@rexnow/libs`（Widget 小组件工具链）不同，本脚手架专门面向 **播放器源模块**（`.js` 模块，可选 REXENC 加密）。

## 快速开始

```bash
# 交互式创建
node bin/create-rex-module.js --interactive

# 非交互式创建
node bin/create-rex-module.js \
  --id forward.demo \
  --title "示例资源" \
  --output ./widgets/demo
```

生成的项目结构：

```
widgets/demo/
├── forward-demo.js      # 模块源码（含 WidgetMetadata + 顶层 handler）
├── package.json         # 项目配置（含 rex.moduleId / entry）
├── build.js             # 构建脚本，输出到 dist/
├── tester/
│   └── mock-app.js      # 本地模拟 App 调用
├── encrypt/
│   └── rexenc.js        # REXENC 加密封装
└── dist/                # 构建输出
```

## 流程

1. **初始化** — `node bin/create-rex-module.js ...` 生成模板
2. **填充逻辑** — 编辑 `forward-demo.js`，替换 TODO 处的数据源抓取
3. **校验元数据** — `node validators/metadata.js forward-demo.js`
4. **本地回测** — `node tester/mock-app.js forward-demo.js`
5. **构建** — `node build.js` → `dist/forward-demo.js`
6. **加密发布** — `node encrypt/rexenc.js dist/forward-demo.js` → `.enc` 文件

## 模块规范要点

- `WidgetMetadata` 必须包含 `id`（反向域名风格）、`title`、`version`、`author`、`modules` 数组、可选 `search`。
- 每个模块条目需 `id`、`title`、`functionName`、`type`（stream/tv/live）。
- `functionName` 对应模块内的异步函数，接收 `params`（含 `page`）。
- `loadDetail(link)` 处理 `type: "url"` 条目的详情页；`tmdb/douban/imdb` 由 App 内置处理。
- `search` 是顶层函数，非模块成员，接收 `keyword` / `page`。

## 加密说明

- 公开模块：可用 `rexnow.tv/encrypt` 在线加密，或通过官方渠道分发。
- 私有模块：用 `rexnow.tv/encrypt` 自加密可能返回 `403 key-session 请求失败`，属正常。
- 本脚手架的 `encrypt/rexenc.js` 会先尝试在线加密，失败则生成占位文件提示你走官方渠道。

## 与 @rexnow/libs 的区别

| | @rexnow/libs | create-rex-module |
|---|---|---|
| 对象 | Widget 小组件（面板/插件） | 播放器源模块（视频源） |
| 核心 | WidgetAdaptor、Env Schema、Rslib 插件 | WidgetMetadata、loadList/loadDetail/search |
| 输出 | 小组件包 | `.js` 模块 + 可选 `.enc` 加密件 |
| 测试 | rstest | 本地 mock-app 回测 |
