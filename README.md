# Rex 资源模块脚手架（rex-module-scaffold）

面向 **Rex / Forward 播放器资源类模块** 的开发脚手架，覆盖：生成 → 抓取实现 → 本地回测 → 元数据校验 → 加密发布。

> 与 `@rexnow/libs`（rex-widget-libs）的区别：那个是 **Widget 小组件** 工具链；本仓库是 **播放器资源模块**（`WidgetMetadata` + `getList`/`loadDetail` 宿主全局脚本），两者不共用核心代码，但 `rex-widget-libs` 里的 `env/*.ts` 类型定义可作为返回结构参考。

## 目录结构

```
bin/create-rex-module.js     # 初始化入口（交互式向导 / 参数模式）
templates/module/            # 资源模块代码模板（宿主全局脚本规范）
tester/rex-runner.cjs        # 本地回测核心：按 WidgetMetadata 驱动，注入 Widget.http/Widget.html
tester/mock-app.js           # CLI 入口
validators/metadata.js       # 元数据校验
encrypt/rexenc.js            # 在线加密尝试脚本
modules/yuanqi-wallpaper/    # 真实可参考的成品模块（元气壁纸 v2.4.0）
```

## 快速开始

```bash
git clone <本仓库地址>
cd rex-module-scaffold
npm install            # 只装测试用 cheerio

# 生成新模块（交互式）
node bin/create-rex-module.js
# 或参数模式
node bin/create-rex-module.js --id forward.demo --title "示例" --author "吴主任" --output ./my-module
```

## 模块规范（重要）

资源模块是**宿主全局脚本**，不是 CommonJS：

- 只能用宿主注入的全局对象：`Widget.http.get`、`Widget.html.load`（cheerio）、`console`；**不要**用 `require` / Node 的 `fetch`。
- 顶层声明 `var WidgetMetadata = {...}`，`modules[].functionName` 指向列表函数（如 `getList`），`loadDetail(link)` 是详情函数。
- 列表项 `type` 用 `"url"`，`id`/`link` 都是详情页完整地址。
- 返回结构以 `rex-widget-libs/packages/libs/src/env/video.ts` 的 `VideoItem` 为准：封面看 `posterPath`/`coverUrl`/`backdropPath`，播放地址看 `videoUrl`/`previewUrl`。

## 本地回测

```bash
# 普通回测：按元数据调用列表函数，校验 VideoItem 结构，并抽查 loadDetail
node tester/mock-app.js modules/yuanqi-wallpaper/yuanqi-wallpaper.js '{"sortBy":"anime","pg":"1"}'

# TV / Topshelf 专用回测：额外断言每条列表项【同时】带有效封面和有效视频地址
node tester/mock-app.js modules/yuanqi-wallpaper/yuanqi-wallpaper.js '{"sortBy":"anime"}' --topshelf

# 仅校验元数据
node validators/metadata.js modules/yuanqi-wallpaper/yuanqi-wallpaper.js
```

失败会以非零退出码结束，可直接接 CI。

## TV / Topshelf 要求

Topshelf 列表需要**每条都能直接预览播放**，所以列表函数里必须对每条调用 `loadDetail`，把 `videoUrl`/`previewUrl` 和封面一起放进列表项，拿不到视频的条目直接过滤。参考 `modules/yuanqi-wallpaper/yuanqi-wallpaper.js` 的实现，并用 `--topshelf` 模式验收。

## 加密发布

```bash
node encrypt/rexenc.js <模块.js>
```

官方分发的加密件可用 `rex-decrypt.pages.dev` 解出源码；`rexnow.tv/encrypt` 自加密私有模块可能返回 403，属官方限制。
