import{r as a}from"./index-CPuQ00r0.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),h=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,o,s)=>s?s.toUpperCase():o.toLowerCase()),m=e=>{const t=h(e);return t.charAt(0).toUpperCase()+t.slice(1)},S=(...e)=>e.filter((t,o,s)=>!!t&&t.trim()!==""&&s.indexOf(t)===o).join(" ").trim();/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var v={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=a.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:o=2,absoluteStrokeWidth:s,className:c="",children:n,iconNode:f,...I},C)=>a.createElement("svg",{ref:C,...v,width:t,height:t,stroke:e,strokeWidth:s?Number(o)*24/Number(t):o,className:S("lucide",c),...I},[...f.map(([E,p])=>a.createElement(E,p)),...Array.isArray(n)?n:[n]]));/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=(e,t)=>{const o=a.forwardRef(({className:s,...c},n)=>a.createElement(L,{ref:n,iconNode:t,className:S(`lucide-${A(m(e))}`,`lucide-${e}`,s),...c}));return o.displayName=m(e),o},l="westend_admin_token",g="westend_admin_profile",i="westend_current_session_id",w="westend_current_session_cache",d="westend_last_result",r=()=>typeof window<"u",_=e=>{if(!r())return null;const t=window.localStorage.getItem(e);if(!t)return null;try{return JSON.parse(t)}catch{return window.localStorage.removeItem(e),null}},u=(e,t)=>{r()&&window.localStorage.setItem(e,JSON.stringify(t))},K=()=>r()?window.localStorage.getItem(l):null,O=(e,t)=>{r()&&(window.localStorage.setItem(l,e),u(g,t))},b=()=>{r()&&(window.localStorage.removeItem(l),window.localStorage.removeItem(g))},k=()=>r()?window.localStorage.getItem(i):null,T=e=>{r()&&(window.localStorage.setItem(i,e.sessionId),u(w,e))},x=()=>_(w),y=()=>{r()&&(window.localStorage.removeItem(i),window.localStorage.removeItem(w))},U=e=>{u(d,e)},Y=()=>_(d),J=()=>{r()&&window.localStorage.removeItem(d)};export{k as a,y as b,N as c,J as d,U as e,Y as f,x as g,K as h,O as i,b as j,T as s};
