import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
fs.mkdirSync('screenshots',{recursive:true});
const passes=[];
const check=(name,ok)=>{if(!ok)throw Error(name);passes.push(name);};
try {
for(const [label,width,height] of [['desktop',960,640],['mobile',390,844]]){
 const page=await browser.newPage();await page.setViewport({width,height});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const dir=`/tmp/routes-${label}`;fs.mkdirSync(dir,{recursive:true});
 const frames=[],cdp=await page.createCDPSession();
 cdp.on('Page.screencastFrame',async f=>{const path=`${dir}/${String(frames.length).padStart(5,'0')}.jpg`;fs.writeFileSync(path,Buffer.from(f.data,'base64'));frames.push({path,t:f.metadata.timestamp});await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId});});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:width,maxHeight:height});
 await page.goto('http://localhost:4190/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.intro-loader:not(.is-quick)');
 check(`${label}: first load full intro`,await page.$eval('main',el=>el.inert));
 await page.waitForSelector('.intro-scene.is-lol');await sleep(500);
 await page.screenshot({path:`screenshots/${label}-first-lol.png`});
 await page.waitForFunction(()=>!document.querySelector('.intro-loader'),{timeout:12000});
 await sleep(300);
 for(const [index,route] of ['/merge-pdf','/split-pdf','/'].entries()){
  // Click real router links. The second tool is in the footer.
  const a=await page.$(`a[href="${route}"]:not(.skip)`);if(!a)throw Error(`missing link ${route}`);
  await a.evaluate(el=>el.scrollIntoView({block:'center'}));await sleep(120);await a.click();
  await page.waitForSelector('.intro-loader.is-quick');
  await page.waitForFunction(path=>location.pathname===path,{},route);check(`${label}: ${route} route correct`,new URL(page.url()).pathname===route);
  check(`${label}: ${route} locked only while loading`,await page.$eval('main',el=>el.inert));
  check(`${label}: ${route} starts from count`,await page.$eval('.intro-count span',el=>+el.textContent<100));
  await page.waitForSelector('.intro-scene.is-lol');await sleep(340);
  await page.screenshot({path:`screenshots/${label}-route-${index}-lol.png`});
  check(`${label}: ${route} face intact`,await page.$eval('.lol-face',el=>getComputedStyle(el).opacity==='1'));
  await page.waitForSelector('.intro-loader.is-exiting');await sleep(150);
  await page.screenshot({path:`screenshots/${label}-route-${index}-wipe.png`});
  check(`${label}: ${route} ten complete strips`,await page.$$eval('.intro-strip',els=>els.length===10&&els.every(el=>el.querySelector('.intro-orb-face')?.getAttribute('mask')===null)));
  await page.waitForFunction(()=>!document.querySelector('.intro-loader'));
  check(`${label}: ${route} usable`,await page.evaluate(()=>!document.querySelector('main').inert&&document.body.style.overflow!=='hidden'&&!document.querySelector('.loading-skeleton')));
  await page.screenshot({path:`screenshots/${label}-route-${index}-ready.png`});await sleep(550);
 }
 await cdp.send('Page.stopScreencast');
 const valid=frames.filter(f=>{const data=fs.readFileSync(f.path);let k=2;while(k<data.length){if(data[k]!==255){k++;continue;}const m=data[k+1],n=data.readUInt16BE(k+2);if(m===192||m===194)return data.readUInt16BE(k+5)===height&&data.readUInt16BE(k+7)===width;k+=n+2;}return false;});
 const lines=valid.flatMap((f,i)=>[`file '${f.path}'`,`duration ${Math.max(.001,(valid[i+1]?.t||f.t+.05)-f.t)}`]);lines.push(`file '${valid.at(-1).path}'`);fs.writeFileSync(`${dir}/frames.txt`,lines.join('\n'));
 const ff=spawnSync('ffmpeg',['-y','-f','concat','-safe','0','-i',`${dir}/frames.txt`,'-vf','fps=30,pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',`screenshots/${label}-route-loader.mp4`],{encoding:'utf8'});if(ff.status)throw Error(ff.stderr);
 // Interrupt a loader with Back, then forward. Old timers must never unlock or delete the new instance.
 await page.click('a[href="/merge-pdf"]');await page.waitForSelector('.intro-loader');await page.goBack();await page.waitForSelector('.intro-loader.is-quick');await sleep(100);await page.goForward();
 await page.waitForSelector('.intro-loader.is-quick');await page.waitForFunction(()=>!document.querySelector('.intro-loader'));
 check(`${label}: interrupted back/forward clean`,await page.evaluate(()=>!document.querySelector('main').inert&&document.body.style.overflow!=='hidden'));
 await sleep(500);check(`${label}: no stale replay`,!(await page.$('.intro-loader')));
 check(`${label}: no runtime errors`,!errors.length);await page.close();
}
const reduced=await browser.newPage();await reduced.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await reduced.goto('http://localhost:4190/');await reduced.waitForSelector('a[href="/merge-pdf"]');await reduced.click('a[href="/merge-pdf"]');await reduced.waitForSelector('.workspace');
check('Reduced motion: no animated overlay or inert trap',await reduced.evaluate(()=>!document.querySelector('.intro-loader')&&!document.querySelector('main').inert&&document.body.style.overflow!=='hidden'));
console.log(passes.map(p=>'PASS '+p).join('\n'));console.log(passes.length+' checks passed');
}finally{await browser.close();}
