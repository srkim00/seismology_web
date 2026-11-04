/* Geoelectricity teaching models. SI units throughout. No dependencies. */
(function(root){
'use strict';
const mu0=4*Math.PI*1e-7;
function potential(x,z,a,current,rho){const rA=Math.hypot(x+1.5*a,z),rB=Math.hypot(x-1.5*a,z);if(rA===0||rB===0)return NaN;return rho*current/(2*Math.PI)*(1/rA-1/rB)}
function wenner(a,current,rho){const vm=potential(-a/2,0,a,current,rho),vn=potential(a/2,0,a,current,rho),dv=vm-vn;return{vm,vn,dv,rhoa:2*Math.PI*a*dv/current}}
function twoLayer(a,rho1,rho2,h){
 if(!(a>0&&rho1>0&&rho2>0&&h>0))throw new RangeError('All parameters must be positive');
 const k=(rho2-rho1)/(rho2+rho1);let kn=k,sum=0,n=1;
 // |k| <= 0.9802 for the UI domain. A rigorous absolute tail bound is used.
 for(;n<=12000;n++){
  const t=4*n*n*h*h;
  const p=Math.sqrt(a*a+t),q=Math.sqrt(4*a*a+t);
  // Rationalized difference avoids cancellation at large n.
  const term=kn*3*a*a/(p*q*(p+q));sum+=term;
  const next=n+1,tail=4*a*Math.abs(kn*k)/(1-Math.abs(k))*3*a*a/(16*next*next*next*h*h*h);
  if(k===0||tail<1e-10)break;
  kn*=k;
 }
 return rho1*(1+4*a*sum);
}
function skinDepth(rho,f){return Math.sqrt(rho/(Math.PI*f*mu0))}
const api={mu0,potential,wenner,twoLayer,skinDepth};root.GeoMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
