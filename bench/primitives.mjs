// Cost of the primitives the event path is built from (Node): node bench/primitives.mjs
const N=500000;
const time=(name,fn)=>{for(let i=0;i<20000;i++)fn(i);const t=performance.now();for(let i=0;i<N;i++)fn(i);console.log(name.padEnd(34),(((performance.now()-t)*1e6)/N).toFixed(0),'ns')};
const wm=new WeakMap(), m=new Map(); let keep=[];
time('new WeakRef(obj)',i=>{const o={};new WeakRef(o)});
time('WeakMap.set(obj,rec)',i=>{const o={};wm.set(o,{kind:1})});
time('Map.set(id,rec)+delete old',i=>{m.set(i,{});m.delete(i-1000)});
time('obj literal 8 fields',i=>({type:'x',id:i,label:'a',sizeBytes:16,usage:i,a:1,b:2,c:3}));
time('freeze obj 8 fields',i=>Object.freeze({type:'x',id:i,label:'a',sizeBytes:16,usage:i,a:1,b:2,c:3}));
time('performance.now()',i=>performance.now());
const est=(v)=>{switch(typeof v){case'string':return 16+v.length*2;case'number':return 8;case'object':{if(v===null)return 4;let b=32;for(const k in v)b+=8+est(v[k]);return b}default:return 4}};
const ev={v:2,seq:1,t:1,type:'resource-materialized',resource:'buffer',id:1,label:'a',sizeBytes:16,usage:140};
time('estimate bytes (9 fields)',i=>est(ev));
time('for-in deepFreeze-like (fresh)',i=>{const o={v:2,seq:1,t:1,type:'x',resource:'buffer',id:i,label:'a',sizeBytes:16,usage:140};Object.freeze(o);for(const k in o){}});
const arr=[];time('array push+shift-ish',i=>{arr.push(i);if(arr.length>256)arr.splice(0,1)});
