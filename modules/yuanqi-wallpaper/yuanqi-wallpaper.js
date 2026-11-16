/* 元气壁纸 v2.4.0 — Rex 宿主全局脚本；无需 Node/fetch。 */
var WidgetMetadata = {
  id: 'yuanqi.wallpaper', title: '🖼️ 元气动态壁纸', version: '2.4.0',
  requiredVersion: '0.0.1', author: '原模块维护者；ThammerT 升级维护',
  site: 'https://bizhi.cheetahfun.com',
  description: '电脑动态壁纸及 Topshelf 视频预览；关键词仅筛选当前列表页标题，不是全站搜索。',
  modules: [{ id: 'wallpaperList', title: '动态壁纸列表', functionName: 'getWallpaperList', requiresWebView: false,
    params: [
      { name: 'keyword', title: '当前页标题筛选', type: 'input', value: '', description: '仅匹配所选分类当前页标题；无匹配返回空，不替换为其他分类。' },
      { name: 'sortBy', title: '分类', type: 'enumeration', value: 'hot', enumOptions: [
        {title:'热门榜',value:'hot'},{title:'全部动态',value:'all'},{title:'4K动态',value:'4k'},
        {title:'风景',value:'scenery'},{title:'动漫',value:'anime'},{title:'美女',value:'beauty'},
        {title:'游戏',value:'game'},{title:'动物',value:'animal'},{title:'小清新',value:'fresh'},{title:'其他',value:'other'}] },
      { name: 'pg', title: '页码', type: 'page', value: '1' }
    ] }]
};
var YQ_BASE = 'https://bizhi.cheetahfun.com';
var YQ_PATHS = {hot:'/ranking',all:'/dn/d/',dynamic:'/dn/d/','4k':'/dtag_109_a14fdede25965c8c0bd3ceb11f364baf/',scenery:'/dn/c1d/',anime:'/dn/c2d/',beauty:'/dn/c3d/',game:'/dn/c4d/',animal:'/dn/c6d/',fresh:'/dn/c10d/',other:'/dn/c11d/'};
var YQ_cache = new Map();
var YQ_pending = new Map();
function yqAbsolute(value, base) {
  var s = String(value || '').trim().replace(/&amp;/g, '&');
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return 'https:' + s;
  if (s.charAt(0) === '/') return YQ_BASE + s;
  if (!s || /^(data|javascript):/i.test(s)) return '';
  return (base || YQ_BASE + '/').replace(/[^/]*$/, '') + s;
}
function yqOwned(link) {
  return /^https:\/\/(?:m?bizhi\.cheetahfun\.com)\/dn\/pd\d+\.html$/.test(String(link || ''));
}
function yqCanonical(link) { return String(link).replace('https://mbizhi.', 'https://bizhi.'); }
async function yqHtml(url) {
  var last;
  for (var n = 0; n < 2; n++) {
    try {
      var r = await Widget.http.get(url, {headers:{'User-Agent':'Mozilla/5.0',Referer:YQ_BASE + '/'}, timeout:15000});
      var status = Number(r.statusCode || r.status || 200);
      if (status >= 400) { var e = new Error('元气壁纸 HTTP ' + status); e.status = status; throw e; }
      if (typeof r.data !== 'string' || r.data.length < 30) throw new Error('元气壁纸返回内容异常');
      return r.data;
    } catch (e) { last = e; if (e.status >= 400 && e.status < 500) break; }
  }
  throw last;
}
function yqParseList(html, base) {
  var $ = Widget.html.load(html), out = [], seen = {};
  $('a[href]').each(function(_, el) {
    var a = $(el), link = yqCanonical(yqAbsolute(a.attr('href'), base));
    if (!yqOwned(link) || seen[link]) return;
    var img = a.find('img').last();
    var title = (a.attr('title') || img.attr('alt') || a.text() || '').replace(/\s+/g,' ').trim();
    if (!title) return;
    seen[link] = true;
    out.push({id:link,type:'url',title:title,link:link,posterPath:yqAbsolute(img.attr('data-src') || img.attr('data-original') || img.attr('src'), base)});
  });
  return out;
}
function yqParseDetail(html, link) {
  var $ = Widget.html.load(html), video = $('video').first();
  var src = yqAbsolute(video.attr('src') || video.find('source').first().attr('src'), link);
  if (!/^https?:\/\//i.test(src)) return null;
  var title = ($('h1').first().text() || $('title').text()).replace(/\s*[-_|].*元气壁纸.*$/, '').trim();
  var poster = yqAbsolute(video.attr('poster') || $('meta[property="og:image"]').attr('content'), link);
  return {id:link,type:'url',title:title || '动态壁纸',link:link,videoUrl:src,previewUrl:src,
    posterPath:poster,backdropPath:poster,coverUrl:poster,
    description:'元气壁纸站点提供的视频预览；不代表原始 4K 下载文件。',headers:{Referer:YQ_BASE + '/'},customData:{loop:true}};
}
async function loadDetail(link) {
  if (!yqOwned(link)) return null;
  link = yqCanonical(link);
  var hit = YQ_cache.get(link);
  if (hit && Date.now() - hit.time < 600000) return Object.assign({},hit.value);
  if (YQ_pending.has(link)) return YQ_pending.get(link);
  var task = (async function() {
    var detail = yqParseDetail(await yqHtml(link), link);
    if (detail) {
      YQ_cache.delete(link);
      YQ_cache.set(link,{time:Date.now(),value:detail});
      while (YQ_cache.size > 120) YQ_cache.delete(YQ_cache.keys().next().value);
    }
    return detail;
  })();
  YQ_pending.set(link, task);
  try { var value = await task; return value ? Object.assign({},value) : null; }
  finally { YQ_pending.delete(link); }
}
async function yqListPage(path, page) {
  var url = YQ_BASE + path;
  if (page > 1) {
    // 从网站真实分页锚点取得 URL，不猜测 /2.html 或 index_2.shtml。
    var html = await yqHtml(url), $ = Widget.html.load(html), next = '';
    $('a[href]').each(function(_,el) {
      var a = $(el), href = a.attr('href') || '';
      if (/\/p\d+\/?$/.test(href) && Number((href.match(/\/p(\d+)/)||[])[1]) === page && href.indexOf(path) >= 0) next = yqAbsolute(href,url);
    });
    if (!next) return [];
    url = next;
  }
  return yqParseList(await yqHtml(url), url).slice(0,30);
}
async function getWallpaperList(params) {
  params = params || {};
  var raw = params.pg != null ? params.pg : (params.page != null ? params.page : 1);
  var page = Number(raw);
  if (!Number.isInteger(page) || page < 1 || page > 1000) throw new Error('页码必须是 1–1000 的整数');
  var category = params.sortBy || 'hot';
  if (!Object.prototype.hasOwnProperty.call(YQ_PATHS, category)) throw new Error('未核实的分类：' + category + '，请选择现有分类');
  var items = await yqListPage(YQ_PATHS[category], page);
  var keyword = String(params.keyword || '').trim().toLowerCase();
  if (keyword) items = items.filter(function(it){return it.title.toLowerCase().indexOf(keyword) >= 0;});
  var result = new Array(items.length), cursor = 0, failures = [];
  async function worker() {
    while (cursor < items.length) {
      var i = cursor++, item = items[i];
      try {
        var detail = await loadDetail(item.link);
        if (detail) result[i] = Object.assign({},item,detail,{title:item.title || detail.title,genreTitle:category});
      } catch(e) { failures.push(e); console.warn('元气壁纸详情失败：' + item.link + ' ' + e.message); }
    }
  }
  await Promise.all([worker(),worker(),worker(),worker()]);
  var valid = result.filter(Boolean);
  if (!valid.length && failures.length) throw new Error('详情全部请求失败：' + failures[0].message);
  return valid;
}
