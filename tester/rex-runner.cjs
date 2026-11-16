const fs=require('node:fs'),vm=require('node:vm');
const {load}=require('cheerio');
function validate(meta,ctx){
 if(!meta||!meta.id||!meta.title||!meta.version)throw Error('缺少 WidgetMetadata 基本字段');
 if(!Array.isArray(meta.modules)||!meta.modules.length)throw Error('缺少 modules');
 for(const m of meta.modules){if(!m.title||!m.functionName||typeof ctx[m.functionName]!=='function')throw Error('模块 handler 无效：'+m.functionName);}
 return meta;
}
function video(item){
 if(!item||!item.id||typeof item.title!=='string'||!['url','detail','tmdb','imdb','douban','forward'].includes(item.type))throw Error('VideoItem 缺少 id/title 或 type 不合法');
}
// TV Topshelf 要求：列表项必须同时带封面和可播放地址，否则只显示封面不能预览播放
function topshelf(item){
 const poster=item.posterPath||item.coverUrl||item.backdropPath||item.detailPoster;
 const play=item.videoUrl||item.previewUrl;
 if(!poster||!/^https?:\/\//.test(poster))throw Error('Topshelf 缺少有效封面：'+item.id);
 if(!play||!/^https?:\/\//.test(play))throw Error('Topshelf 缺少有效视频地址：'+item.id+'（列表项必须同时提供 videoUrl/previewUrl）');
}
function open(file){
 const ctx=vm.createContext({console,Widget:{html:{load},http:{get:async(url,opts={})=>{
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),opts.timeout||15000);
 try{const r=await fetch(url,{headers:opts.headers,signal:ctrl.signal});if(!r.ok)throw Error('HTTP '+r.status);return {statusCode:r.status,data:await r.text(),headers:Object.fromEntries(r.headers)};}finally{clearTimeout(timer);}
 }}}});
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{timeout:2000,filename:file});validate(ctx.WidgetMetadata,ctx);return ctx;
}
async function main(){
 const file=process.argv[2];if(!file)throw Error('用法：node tester/mock-app.js <module.js> [参数JSON] [--metadata-only]');
 const ctx=open(file),meta=ctx.WidgetMetadata;
 if(process.argv.includes('--metadata-only')){console.log('元数据通过：'+meta.id+' '+meta.version);return;}
 const overrides=process.argv[3]&&!process.argv[3].startsWith('--')?JSON.parse(process.argv[3]):{};
 const report=[];
 for(const m of meta.modules){
 if(m.type&&m.type!=='video')continue;
 const p={};for(const def of m.params||[])if(def.value!==undefined)p[def.name]=def.value;
 Object.assign(p,overrides);const data=await ctx[m.functionName](p);
 if(!Array.isArray(data))throw Error(m.functionName+' 应返回数组');
 data.forEach(video);if(!data.length)throw Error(m.functionName+' 返回空，不能确认成功');
 if(process.argv.includes('--topshelf'))data.forEach(topshelf);
 if(typeof ctx.loadDetail==='function'&&data[0].link){const detail=await ctx.loadDetail(data[0].link);if(!detail)throw Error('详情为空');(Array.isArray(detail)?detail:[detail]).forEach(video);}
 report.push({handler:m.functionName,count:data.length,first:data[0]});
 }
 if(!report.length)throw Error('没有执行任何视频列表 handler；stream/danmu/subtitle 需专用测试');
 console.log(JSON.stringify(report,null,2));
}
module.exports={open,validate,video,main};
