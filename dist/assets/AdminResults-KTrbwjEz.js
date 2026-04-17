import{r as d,j as e}from"./index-CPuQ00r0.js";import{A as D}from"./AdminLayout-Un8ZrDj_.js";import{l as I}from"./wednl-banner1-3-Hdyv1B1g.js";import{C as P,j as B}from"./api--DFr5DFa.js";import{g as i,a as h,b as p,c as w,d as Y}from"./reporting-CeExtDi_.js";import{c as y}from"./clientState-DQZfnreL.js";import{f as _}from"./format-sbWH3_uq.js";import"./layout-dashboard-i-pYBANg.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],g=y("chevron-down",U);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]],u=y("chevron-up",z);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],q=y("search",Q);function X(){const[l,S]=d.useState([]),[x,A]=d.useState(""),[f,$]=d.useState(null),[n,k]=d.useState("date"),[o,j]=d.useState("desc"),[C,b]=d.useState(!0),[N,R]=d.useState("");d.useEffect(()=>{(async()=>{b(!0);try{const r=await B({search:x||void 0,sortBy:n,sortOrder:o});S(r)}catch(r){R(r instanceof Error?r.message:"Unable to load results.")}finally{b(!1)}})()},[x,n,o]);const m=t=>{n===t?j(o==="asc"?"desc":"asc"):(k(t),j("desc"))},E=t=>{$(f===t?null:t)},L=l.length>0?(l.reduce((t,r)=>t+i(r),0)/l.length).toFixed(1):"0.0",T=()=>{if(!l.length)return;const t=["Name","Surname","UIN","Academic Year","Score","Total Questions","Percentage","Status","Section Breakdown","Completed At"],r=l.map(a=>{const s=i(a).toFixed(1);return[a.name,a.surname,a.uin,a.academicYear||h(a.completedAt),a.totalScore.toString(),a.totalQuestions.toString(),`${s}%`,p(a),w(a),new Date(a.completedAt).toLocaleString()]});Y("admin-results.csv",t,r)},F=()=>{if(!l.length)return;const t=window.open("","_blank");if(!t)return;const r=l.map(s=>{const c=i(s).toFixed(1);return`<tr>
          <td>${s.name} ${s.surname}</td>
          <td>${s.uin}</td>
          <td>${s.academicYear||h(s.completedAt)}</td>
          <td>${s.totalScore}/${s.totalQuestions}</td>
          <td>${c}%</td>
          <td>${p(s)}</td>
          <td>${w(s)}</td>
          <td>${new Date(s.completedAt).toLocaleString()}</td>
        </tr>`}).join(""),a=l.reduce((s,c)=>s+i(c),0)/l.length;t.document.write(`
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
                <span class="pill">Total Tests: ${l.length}</span>
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
            <tbody>${r}</tbody>
          </table>
          <footer>Generated on ${new Date().toLocaleString()} | Westend Diamond Training Academy CBT</footer>
          <script>window.print();<\/script>
        </body>
      </html>
    `),t.document.close()};return e.jsx(D,{children:e.jsxs("div",{children:[e.jsxs("div",{className:"flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl",children:"Test Results"}),e.jsxs("div",{className:"text-sm text-gray-600",children:["Total Tests: ",l.length," | Average Score: ",L,"%"]})]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx("button",{onClick:T,className:"rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50",children:"Export CSV"}),e.jsx("button",{onClick:F,className:"rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700",children:"Export PDF"})]})]}),N?e.jsxs("div",{className:"mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",children:[e.jsx(P,{className:"mt-0.5 h-5 w-5 flex-shrink-0"}),e.jsx("span",{children:N})]}):null,e.jsx("div",{className:"bg-white rounded-lg shadow-sm mb-6 p-4",children:e.jsxs("div",{className:"relative",children:[e.jsx(q,{className:"absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"}),e.jsx("input",{type:"text",value:x,onChange:t=>A(t.target.value),placeholder:"Search by name, surname, or UIN...",className:"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"})]})}),e.jsx("div",{className:"bg-white rounded-lg shadow-sm overflow-hidden",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-gray-50 border-b border-gray-200",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsxs("button",{onClick:()=>m("name"),className:"flex items-center gap-1 hover:text-slate-700",children:["Student",n==="name"&&(o==="asc"?e.jsx(u,{className:"w-4 h-4"}):e.jsx(g,{className:"w-4 h-4"}))]})}),e.jsx("th",{className:"px-4 py-3 text-left",children:"UIN"}),e.jsx("th",{className:"px-4 py-3 text-left",children:"Academic Year"}),e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsxs("button",{onClick:()=>m("score"),className:"flex items-center gap-1 hover:text-slate-700",children:["Score",n==="score"&&(o==="asc"?e.jsx(u,{className:"w-4 h-4"}):e.jsx(g,{className:"w-4 h-4"}))]})}),e.jsx("th",{className:"px-4 py-3 text-left",children:"Percentage"}),e.jsx("th",{className:"px-4 py-3 text-left",children:"Status"}),e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsxs("button",{onClick:()=>m("date"),className:"flex items-center gap-1 hover:text-slate-700",children:["Completed",n==="date"&&(o==="asc"?e.jsx(u,{className:"w-4 h-4"}):e.jsx(g,{className:"w-4 h-4"}))]})}),e.jsx("th",{className:"px-4 py-3 text-left",children:"Details"})]})}),e.jsx("tbody",{className:"divide-y divide-gray-200",children:C?e.jsx("tr",{children:e.jsx("td",{colSpan:8,className:"px-4 py-8 text-center text-gray-500",children:"Loading results..."})}):l.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:8,className:"px-4 py-8 text-center text-gray-500",children:x?"No results found":"No test results available"})}):l.map(t=>{const r=i(t).toFixed(1),a=f===t.id;return e.jsxs(d.Fragment,{children:[e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsxs("td",{className:"px-4 py-3",children:[t.name," ",t.surname]}),e.jsx("td",{className:"px-4 py-3 font-mono text-sm",children:t.uin}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-600",children:t.academicYear||h(t.completedAt)}),e.jsxs("td",{className:"px-4 py-3",children:[t.totalScore,"/",t.totalQuestions]}),e.jsx("td",{className:"px-4 py-3",children:e.jsxs("span",{className:`px-2 py-1 rounded-full text-sm ${parseFloat(r)>=50?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`,children:[r,"%"]})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-slate-700",children:p(t)}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-600",children:_(new Date(t.completedAt),"MMM dd, yyyy HH:mm")}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("button",{onClick:()=>E(t.id),className:"text-blue-600 hover:text-blue-700 text-sm",children:a?"Hide":"Show"})})]},t.id),a&&e.jsx("tr",{children:e.jsx("td",{colSpan:8,className:"px-4 py-4 bg-gray-50",children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"text-sm mb-3",children:"Section Breakdown:"}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3",children:t.sectionResults.map((s,c)=>{const v=(s.percentage??(s.total?s.score/s.total*100:0)).toFixed(0);return e.jsxs("div",{className:"bg-white rounded-lg p-3 border border-gray-200",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("span",{className:"text-sm",children:s.section}),e.jsxs("span",{className:"text-sm",children:[s.score,"/",s.total]})]}),e.jsx("div",{className:"bg-gray-200 rounded-full h-2 overflow-hidden",children:e.jsx("div",{className:"bg-indigo-600 h-full",style:{width:`${v}%`}})}),e.jsxs("div",{className:"text-xs text-gray-600 mt-1 text-right",children:[v,"%"]})]},c)})})]})})})]},t.id)})})]})})})]})})}export{X as default};
