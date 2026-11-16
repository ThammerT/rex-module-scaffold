# 元气壁纸 2.4.0

可直接导入：`yuanqi-wallpaper.js`。保持原 ID `yuanqi.wallpaper` 和函数 `getWallpaperList`，兼容 `pg`，额外接受 `page`。

## 修复

- 数据源从移动站迁到有完整服务端 HTML 的电脑主站。
- 按主站导航修正风景、动漫、美女、游戏、动物、小清新分类，4K 使用真实标签页。
- 返回合法 `type: url`，列表包含 `videoUrl` 和 `previewUrl`，保留 Topshelf 预览。
- 列表详情最多四并发；同 URL 在途请求合并；十分钟缓存，最多120条，仅缓存成功解析的视频。
- 去重、排除静态页，禁止请求任意外域详情。
- 分页读取网站实际分页链接；未找到指定页返回空，不猜 URL。
- 关键词改为当前所选分类、当前页的标题筛选；无匹配返回空。原版猜哈希、借用别的关键词哈希与不相关分类回退已移除。尚未恢复全站关键词搜索。
- 未核实的 AI 分类从选择列表移除，旧 AI 配置会明确报错，需重新选择。

## 验证

根目录 `npm install --ignore-scripts` 后：

```
npm test
node validators/metadata.js modules/yuanqi-wallpaper/yuanqi-wallpaper.js
node tester/mock-app.js modules/yuanqi-wallpaper/yuanqi-wallpaper.js '{"sortBy":"anime","pg":1}'
npm run test:yuanqi:live
```

离线20项通过：去重、静态过滤、URL解析、无视频过滤、外域拒绝、参数校验、关键词不匹配、详情缓存、空解析不缓存、在途合并、四并发上限、TTL与容量上限。

联网：动漫第一页18条视频（19请求），第二页18条候选、热门榜24条候选；首条MP4 Range请求 HTTP206/1024字节。元数据校验通过。没有验证全部分类/全部分页/每条视频，也没有 Rex 真机导入和实际播放验收。站点提供的是预览视频，4K标签不等于预览文件本身4K。保留的 customData.loop 只是兼容意图字段，不保证客户端强制循环。

## 脚手架修复

`tester/rex-runner.cjs` 在 VM 中加载宿主全局脚本，注入 Widget.http/Widget.html，按 metadata.functionName 调用，验证 id/title/type，loadDetail 传 link 字符串。失败退出码1。该工具执行模块代码，不是面向恶意代码的安全隔离器。CI 改为安装依赖、离线测试、元数据校验和产物收集，不依赖外站在线状态。

原 Gist 与远程仓库未自动修改。上游原作者真实身份无法从折扣码元数据确认，因此没有擅自署为某位开发者。
