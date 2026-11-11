/* Pure forward models. Units documented in each function. No external dependency. */
(function(root){
'use strict';
const P={};
P.archie=({phi,sw,rhow,m=2,n=2,a=1,surface=0})=>{const pore=phi**m*sw**n/(a*rhow),sigma=pore+surface;return{pore,sigma,rho:1/sigma};};
P.sp=(x,{h=12,moment=15000,angle=0,x0=0})=>moment*(Math.sin(angle*Math.PI/180)*(x-x0)+Math.cos(angle*Math.PI/180)*h)/((x-x0)**2+h*h)**1.5;
P.spSurvey=(p,offset=1,drift=.1)=>{const xs=Array.from({length:21},(_,i)=>-50+5*i),truth=xs.map(x=>P.sp(x,p)-P.sp(xs[0],p)),N=xs.length;const base=truth.map((v,i)=>v+offset+drift*i),baseCorrected=base.map((v,i)=>v-offset-drift*i);let sum=0;const grad=[0];for(let i=1;i<N;i++){sum+=truth[i]-truth[i-1]+offset+drift*i;grad.push(sum);}const closure=sum-truth[N-1]+offset+drift*N;const gradCorrected=grad.map((v,i)=>v-i/N*closure);return{xs,truth,base,baseCorrected,grad,gradCorrected,closure,baseStart:offset,baseEnd:offset+drift*N};};
P.electrodes=(array,a)=>array==='schlumberger'?{A:-a,B:a,M:-.5,N:.5}:array==='dipole'?{A:-2.5*a,B:-1.5*a,M:1.5*a,N:2.5*a}:{A:-1.5*a,B:1.5*a,M:-.5*a,N:.5*a};
P.geometry=e=>1/Math.abs(e.M-e.A)-1/Math.abs(e.M-e.B)-1/Math.abs(e.N-e.A)+1/Math.abs(e.N-e.B);
P.dc=(r1,r2,h,e,I=.05)=>{const rs=[Math.abs(e.M-e.A),Math.abs(e.M-e.B),Math.abs(e.N-e.A),Math.abs(e.N-e.B)],sign=[1,-1,-1,1];if(rs.some(r=>r<1e-8))throw new Error('Current and potential electrodes coincide');const D=rs.reduce((s,r,i)=>s+sign[i]/r,0);if(Math.abs(D)<1e-15)throw new Error('Zero geometry factor denominator');let g=D,k=(r2-r1)/(r2+r1),kn=1,nterm=0;for(let j=1;j<=2000;j++){kn*=k;let s=0,z=2*j*h;for(let i=0;i<4;i++)s+=sign[i]/Math.hypot(rs[i],z);g+=2*kn*s;nterm=j;if(Math.abs(kn)<1e-12)break;}const K=2*Math.PI/D,V=r1*I/(2*Math.PI)*g;return{rho:K*V/I,V,K,terms:nterm};};
P.logspace=(a,b,n)=>Array.from({length:n},(_,i)=>a*(b/a)**(i/(n-1)));
P.noiseSequence=n=>{let seed=17373;const uni=()=>{seed=(1664525*seed+1013904223)>>>0;return(seed+.5)/4294967296;};return Array.from({length:n},()=>Math.sqrt(-2*Math.log(uni()))*Math.cos(2*Math.PI*uni()));};
P.dcData=(r1,r2,h,array,amax,noise)=>{const noiseSeq=P.noiseSequence(24);return P.logspace(1,amax,24).map((a,i)=>{const trueR=P.dc(r1,r2,h,P.electrodes(array,a)).rho;return{a,trueR,rho:trueR*(1+noise/100*noiseSeq[i]),error:trueR*noise/100};});};
P.misfit=(r1,r2,h,array,data)=>Math.sqrt(data.reduce((s,d)=>s+((P.dc(r1,r2,h,P.electrodes(array,d.a)).rho-d.rho)/d.error)**2,0)/data.length);
P.primaryFactor=({m1=.04,t1=.03,m2=.02,t2=.5,on=4})=>1-m1*Math.exp(-on/t1)-m2*Math.exp(-on/t2);
P.ip=(t,p)=>{const{m1=.04,t1=.03,m2=.02,t2=.5,on=4}=p;return(m1*(-Math.expm1(-on/t1))*Math.exp(-t/t1)+m2*(-Math.expm1(-on/t2))*Math.exp(-t/t2))/P.primaryFactor(p);};
P.ipArea=(start,end,p)=>(p.m1*(-Math.expm1(-p.on/p.t1))*p.t1*(Math.exp(-start/p.t1)-Math.exp(-end/p.t1))+p.m2*(-Math.expm1(-p.on/p.t2))*p.t2*(Math.exp(-start/p.t2)-Math.exp(-end/p.t2)))/P.primaryFactor(p);
P.ipEquivalent=(start,end,p)=>{const t=Math.max(.1,2*p.t2),target=P.ipArea(start,end,p),b=Math.exp(-p.on/t),A=(1-b)*t*(Math.exp(-start/t)-Math.exp(-end/t));return{m1:target/(A+target*b),t1:t,m2:0,t2:1,on:p.on};};
if(typeof module!=='undefined'&&module.exports)module.exports=P;else root.GeoPhysics=P;
})(typeof window!=='undefined'?window:globalThis);
