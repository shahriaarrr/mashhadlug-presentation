const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const slides=$$(".sl"),nav=$("#nv"),count=$("#slide-count"),prev=$("#previous"),next=$("#next"),fullscreen=$("#fullscreen"),fullscreenStatus=$("#fullscreen-status"),glow=$("#gl");
const calm=matchMedia("(prefers-reduced-motion: reduce)"),root=document.documentElement.style;
const pg=document.createElement("div");pg.id="pg";pg.setAttribute("aria-hidden","true");document.body.prepend(pg);
let cur=-1;

/* JSON highlight */
const json=$("#js");
json.innerHTML=json.textContent
  .replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"})[c])
  .replace(/("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false)\b|(-?\d+\.?\d*)/g,(m,s,c,b,n)=>
    s?(c?`<i class="jk">${s}</i>${c}`:`<i class="js">${s}</i>`):b?`<i class="jb">${b}</i>`:`<i class="jn">${n}</i>`)
  .split(/\r?\n/).map((l,i)=>`<span class="jl" style="--i:${i}">${l||" "}</span>`).join("");

/* split paragraphs into words for the word-by-word reveal */
function splitWords(node,ctr){
  [...node.childNodes].forEach(n=>{
    if(n.nodeType===3){
      const f=document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t=>{
        if(!t)return;
        if(/^\s+$/.test(t)){f.append(t);return;}
        const w=document.createElement("span");
        w.className="w";w.style.setProperty("--w",ctr.n++);w.textContent=t;f.append(w);
      });
      n.replaceWith(f);
    }else if(n.nodeType===1&&n.tagName!=="BDI")splitWords(n,ctr);
    else if(n.nodeType===1){const w=document.createElement("span");w.className="w";w.style.setProperty("--w",ctr.n++);n.replaceWith(w);w.append(n);}
  });
}
$$(".tx").forEach(p=>{
  const ctr={n:0};splitWords(p,ctr);
  p.style.setProperty("--st",`${Math.min(34,1500/Math.max(ctr.n,1)).toFixed(1)}ms`);
});

/* stagger indices used by the CSS entrance choreography */
slides.forEach(s=>{
  let i=0;
  $$(".c > :not(.bl):not(.row)",s).forEach(e=>e.style.setProperty("--i",i++));
  $$(".bl li, .card, .os-card, .tech",s).forEach(e=>e.style.setProperty("--i",i++));
  $$(".pn, .ln, .st",s).forEach((e,j)=>e.style.setProperty("--j",j));
});

/* pointer tilt + glare on cards */
$$(".card,.os-card,.tech,.store-card").forEach(el=>{
  el.classList.add("tilt");
  el.addEventListener("pointermove",e=>{
    if(calm.matches||e.pointerType==="touch")return;
    const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    el.style.setProperty("--ry",`${((x-.5)*10).toFixed(2)}deg`);
    el.style.setProperty("--rx",`${((.5-y)*10).toFixed(2)}deg`);
    el.style.setProperty("--px",`${(x*100).toFixed(1)}%`);
    el.style.setProperty("--py",`${(y*100).toFixed(1)}%`);
  });
  el.addEventListener("pointerleave",()=>{el.style.setProperty("--rx","0deg");el.style.setProperty("--ry","0deg");});
});

slides.forEach((_,i)=>{
  const d=document.createElement("button");d.type="button";
  d.setAttribute("aria-label",`رفتن به اسلاید ${i+1}`);
  d.onclick=()=>go(i);nav.append(d);
});

function go(n){
  n=Math.max(0,Math.min(slides.length-1,n));
  if(n===cur)return;
  const dir=n>cur?-1:1,out=slides[cur],inn=slides[n];
  if(out){out.style.setProperty("--dx",-dir);out.classList.remove("on");}
  inn.style.setProperty("--dx",dir);
  if(+getComputedStyle(inn).opacity<.05){ /* snap to start pose only if it is not mid-fade */
    inn.classList.add("no-t");void inn.offsetWidth;inn.classList.remove("no-t");
  }
  cur=n;
  slides.forEach((s,i)=>{s.classList.toggle("on",i===n);s.setAttribute("aria-hidden",String(i!==n));});
  [...nav.children].forEach((d,i)=>i===n?d.setAttribute("aria-current","true"):d.removeAttribute("aria-current"));
  count.value=`${String(n+1).padStart(2,"0")} / ${String(slides.length).padStart(2,"0")}`;
  if(!calm.matches)count.animate([{opacity:.2,translate:"0 6px"},{opacity:1,translate:"0 0"}],{duration:450,easing:"cubic-bezier(.16,1,.3,1)"});
  prev.disabled=n===0;next.disabled=n===slides.length-1;
  pg.style.setProperty("--p",(n+1)/slides.length);
  glow.style.setProperty("--gx",`${20+((n*53)%70)}%`);
  glow.style.setProperty("--gy",`${25+((n*37)%50)}%`);
}

prev.onclick=()=>go(cur-1);next.onclick=()=>go(cur+1);

function syncFullscreenControl(){
  const active=document.fullscreenElement===document.documentElement;
  fullscreen.setAttribute("aria-pressed",String(active));
  fullscreen.setAttribute("aria-label",active?"خروج از حالت تمام‌صفحه":"نمایش تمام‌صفحه");
  fullscreen.title=active?"خروج از حالت تمام‌صفحه (Escape)":"نمایش تمام‌صفحه (F)";
}

async function toggleFullscreen(){
  fullscreenStatus.textContent="";
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }catch(error){
    console.error("Unable to change fullscreen mode:",error);
    fullscreenStatus.textContent="تغییر حالت تمام‌صفحه انجام نشد.";
  }
}

fullscreen.disabled=typeof document.documentElement.requestFullscreen!=="function";
fullscreen.addEventListener("click",toggleFullscreen);
document.addEventListener("fullscreenchange",syncFullscreenControl);
syncFullscreenControl();

addEventListener("keydown",e=>{
  if(e.key.toLowerCase()==="f"&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    e.preventDefault();toggleFullscreen();return;
  }
  let d=0;
  if(["ArrowLeft","ArrowDown","PageDown"," "].includes(e.key))d=1;
  if(["ArrowRight","ArrowUp","PageUp"].includes(e.key))d=-1;
  if(e.key==="Home"||e.key==="End"){e.preventDefault();return go(e.key==="Home"?0:slides.length-1);}
  if(!d||(e.key===" "&&e.target.closest("button")))return;
  e.preventDefault();go(cur+d);
});

let lock=0;
addEventListener("wheel",e=>{
  if(e.target.closest("pre")||Math.abs(e.deltaY)<8)return;
  e.preventDefault();
  if(Date.now()-lock<650)return;
  lock=Date.now();go(cur+(e.deltaY>0?-1:1));
},{passive:false});

let t0=null;
addEventListener("touchstart",e=>{t0={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
addEventListener("touchend",e=>{
  if(!t0)return;
  const dx=e.changedTouches[0].clientX-t0.x,dy=e.changedTouches[0].clientY-t0.y;t0=null;
  if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>45)go(cur+(dy<0?1:-1));
  else if(Math.abs(dx)>50)go(cur+(dx>0?1:-1));
});

/* eased mouse parallax (rAF lerp instead of jumpy CSS transition) */
let tx=0,ty=0,x=0,y=0,raf=0;
function tick(){
  x+=(tx-x)*.08;y+=(ty-y)*.08;
  root.setProperty("--mx",x.toFixed(4));root.setProperty("--my",y.toFixed(4));
  raf=Math.abs(tx-x)+Math.abs(ty-y)>.0005?requestAnimationFrame(tick):0;
}
addEventListener("mousemove",e=>{
  if(calm.matches)return;
  tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5;
  raf||(raf=requestAnimationFrame(tick));
});

slides.forEach((s,i)=>s.setAttribute("aria-hidden",String(i!==0)));
(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>go(0));
