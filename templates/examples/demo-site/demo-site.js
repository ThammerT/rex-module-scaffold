/**
 * Rex 资源模块示例：DemoSite
 * ---------------------------------------------------------------
 * 这是一个可直接运行的示例模块，用于学习和修改。
 *
 * 使用方法：
 *  1. 把本文件复制到你的模块目录，重命名为你的模块名.js
 *  2. 修改 WidgetMetadata 里的 id、title、version、author
 *  3. 在 Demo / Search / LoadDetail 里填入真实站点的抓取逻辑
 *  4. 用 node tester/mock-app.js <你的模块.js> 做本地回测
 * ---------------------------------------------------------------
 */

// ==================== 1. 模块元数据 ====================
// Rex 播放器会读取这段信息，显示在模块列表和设置里
const WidgetMetadata = {
  id: "demo-site",           // 模块唯一标识，建议用英文小写，不要和其他模块重复
  title: "示例站点",         // 模块显示名称
  version: "1.0.0",          // 版本号
  author: "吴主任",           // 作者
  description: "用于学习的 Rex 资源模块示例",
  modules: ["video"],        // 支持的内容类型：video / live / etc.
  // 可选：配置项，Rex 会在设置里生成输入框
  config: [],
};

// 导出元数据（CommonJS + ESM 兼容）
if (typeof module !== "undefined" && module.exports) {
  module.exports = { WidgetMetadata };
} else if (typeof globalThis !== "undefined") {
  globalThis.WidgetMetadata = WidgetMetadata;
}

// ==================== 2. 工具函数 ====================

/**
 * 发起 HTTP 请求并获取文本
 * 在 Rex 环境中，fetch 是原生可用的；本地回测时 mock-app 也提供了 fetch
 */
async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} 请求失败：${url}`);
  return await res.text();
}

/**
 * 简单的 HTML 解析：按选择器提取元素（极简版，仅作示例）
 * 实际开发中建议在 Rex 环境中使用原生 DOMParser 或正则表达式
 */
function simpleParse(html, selector) {
  // 这里仅返回原始 HTML，实际抓取时请根据目标站点结构编写解析逻辑
  return html;
}

/**
 * 构造标准的 VideoItem 对象
 * 这是 Rex 播放器认可的条目格式，缺少字段可能导致无法显示
 */
function makeVideoItem(id, name, poster = "", desc = "", extra = {}) {
  return {
    id,           // 唯一 ID，建议带前缀，如 "movie:123" 或 "detail:movie-123"
    name,         // 标题
    poster,       // 封面图 URL
    desc,         // 简介
    ...extra,     // 其他字段（如 url、playFrom、note 等）
  };
}

// ==================== 3. 列表 handler (Demo) ====================
// Rex 播放器会调用这个函数来获取首页/分类列表
async function Demo(params) {
  const { page = 1 } = params || {};

  // ⚠️ 下面是模拟数据，本地回测用
  // 真实开发时，请替换为：
  //   const html = await fetchText("https://目标站点.com/?page=" + page);
  //   从 html 中解析出视频列表，返回 makeVideoItem 数组
  const items = [
    makeVideoItem("demo:movie-1", "示例电影 1", "https://via.placeholder.com/200x300?text=Movie1", "这是第一部示例电影"),
    makeVideoItem("demo:movie-2", "示例电影 2", "https://via.placeholder.com/200x300?text=Movie2", "这是第二部示例电影"),
  ];

  return {
    list: items,      // 视频列表数组
    page,             // 当前页码
    pagecount: 1,     // 总页数
    limit: 20,        // 每页数量
    total: items.length,
  };
}

// ==================== 4. 搜索 handler (Search) ====================
// Rex 播放器会调用这个函数来执行搜索
async function Search(params) {
  const { keyword = "", page = 1 } = params || {};

  // ⚠️ 模拟搜索结果
  // 真实开发时，请替换为：
  //   const html = await fetchText("https://目标站点.com/search?q=" + encodeURIComponent(keyword));
  //   解析搜索结果，返回 makeVideoItem 数组
  const items = keyword
    ? [makeVideoItem(`demo:search-${keyword}-1`, `搜索结果："${keyword}"`, "", "点击查看详情")]
    : [];

  return {
    list: items,
    page,
    pagecount: 1,
    limit: 20,
    total: items.length,
  };
}

// ==================== 5. 详情 handler (LoadDetail) ====================
// Rex 播放器会调用这个函数来获取视频详情和播放源
async function LoadDetail(params) {
  const { id } = params || {};

  // ⚠️ 模拟详情
  // 真实开发时，请替换为：
  //   const html = await fetchText("https://目标站点.com/detail/" + id);
  //   解析出标题、封面、简介、播放源列表
  return {
    id,
    name: "示例视频详情",
    poster: "https://via.placeholder.com/200x300?text=Detail",
    desc: "这是一个示例详情页，替换为真实站点的解析逻辑。",
    // 播放源列表（Rex 播放器会据此显示播放按钮）
    urls: [
      {
        name: "备用线路 1",
        url: "https://example.com/video.mp4", // 替换为真实视频 URL
        type: "mp4",
      },
    ],
  };
}

// ==================== 6. 弹幕 handler (LoadDanmu，可选) ====================
// 如果你的模块不需要弹幕，可以删除这个函数
async function LoadDanmu(params) {
  const { id } = params || {};
  return {
    id,
    list: [], // 弹幕列表，每项 { time: number, text: string, color: string }
  };
}

// ==================== 7. 导出 handler（CommonJS + ESM 兼容） ====================
const handlers = {
  WidgetMetadata,
  Demo,
  Search,
  LoadDetail,
  LoadDanmu,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = handlers;
} else if (typeof globalThis !== "undefined") {
  globalThis.Demo = Demo;
  globalThis.Search = Search;
  globalThis.LoadDetail = LoadDetail;
  globalThis.LoadDanmu = LoadDanmu;
  globalThis.WidgetMetadata = WidgetMetadata;
}
