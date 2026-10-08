import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['scripts/security-preview.mjs'],{stdio:'ignore',env:{...process.env,PORT:'4186'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));await sleep(400);
const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
try {
 const p=await b.newPage();await p.setViewport({width:1440,height:900});await p.setBypassServiceWorker(true);await p.goto('http://localhost:4186/',{waitUntil:'networkidle0'});await p.waitForFunction(()=>!document.querySelector('.intro-loader'));
 await p.setRequestInterception(true);p.on('request',req=>{if(/MergeTool-|Merge-/.test(req.url()))setTimeout(()=>req.continue(),3000);else req.continue();});
 await p.goto('http://localhost:4186/merge-pdf',{waitUntil:'domcontentloaded'});await p.waitForSelector('.loading-skeleton');await p.screenshot({path:'screenshots/desktop-skeleton.png'});
 await p.waitForSelector('[data-testid=file-input]');console.log('PASS skeleton shown for delayed route chunk and replaced by working tool');
} finally {await b.close();server.kill();}
