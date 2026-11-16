const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {load}=require('cheerio');
const code=fs.readFileSync(__dirname+'/yuanqi-wallpaper.js','utf8');
let calls=0,active=0,max=0,network=process.argv.includes('--live');
const fixtures={};
const ctx=vm.createContext({console,Widget:{html:{load},http:{get:async(url)=>{
 calls++;active++;max=Math.max(active,max);
 try{if(network){let html=cp.execFileSync('curl',['-fsS','--max-time','20',url],{encoding:'utf8',maxBuffer:3000000});return {data:html,status:200};}
 if(fixtures[url] instanceof Error)throw fixtures[url];
 if(!(url in fixtures))throw Error('Missing fixture '+url);
 await new Promise(r=>setTimeout(r,1));return {data:fixtures[url],status:200};
 }finally{active--;}
}}}});vm.runInContext(code,ctx,{timeout:1000});
const base='https://bizhi.cheetahfun.com',link=base+'/dn/pd1.html';
const list='<a href="/dn/pd1.html"><img alt="火影" src="//cdn.example/a.jpg"></a><a href="/dn/pd1.html"><img alt="重复"></a><a href="/dn/pj2.html">静态</a><a href="/dn/c2d/p2">2</a>';
const detail='<title>火影电脑壁纸</title><video poster="//cdn.example/poster.jpg" src="https://cdn.example/preview.mp4"></video>';
async function main(){
if(network){let items=await ctx.getWallpaperList({sortBy:'anime',pg:1});assert(items.length>0);assert(items.every(x=>x.type==='url'&&x.videoUrl&&/^https?:\/\//.test(x.videoUrl)));assert(items.every(x=>(x.posterPath||x.coverUrl||x.backdropPath)&&/^https?:\/\//.test(x.posterPath||x.coverUrl||x.backdropPath)));console.log(JSON.stringify({mode:'live',topshelf:'PASS',items:items.length,calls,first:items[0]},null,2));return;}
fixtures[base+'/dn/c2d/']=list;fixtures[base+'/dn/c2d/p2']=list;fixtures[link]=detail;
let pass=0;function check(v){assert(v);pass++;}
check(ctx.WidgetMetadata.id==='yuanqi.wallpaper');check(ctx.WidgetMetadata.version==='2.4.0');
check(ctx.yqParseList(list,base).length===1);check(ctx.yqParseList(list,base)[0].posterPath==='https://cdn.example/a.jpg');
check(ctx.yqParseDetail('<title>No video</title>',link)===null);
check(await ctx.loadDetail('https://evil.example/dn/pd1.html')===null);
let data=await ctx.getWallpaperList({sortBy:'anime',pg:1});check(data.length===1&&data[0].type==='url'&&!!data[0].previewUrl);
// Topshelf：列表项必须同时带有效封面和有效视频地址
check(data.every(x=>/^https?:\/\//.test(x.posterPath||'')&&/^https?:\/\//.test(x.videoUrl||x.previewUrl||'')));
let before=calls;await ctx.loadDetail(link);check(calls===before);
data=await ctx.getWallpaperList({sortBy:'anime',pg:2});check(data.length===1);
data=await ctx.getWallpaperList({sortBy:'anime',keyword:'不存在'});check(data.length===0);
await assert.rejects(()=>ctx.getWallpaperList({pg:0}));pass++;
await assert.rejects(()=>ctx.getWallpaperList({sortBy:'ai'}));pass++;
let link2=base+'/dn/pd2.html';fixtures[link2]='<html><title>empty</title><body>No video here</body></html>';check(await ctx.loadDetail(link2)===null);fixtures[link2]=detail;check(!!(await ctx.loadDetail(link2)).videoUrl);
let link3=base+'/dn/pd3.html';fixtures[link3]=detail;before=calls;await Promise.all([ctx.loadDetail(link3),ctx.loadDetail(link3)]);check(calls-before===1);
fixtures[base+'/dn/c2d/']=Array.from({length:10},(_,i)=>{let u=base+'/dn/pd'+(100+i)+'.html';fixtures[u]=detail;return '<a href="'+u+'"><img alt="test'+i+'"></a>'}).join('');
data=await ctx.getWallpaperList({sortBy:'anime'});check(data.length===10);check(max===4);
vm.runInContext('YQ_cache.forEach(function(v){v.time=0})',ctx);before=calls;await ctx.loadDetail(link);check(calls>before);
for(let i=0;i<125;i++){let u=base+'/dn/pd'+(1000+i)+'.html';fixtures[u]=detail;await ctx.loadDetail(u);}
check(vm.runInContext('YQ_cache.size',ctx)===120);
check(max<=4);console.log(JSON.stringify({mode:'offline',passed:pass,calls,max}));
}main().catch(e=>{console.error(e);process.exitCode=1});
