import{r as l,j as e,C as F}from"./index-Bxug-FiQ.js";import{A as D}from"./AdminLayout-CGDoCLrY.js";import{l as I}from"./wednl-banner1-3-Hdyv1B1g.js";import{g as i,a as h,b as p,c as v,d as P}from"./reporting-CeExtDi_.js";import{C as B}from"./circle-alert-Cixcv3Ya.js";import{c as b}from"./ThemeToggle-BWAoK8r4.js";import{f as Y}from"./format-sbWH3_uq.js";import"./layout-dashboard-Zy5w5stN.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],g=b("chevron-down",U);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]],u=b("chevron-up",z);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],q=b("search",Q);function X(){const[r,w]=l.useState([]),[x,S]=l.useState(""),[y,A]=l.useState(null),[o,$]=l.useState("date"),[n,f]=l.useState("desc"),[C,j]=l.useState(!0),[N,R]=l.useState("");l.useEffect(()=>{(async()=>{j(!0);try{const d=await F({search:x||void 0,sortBy:o,sortOrder:n});w(d)}catch(d){R(d instanceof Error?d.message:"Unable to load results.")}finally{j(!1)}})()},[x,o,n]);const m=t=>{o===t?f(n==="asc"?"desc":"asc"):($(t),f("desc"))},_=t=>{A(y===t?null:t)},E=r.length>0?(r.reduce((t,d)=>t+i(d),0)/r.length).toFixed(1):"0.0",L=()=>{if(!r.length)return;const t=["Name","Surname","UIN","Academic Year","Score","Total Questions","Percentage","Status","Section Breakdown","Completed At"],d=r.map(a=>{const s=i(a).toFixed(1);return[a.name,a.surname,a.uin,a.academicYear||h(a.completedAt),a.totalScore.toString(),a.totalQuestions.toString(),`${s}%`,p(a),v(a),new Date(a.completedAt).toLocaleString()]});P("admin-results.csv",t,d)},T=()=>{if(!r.length)return;const t=window.open("","_blank");if(!t)return;const d=r.map(s=>{const c=i(s).toFixed(1);return`<tr>
          <td>${s.name} ${s.surname}</td>
          <td>${s.uin}</td>
          <td>${s.academicYear||h(s.completedAt)}</td>
          <td>${s.totalScore}/${s.totalQuestions}</td>
          <td>${c}%</td>
          <td>${p(s)}</td>
          <td>${v(s)}</td>
          <td>${new Date(s.completedAt).toLocaleString()}</td>
        </tr>`}).join(""),a=r.reduce((s,c)=>s+i(c),0)/r.length;t.document.write(`
      <html>
        <head>
          <title>Results Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 22px; }
            .pill { display: inline-block; margin-right: 8px; padding: 6px 10px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f8fafc; }
            footer { margin-top: 24px; font-size: 12px; color: #475569; }
          </style>
        </head>
        <body>
          <header>
            <img src="${I}" alt="Academy Logo" style="height:60px;border-radius:8px;" />
            <div>
              <h1>Results Report</h1>
              <div>
                <span class="pill">Total Tests: ${r.length}</span>
                <span class="pill">Avg Score: ${a.toFixed(1)}%</span>
              </div>
            </div>
          </header>
          <table>
            <thead>
              <tr>
                <th>Learner</th>
                <th>UIN</th>
                <th>Academic Year</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Section Breakdown</th>
                <th>Completed At</th>
              </tr>
            </thead>
            <tbody>${d}</tbody>
          </table>
          <footer>Generated on ${new Date().toLocaleString()} | Westend Diamond Training Academy CBT</footer>
          <script>window.print();<\/script>
        </body>
      </html>
    `),t.document.close()};return e.jsx(D,{children:e.jsxs("div",{children:[e.jsxs("div",{className:"flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl",children:"Test Results"}),e.jsxs("div",{className:"text-sm text-gray-600 dark:text-slate-400",children:["Total Tests: ",r.length," | Average Score: ",E,"%"]})]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx("button",{onClick:L,className:"rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",children:"Export CSV"}),e.jsx("button",{onClick:T,className:"rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700",children:"Export PDF"})]})]}),N?e.jsxs("div",{className:"mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",children:[e.jsx(B,{className:"mt-0.5 h-5 w-5 flex-shrink-0"}),e.jsx("span",{children:N})]}):null,e.jsx("div",{className:"mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]",children:e.jsxs("div",{className:"relative",children:[e.jsx(q,{className:"absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500"}),e.jsx("input",{type:"text",value:x,onChange:t=>S(t.target.value),placeholder:"Search by name, surname, or UIN...",className:"w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-transparent focus:ring-2 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-400"})]})}),e.jsx("div",{className:"overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-900/80 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"border-b border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900/90",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsxs("button",{onClick:()=>m("name"),className:"flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200",children:["Student",o==="name"&&(n==="asc"?e.jsx(u,{className:"w-4 h-4"}):e.jsx(g,{className:"w-4 h-4"}))]})}),e.jsx("th",{className:"px-4 py-3 text-left",children:"UIN"}),e.jsx("th",{className:"px-4 py-3 text-left",children:"Academic Year"}),e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsxs("button",{onClick:()=>m("score"),className:"flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200",children:["Score",o==="score"&&(n==="asc"?e.jsx(u,{className:"w-4 h-4"}):e.jsx(g,{className:"w-4 h-4"}))]})}),e.jsx("th",{className:"px-4 py-3 text-left",children:"Percentage"}),e.jsx("th",{className:"px-4 py-3 text-left",children:"Status"}),e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsxs("button",{onClick:()=>m("date"),className:"flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200",children:["Completed",o==="date"&&(n==="asc"?e.jsx(u,{className:"w-4 h-4"}):e.jsx(g,{className:"w-4 h-4"}))]})}),e.jsx("th",{className:"px-4 py-3 text-left",children:"Details"})]})}),e.jsx("tbody",{className:"divide-y divide-gray-200 dark:divide-slate-800",children:C?e.jsx("tr",{children:e.jsx("td",{colSpan:8,className:"px-4 py-8 text-center text-gray-500 dark:text-slate-400",children:"Loading results..."})}):r.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:8,className:"px-4 py-8 text-center text-gray-500 dark:text-slate-400",children:x?"No results found":"No test results available"})}):r.map(t=>{const d=i(t).toFixed(1),a=y===t.id;return e.jsxs(l.Fragment,{children:[e.jsxs("tr",{className:"hover:bg-gray-50 dark:hover:bg-slate-900/70",children:[e.jsxs("td",{className:"px-4 py-3",children:[t.name," ",t.surname]}),e.jsx("td",{className:"px-4 py-3 font-mono text-sm",children:t.uin}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-600 dark:text-slate-400",children:t.academicYear||h(t.completedAt)}),e.jsxs("td",{className:"px-4 py-3",children:[t.totalScore,"/",t.totalQuestions]}),e.jsx("td",{className:"px-4 py-3",children:e.jsxs("span",{className:`px-2 py-1 rounded-full text-sm ${parseFloat(d)>=50?"bg-green-100 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-200":"bg-red-100 text-red-700 dark:bg-rose-500/10 dark:text-rose-200"}`,children:[d,"%"]})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200",children:p(t)}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-600 dark:text-slate-400",children:Y(new Date(t.completedAt),"MMM dd, yyyy HH:mm")}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("button",{onClick:()=>_(t.id),className:"text-sm text-blue-600 hover:text-blue-700 dark:text-cyan-300 dark:hover:text-cyan-200",children:a?"Hide":"Show"})})]},t.id),a&&e.jsx("tr",{children:e.jsx("td",{colSpan:8,className:"bg-gray-50 px-4 py-4 dark:bg-slate-900/70",children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm mb-3",children:"Section Breakdown:"}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3",children:t.sectionResults.map((s,c)=>{const k=(s.percentage??(s.total?s.score/s.total*100:0)).toFixed(0);return e.jsxs("div",{className:"rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("span",{className:"text-sm",children:s.section}),e.jsxs("span",{className:"text-sm",children:[s.score,"/",s.total]})]}),e.jsx("div",{className:"h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800",children:e.jsx("div",{className:"h-full bg-indigo-600 dark:bg-cyan-400",style:{width:`${k}%`}})}),e.jsxs("div",{className:"mt-1 text-right text-xs text-gray-600 dark:text-slate-400",children:[k,"%"]})]},c)})})]})})})]},t.id)})})]})})})]})})}export{X as default};
