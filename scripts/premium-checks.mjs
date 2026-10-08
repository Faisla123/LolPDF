import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['scripts/security-preview.mjs'],{stdio:'ignore',env:{...process.env,PORT:'4187'}});
await sleep(500);
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
let passes=0;const check=(label,ok)=>{if(!ok)throw Error(label);console.log('PASS',label);passes++};
try {
 const p=await browser.newPage();await p.setViewport({width:320,height:568,isMobile:true,hasTouch:true});
 await p.goto('http://localhost:4187/',{waitUntil:'domcontentloaded'});
 await p.waitForSelector('.intro-count');
 check('percent counter present',await p.$eval('.intro-count',el=>el.getBoundingClientRect().width>0));
 check('orb present',await p.$eval('.intro-orb',el=>el.getBoundingClientRect().width>0));
 check('ten strips before completion',await p.$$eval('.intro-strip',els=>els.length===10));
 check('touch cursor hidden without reduced motion',await p.$eval('.cursor-ring',el=>getComputedStyle(el).display==='none'));
 check('body locked during intro',await p.evaluate(()=>getComputedStyle(document.body).overflow==='hidden'));
 for(const mark of [8,45,80]){
  await p.waitForFunction(n=>+document.querySelector('.intro-count span').textContent>=n,{},mark);
  await sleep(120);
  check(`320 layout fine at ${mark}%`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(`320 orb in viewport at ${mark}%`,await p.$eval('.intro-orb',el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));
  check(`320 counter in viewport at ${mark}%`,await p.$eval('.intro-count',el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));
 }
 await p.waitForSelector('.intro-scene.is-lol');
 await sleep(750);
 check('counter reaches 100',await p.$eval('.intro-count span',el=>+el.textContent===100));
 check('lol letters visible',await p.$$eval('.lol-letter',els=>els.length===2&&els.every(el=>+getComputedStyle(el).opacity===1)));
 check('laughing face visible',await p.$eval('.lol-face',el=>+getComputedStyle(el).opacity===1));
 await sleep(300);
 await p.screenshot({path:'screenshots/small-mobile-lol.png'});
 check('320 lol letters in viewport',await p.$$eval('.lol-letter',els=>els.every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})));
 await p.waitForSelector('.is-exiting');
 check('strips are ten percent',await p.$$eval('.intro-strip',els=>els.every(el=>Math.abs(el.getBoundingClientRect().height-innerHeight*.1)<1)));
 check('cloned scenes are frozen',await p.$$eval('.intro-strip .lol-letter',els=>els.length===20&&els.every(el=>getComputedStyle(el).animationName==='none')));
 check('no opacity fade',await p.$$eval('.intro-strip',els=>els.every(el=>getComputedStyle(el).opacity==='1')));
 await p.waitForFunction(()=>!document.querySelector('.intro-loader'));
 check('body scrolling restored',await p.evaluate(()=>getComputedStyle(document.body).overflow!=='hidden'));
 check('black background',await p.evaluate(()=>getComputedStyle(document.body).backgroundColor==='rgb(8, 8, 8)'));
 check('white body text',await p.evaluate(()=>getComputedStyle(document.body).color==='rgb(255, 255, 255)'));
 check('orange scrollbar',await p.evaluate(()=>getComputedStyle(document.documentElement).scrollbarColor==='rgb(255, 107, 0) rgb(8, 8, 8)'));
 check('orange accent',await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()==='#ff6b00'));
 check('white button text',await p.$eval('.btn-primary',el=>getComputedStyle(el).color==='rgb(255, 255, 255)'));
 const {TOOLS}=await import('../src/data/tools.js');
 await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 for(const tool of TOOLS){
  await p.goto('http://localhost:4187/'+tool.slug,{waitUntil:'networkidle0'});
  check(`390 full tool route ${tool.slug}`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&!!document.querySelector('[data-testid=file-input],.workspace')));
 }
 console.log(passes,'premium checks passed');
}finally{await browser.close();server.kill()}
