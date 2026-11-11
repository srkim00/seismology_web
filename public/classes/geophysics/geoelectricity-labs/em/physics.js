/* Geoelectricity teaching models. SI internally. No external dependencies. */
(function(root){
'use strict';
const MU0=4*Math.PI*1e-7;
const c=(re,im=0)=>({re,im}),add=(a,b)=>c(a.re+b.re,a.im+b.im),sub=(a,b)=>c(a.re-b.re,a.im-b.im),mul=(a,b)=>c(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re),div=(a,b)=>{const d=b.re*b.re+b.im*b.im;return c((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d)},scale=(a,s)=>c(a.re*s,a.im*s),abs=a=>Math.hypot(a.re,a.im);
function tanh(z){if(z.re>20)return c(1,0);const d=Math.cosh(2*z.re)+Math.cos(2*z.im);return c(Math.sinh(2*z.re)/d,Math.sin(2*z.im)/d)}
function mt(period,rhos,hs,gain=1){
 if(!(period>0)||rhos.some(v=>!(v>0))||hs.some(v=>v<0)||rhos.length!==hs.length+1)throw Error('Invalid layered earth');
 const w=2*Math.PI/period;
 const eta=r=>c(Math.sqrt(w*MU0*r/2),Math.sqrt(w*MU0*r/2));
 let Z=eta(rhos.at(-1));
 for(let j=rhos.length-2;j>=0;j--){const e=eta(rhos[j]),k=Math.sqrt(w*MU0/(2*rhos[j])),t=tanh(c(k*hs[j],k*hs[j]));Z=mul(e,div(add(Z,mul(e,t)),add(e,mul(Z,t))))}
 Z=scale(Z,gain);
 return {Z,rho:abs(Z)**2/(w*MU0),phase:Math.atan2(Z.im,Z.re)*180/Math.PI};
}
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function mutual(p1,n1,A1,p2,n2,A2){const d=p2.map((v,i)=>v-p1[i]),r=Math.hypot(...d),u=d.map(x=>x/r);return MU0*A1*A2/(4*Math.PI*r**3)*(3*dot(n1,u)*dot(n2,u)-dot(n1,n2))}
function fdem(f,R,L,x,depth,tilt,separation=20){
 const t=tilt*Math.PI/180,n=[Math.sin(t),0,Math.cos(t)],T=[-separation/2,0,0],U=[separation/2,0,0],B=[x,0,-depth],z=[0,0,1];
 const Mtb=mutual(T,z,1,B,n,4),Mbr=mutual(B,n,4,U,z,1),Mtr=mutual(T,z,1,U,z,1);
 const C=-Mtb*Mbr/(L*Mtr),alpha=2*Math.PI*f*L/R;
 return {C,alpha,re:C*alpha**2/(1+alpha**2),im:C*alpha/(1+alpha**2),Mtb,Mbr,Mtr};
}
function tem(t,rho,momentRatio=1){return momentRatio*(100/rho)**1.5*(t/0.001)**(-2.5)}
function temGate(t1,t2,rho,momentRatio=1){const a=momentRatio*(100/rho)**1.5*0.001**2.5;return a*(t1**(-1.5)-t2**(-1.5))/(1.5*(t2-t1))}
function lateStart(rho,radius){return 10*MU0*radius**2/rho}
function diffusion(t,rho){return Math.sqrt(2*rho*t/MU0)}
function sheet(t,rho,h){const S=h/rho,tau=0.001*S;return {S,tau,current:Math.exp(-t/tau)}}
function logspace(a,b,n){return Array.from({length:n},(_,i)=>10**(a+(b-a)*i/(n-1)))}
const api={MU0,mt,mutual,fdem,tem,temGate,lateStart,diffusion,sheet,logspace,c,add,sub,mul,div,scale,abs,tanh};
root.EMPhysics=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
