'use strict';
const $=id=>document.getElementById(id);
const C={ink:'#172c43',muted:'#526477',red:'#87263e',blue:'#157b98',green:'#327c69',line:'#d4dde5'};
const fmt=(n,d=1)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:d});
function txt(x,y,t,attrs=''){return `<text x="${x}" y="${y}" ${attrs}>${t}</text>`}
function line(x1,y1,x2,y2,color=C.line,w=1,extra=''){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${extra}/>`}
function path(points,color,w=4,extra=''){return `<path d="${points.map((p,i)=>(i?'L':'M')+p.map(x=>x.toFixed(2)).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>`}
function svg(content,w,h,label){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${content}</svg>`}
function bind(ids,update){ids.forEach(id=>$(id).addEventListener('input',update));update()}
function set(ids,vals,update){ids.forEach((id,i)=>$(id).value=vals[i]);update()}
