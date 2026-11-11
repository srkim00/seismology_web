(function(root){'use strict';
const $=id=>document.getElementById(id),val=id=>+$ (id).value,fmt=(x,d=3)=>{if(!Number.isFinite(x))return '—';if(x===0)return '0';return Math.abs(x)>=10000||Math.abs(x)<0.001?x.toExponential(2):+x.toPrecision(d)+''};
function range(id,label,min,max,step,init,unit='',log=false,note=''){return `<div class="control"><label for="${id}">${label}<output id="${id}-out"></output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${log?'any':step}" value="${init}" data-unit="${unit}" ${log?'data-log="1"':''}>${note?`<small>${note}</small>`:''}</div>`}
function sync(){document.querySelectorAll('input[type=range]').forEach(e=>{const v=e.dataset.log?10**(+e.value):+e.value;const out=$(e.id+'-out');if(out)out.textContent=fmt(v)+' '+(e.dataset.unit||'')})}
function actual(id){return $(id).dataset.log?10**val(id):val(id)}
function set(id,value){$(id).value=$(id).dataset.log?Math.log10(value):value}
function canvas(id){const el=$(id),rect=el.getBoundingClientRect(),dpr=window.devicePixelRatio||1;el.width=Math.round(rect.width*dpr);el.height=Math.round(rect.height*dpr);const ctx=el.getContext('2d');ctx.scale(dpr,dpr);return {el,ctx,w:rect.width,h:rect.height}}
function ticks(a,b,log){if(log){let out=[];for(let e=Math.ceil(Math.log10(a));e<=Math.floor(Math.log10(b));e++)out.push(10**e);return out}const span=b-a,raw=span/5,p=10**Math.floor(Math.log10(raw)),q=raw/p,k=q>5?10:q>2?5:q>1?2:1,s=p*k,out=[];for(let x=Math.ceil(a/s)*s;x<=b+1e-9;x+=s)out.push(x);return out}
function label(x){if(x===0)return '0';if(Math.abs(x)<.01||Math.abs(x)>=10000)return x.toExponential(0);return +(x.toPrecision(3))+''}
function plot(id,series,o={}){const {ctx,w,h}=canvas(id),L=65,R=20,T=22,B=52,pw=w-L-R,ph=h-T-B;
 const all=series.flatMap(s=>s.data).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])&&(!o.logX||p[0]>0)&&(!o.logY||p[1]>0));
 let xmin=o.xmin??Math.min(...all.map(p=>p[0])),xmax=o.xmax??Math.max(...all.map(p=>p[0])),ymin=o.ymin??Math.min(...all.map(p=>p[1])),ymax=o.ymax??Math.max(...all.map(p=>p[1]));
 if(ymin===ymax){ymin-=1;ymax+=1}if(!o.logY&&o.ymin==null){const r=(ymax-ymin)*.12;ymin-=r;ymax+=r}
 const tx=x=>o.logX?Math.log10(x):x,ty=y=>o.logY?Math.log10(y):y,px=x=>L+(tx(x)-tx(xmin))/(tx(xmax)-tx(xmin))*pw,py=y=>T+ph-(ty(y)-ty(ymin))/(ty(ymax)-ty(ymin))*ph;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.font='12px -apple-system,BlinkMacSystemFont,sans-serif';ctx.lineWidth=1;
 for(const x of ticks(xmin,xmax,o.logX)){ctx.strokeStyle='#e4eaec';ctx.beginPath();ctx.moveTo(px(x),T);ctx.lineTo(px(x),T+ph);ctx.stroke();ctx.fillStyle='#536977';ctx.textAlign='center';ctx.fillText(label(x),px(x),T+ph+20)}
 for(const y of ticks(ymin,ymax,o.logY)){ctx.strokeStyle='#e4eaec';ctx.beginPath();ctx.moveTo(L,py(y));ctx.lineTo(L+pw,py(y));ctx.stroke();ctx.fillStyle='#536977';ctx.textAlign='right';ctx.fillText(label(y),L-8,py(y)+4)}
 ctx.save();ctx.beginPath();ctx.rect(L,T,pw,ph);ctx.clip();
 (o.bands||[]).forEach(b=>{ctx.fillStyle=b.color||'#e8eef099';const x1=px(Math.max(xmin,b.from)),x2=px(Math.min(xmax,b.to));ctx.fillRect(x1,T,x2-x1,ph)});
 (o.hlines||[]).forEach(v=>{ctx.strokeStyle=v.color||'#777';ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(L,py(v.y));ctx.lineTo(L+pw,py(v.y));ctx.stroke();ctx.setLineDash([])});
 for(const s of series){ctx.strokeStyle=s.color||'#1966ad';ctx.fillStyle=s.color||'#1966ad';ctx.lineWidth=s.width||2.2;ctx.setLineDash(s.dash||[]);if(!s.points){ctx.beginPath();let moved=false;for(const p of s.data){if(!Number.isFinite(p[1])||(o.logY&&p[1]<=0)){moved=false;continue}if(moved)ctx.lineTo(px(p[0]),py(p[1]));else{ctx.moveTo(px(p[0]),py(p[1]));moved=true}}ctx.stroke()}else{for(const p of s.data){if(!Number.isFinite(p[1])||(o.logY&&p[1]<=0))continue;ctx.beginPath();ctx.arc(px(p[0]),py(p[1]),s.radius||3.5,0,2*Math.PI);if(s.hollow){ctx.fillStyle='#fff';ctx.fill();ctx.stroke()}else ctx.fill()}}ctx.setLineDash([])}
 (o.vlines||[]).forEach(v=>{ctx.strokeStyle=v.color||'#647b85';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(px(v.x),T);ctx.lineTo(px(v.x),T+ph);ctx.stroke();ctx.setLineDash([])});
 ctx.restore();ctx.strokeStyle='#7b919a';ctx.strokeRect(L,T,pw,ph);ctx.fillStyle='#253f4d';ctx.textAlign='center';ctx.font='13px -apple-system,BlinkMacSystemFont,sans-serif';ctx.fillText(o.xlabel||'',L+pw/2,h-12);ctx.save();ctx.translate(15,T+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText(o.ylabel||'',0,0);ctx.restore();return{px,py,ctx,L,T,pw,ph,w,h}}
function download(name,rows){const b=new Blob(['\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)}
function listen(fn){document.querySelectorAll('input[type=range],select,input[type=checkbox]').forEach(e=>e.addEventListener('input',()=>{sync();fn()}));window.addEventListener('resize',fn);sync()}
root.EMUI={$ ,val,fmt,range,sync,actual,set,canvas,plot,download,listen};
})(globalThis);
