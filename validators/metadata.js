const {open}=require('../tester/rex-runner.cjs');
try {const ctx=open(process.argv[2]);console.log('WidgetMetadata 通过：'+ctx.WidgetMetadata.id+' '+ctx.WidgetMetadata.version);} catch(e){console.error(e.message);process.exitCode=1;}
