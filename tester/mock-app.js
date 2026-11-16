#!/usr/bin/env node
// 按 WidgetMetadata.functionName 执行 Rex 宿主全局脚本；失败退出码为 1。
require('./rex-runner.cjs').main().catch(e => { console.error(e.message); process.exitCode = 1; });
