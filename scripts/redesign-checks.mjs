import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const server=spawn('node',['scripts/security-preview.mjs'],{stdio:'ignore',env:{...process.env,PORT:'4184'}});
await sleep(500);
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4']});
const failures=[]; let passes=0;
const check=(name,cond)=>{console.log(`${cond?'PASS':'FAIL'} ${name}`);cond?passes++:failures.push(name);};
try {
 const p=await browser.newPage(); await p.setViewport({width:1440,height:900});
 const errors=[]; p.on('pageerror',e=>errors.push(e.message));
 await p.evaluateOnNewDocument(()=>document.addEventListener('securitypolicyviolation',e=>{(window.__csp ||= []).push(e.violatedDirective)}));
 const res=await p.goto('http://localhost:4184/',{waitUntil:'domcontentloaded'});
 check('CSP header delivered locally',res.headers()['content-security-policy']?.includes("frame-ancestors 'none'"));
 await p.waitForSelector('.intro-loader');
 await p.screenshot({path:'screenshots/desktop-loader.png'});
 check('opening loader present',!!await p.$('.intro-loader'));
 check('background inert while opening',await p.$eval('main',el=>el.inert));
 await p.waitForFunction(()=>document.querySelector('.intro-scene')?.classList.contains('is-lol'));
 await p.screenshot({path:'screenshots/desktop-loader-lol.png'});
 await p.waitForFunction(()=>!document.querySelector('.intro-loader'),{timeout:10000});
 check('opening loader completes',!await p.$('.intro-loader'));
 check('background restored after opening',await p.$eval('main',el=>!el.inert));
 await p.mouse.move(700,310);await sleep(150);
 check('happy-file cursor shown',await p.$eval('.cursor-file',el=>el.getBoundingClientRect().width>0));
 await p.reload({waitUntil:'networkidle0'});
 check('intro not replayed on same-session reload',!await p.$('.intro-loader'));
 await p.keyboard.down('Control');await p.keyboard.press('k');await p.keyboard.up('Control');
 await p.waitForSelector('.palette-input input');await p.type('.palette-input input','background');
 check('Ctrl K search filters tools',await p.$$eval('.palette-list [role=option]',els=>els.length===1));
 await p.keyboard.press('Enter');await p.waitForFunction(()=>location.pathname==='/remove-background');
 check('search selection opens correct tool',new URL(p.url()).pathname==='/remove-background');
 check('no AI labels in visible copy',!await p.evaluate(()=>/\bAI\b|AI-powered|artificial intelligence|seamless|leverage|delve|revolutionary/i.test(document.body.innerText)));
 const routes=['/','/tools','/privacy','/merge-pdf','/compress-pdf','/organize-pdf','/remove-background','/passport-photo-maker','/qr-code-generator'];
 for(const w of [320,390,768,1440]) {
  await p.setViewport({width:w,height:844});
  for(const route of routes) {
   await p.goto('http://localhost:4184'+route,{waitUntil:'networkidle0'});
   check(`no horizontal overflow ${w} ${route}`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   check(`no AI labels ${w} ${route}`,!await p.evaluate(()=>/\bAI\b|AI-powered|artificial intelligence|seamless|leverage|delve|revolutionary/i.test(document.body.innerText)));
  }
 }
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await p.goto('http://localhost:4184/',{waitUntil:'networkidle0'});
 check('cursor hidden on touch with reduced-motion preference',await p.$eval('.cursor-ring',el=>getComputedStyle(el).display==='none'));
 await p.click('.menu-btn');check('mobile menu opens',await p.$eval('.nav',el=>el.classList.contains('is-open')));
 await p.click('.nav a[href="/tools"]');check('mobile menu closes after selection',await p.$eval('.nav',el=>!el.classList.contains('is-open')));
 const reduced=await browser.newPage();await reduced.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await reduced.goto('http://localhost:4184/',{waitUntil:'networkidle0'});
 check('intro skipped for reduced motion',!await reduced.$('.intro-loader'));
 check('cursor hidden for reduced motion',await reduced.$eval('.cursor-ring',el=>getComputedStyle(el).display==='none'));
 check('no runtime errors',errors.length===0);
 check('no CSP violations during UI checks',(await p.evaluate(()=>window.__csp||[])).length===0);
 await reduced.close();await p.close();
 console.log(`${passes} passed, ${failures.length} failed`);
} finally {await browser.close();server.kill();}
if(failures.length) process.exit(1);
