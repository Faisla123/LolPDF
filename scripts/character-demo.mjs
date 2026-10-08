import puppeteer from 'puppeteer-core';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['scripts/security-preview.mjs'],{stdio:'ignore',env:{...process.env,PORT:'4186'}});
await sleep(500);
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
fs.mkdirSync('screenshots',{recursive:true});
const passes=[];
const check=(label,value)=>{if(!value)throw Error(label);passes.push(label);};
try {
 for (const [label,width,height] of [['desktop',960,640],['mobile',390,844]]) {
  const page=await browser.newPage();await page.setViewport({width,height,isMobile:label==='mobile',hasTouch:label==='mobile'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(()=>document.addEventListener('securitypolicyviolation',e=>(window.__csp||=[]).push(e.violatedDirective)));
  const dir=`/tmp/loader-${label}`;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  const cdp=await page.createCDPSession();const frames=[];
  cdp.on('Page.screencastFrame',async f=>{
   const path=`${dir}/${String(frames.length).padStart(5,'0')}.jpg`;
   fs.writeFileSync(path,Buffer.from(f.data,'base64'));frames.push({path,t:f.metadata.timestamp});
   await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId});
  });
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:width,maxHeight:height,everyNthFrame:1});
  await page.goto('http://localhost:4186/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.intro-count');
  check(`${label} counter and orb`,await page.evaluate(()=>!!document.querySelector('.intro-count')&&!!document.querySelector('.intro-orb')));
  check(`${label} background inert`,await page.$eval('main',el=>el.inert));
  for(const [mark,name,delay] of [[12,'early',150],[52,'mid',150],[90,'late',150]]) {
   await page.waitForFunction(n=>+document.querySelector('.intro-count span').textContent>=n,{},mark);
   await sleep(delay);await page.screenshot({path:`screenshots/${label}-loader-${name}.png`});
   check(`${label} ${mark}% no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   check(`${label} ${mark}% orb in view`,await page.$eval('.intro-orb',el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));
  }
  await page.waitForSelector('.intro-scene.is-lol');
  check(`${label} hit 100 percent`,await page.$eval('.intro-count span',el=>+el.textContent===100));
  await sleep(500);await page.screenshot({path:`screenshots/${label}-loader-lol.png`});
  check(`${label} LOL letters in view`,await page.$$eval('.lol-letter',els=>els.length===2&&els.every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&+getComputedStyle(el).opacity===1})));
  check(`${label} laughing face shown`,await page.$eval('.lol-face',el=>+getComputedStyle(el).opacity===1));
  await page.waitForSelector('.intro-loader.is-exiting');await sleep(300);
  await page.screenshot({path:`screenshots/${label}-loader-reveal.png`});
  check(`${label} opaque ten strips`,await page.$$eval('.intro-strip',els=>els.length===10&&els.every(el=>getComputedStyle(el).opacity==='1')));
  check(`${label} alternating directions`,await page.$$eval('.intro-strip',els=>els.every((el,i)=>{const x=new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;return i<3?(i%2?x>0:x<0):true})));
  await sleep(350);await page.screenshot({path:`screenshots/${label}-loader-reveal-late.png`});
  check(`${label} slices are sequential`,await page.$$eval('.intro-strip',els=>els.every((el,i)=>Math.abs(parseFloat(getComputedStyle(el).transitionDelay)-i*.09)<.001)));
  await page.waitForFunction(()=>!document.querySelector('.intro-loader'),{timeout:10000});
  check(`${label} background enabled`,await page.$eval('main',el=>!el.inert));
  await sleep(600);await page.screenshot({path:`screenshots/${label}-home.png`});await cdp.send('Page.stopScreencast');
  check(`${label} no runtime errors`,errors.length===0);check(`${label} no CSP violations`,await page.evaluate(()=>(window.__csp||[]).length===0));
  const lines=frames.flatMap((f,i)=>[`file '${f.path}'`,`duration ${Math.max(.001,(frames[i+1]?.t||f.t+.05)-f.t)}`]);lines.push(`file '${frames.at(-1).path}'`);
  fs.writeFileSync(`${dir}/frames.txt`,lines.join('\n'));
  const out=spawnSync('ffmpeg',['-y','-f','concat','-safe','0','-i',`${dir}/frames.txt`,'-vf','fps=60,pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',`screenshots/${label}-loader.mp4`],{encoding:'utf8'});
  if(out.status!==0)throw Error(out.stderr);
  console.log(label,frames.length,'frames, actual timestamps');await page.close();
 }
 console.log(passes.map(x=>`PASS ${x}`).join('\n'));console.log(passes.length,'loader checks passed');
} finally {await browser.close();server.kill()}
