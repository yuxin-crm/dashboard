(function(){
'use strict';
const D=window.YX_DATA;
const K={}; D.keys.forEach((k,i)=>K[k]=i);
const OTHER=new Set(['坤侑貿易','無保養紀錄','新車補償中心','他經銷商保養','撫遠鈑噴中心','鈑噴中心','未分廠']);
const branchNames=Object.keys(D.branches).sort((a,b)=>(OTHER.has(a)-OTHER.has(b))||D.branches[b][0]-D.branches[a][0]);
const realBranches=branchNames.filter(b=>!OTHER.has(b));
const months=[...new Set(Object.keys(D.brMonth).map(k=>k.split('|')[1]))].sort();

// ---------- format ----------
const fmt=n=>Math.round(n||0).toLocaleString('zh-TW');
const pct=(a,b)=>b?a/b*100:0;
const p1=x=>x.toFixed(1)+'%';
const money=n=>n>=1e8?(n/1e8).toFixed(2)+' 億':n>=1e4?fmt(n/1e4)+' 萬':fmt(n);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const v=(row,k)=>row?row[K[k]]||0:0;
const sum=(rows,k)=>rows.reduce((a,r)=>a+v(r,k),0);

// ---------- metrics ----------
const M={
  veh:{l:'車輛數',f:r=>v(r,'veh')},
  r_act:{l:'活躍（≤180 天）',f:r=>v(r,'r_act')},
  act_rate:{l:'活躍率',f:r=>pct(v(r,'r_act'),v(r,'veh')),rate:1},
  r_dorm:{l:'沉睡（181～365 天）',f:r=>v(r,'r_dorm')},
  r_churn:{l:'流失風險（>365 天）',f:r=>v(r,'r_churn')},
  churn_rate:{l:'流失率',f:r=>pct(v(r,'r_churn'),v(r,'veh')),rate:1},
  contactable:{l:'可聯絡',f:r=>v(r,'contactable')},
  contact_rate:{l:'可聯絡率',f:r=>pct(v(r,'contactable'),v(r,'veh')),rate:1},
  w_in:{l:'保固內',f:r=>v(r,'w_in')},
  w_30:{l:'保固 30 天內到期',f:r=>v(r,'w_30')},
  w_90:{l:'保固 31～90 天到期',f:r=>v(r,'w_90')},
  w_180all:{l:'保固 180 天內到期',f:r=>v(r,'w_30')+v(r,'w_90')+v(r,'w_180')},
  w_km80:{l:'保固內 ≥80,000 km',f:r=>v(r,'w_km80')+v(r,'w_km90')+v(r,'w_km95')},
  w_km90:{l:'保固內 ≥90,000 km',f:r=>v(r,'w_km90')+v(r,'w_km95')},
  w_expkm:{l:'里程過保（年限內）',f:r=>v(r,'w_expkm')},
  w_pend:{l:'保固待確認',f:r=>v(r,'w_pend')},
  m_over:{l:'保養逾期',f:r=>v(r,'m_over')},
  m_over_rate:{l:'保養逾期率',f:r=>pct(v(r,'m_over'),v(r,'veh')),rate:1},
  m_due30:{l:'30 天內該保養',f:r=>v(r,'m_due30')},
  hv:{l:'高價值車主',f:r=>v(r,'hv')},
  hv_churn:{l:'高價值流失',f:r=>v(r,'hv_churn')},
  act_w30:{l:'保固到期待聯絡',f:r=>v(r,'act_w30')},
  act_mover:{l:'保養逾期待邀約',f:r=>v(r,'act_mover')},
  act_hvchurn:{l:'高價值流失待挽回',f:r=>v(r,'act_hvchurn')},
  rev12:{l:'12 個月工單金額',f:r=>v(r,'rev12'),money:1},
  ro12:{l:'12 個月工單數',f:r=>v(r,'ro12')},
  avg_rev:{l:'每車年消費',f:r=>v(r,'veh')?v(r,'rev12')/v(r,'veh'):0,ntd:1},
  mob_rate:{l:'手機有效率',f:r=>pct(v(r,'mob_ok'),v(r,'veh')),rate:1},
  email_rate:{l:'Email 完整率',f:r=>pct(v(r,'email'),v(r,'veh')),rate:1},
  vin_rate:{l:'VIN 完整率',f:r=>pct(v(r,'vin'),v(r,'veh')),rate:1},
  birth_rate:{l:'生日完整率',f:r=>pct(v(r,'birth'),v(r,'veh')),rate:1},
  km_rate:{l:'里程可用率',f:r=>pct(v(r,'km_ok'),v(r,'veh')),rate:1},
  consent_rate:{l:'個資同意率',f:r=>pct(v(r,'c_yes'),v(r,'veh')),rate:1},
};
const cell=(k,r)=>{const m=M[k]; const x=m.f(r); return m.rate?p1(x):m.money?money(x):m.ntd?'NT$'+fmt(x):fmt(x);};

// ---------- state ----------
const state={branch:null};
try{const s=JSON.parse(localStorage.getItem('yxdash')||'{}'); if(s.branch&&D.branches[s.branch]) state.branch=s.branch;}catch(e){}
const save=()=>{try{localStorage.setItem('yxdash',JSON.stringify({branch:state.branch}))}catch(e){}};
const cur=()=>state.branch?D.branches[state.branch]:D.all;
const scopeName=()=>state.branch||'全公司';
function setBranch(b,route){state.branch=b||null; save(); if(route&&location.hash!==route) location.hash=route; else render();}

// ---------- routes ----------
const ROUTES=[
  {g:'總覽'},
  {id:'board',t:'營運總表',p:pageBoard},
  {g:'客戶與車輛'},
  {id:'lookup',t:'車輛查詢',p:pageLookup},
  {id:'warranty',t:'保固管理',p:pageWarranty},
  {id:'retention',t:'回廠與保養',p:pageRetention},
  {id:'vehicles',t:'車齡與車型',p:pageVehicles},
  {g:'營收'},
  {id:'revenue',t:'工單營收',p:pageRevenue},
  {g:'服務廠與人員'},
  {id:'branches',t:'服務廠比較',p:pageBranches},
  {id:'advisors',t:'服務專員',p:pagePeople('adv')},
  {id:'sales',t:'關懷業務',p:pagePeople('sales')},
  {g:'資料與系統'},
  {id:'quality',t:'資料品質',p:pageQuality},
  {id:'about',t:'資料說明',p:pageAbout},
];
const routeMap={}; ROUTES.forEach(r=>{if(r.id) routeMap[r.id]=r});
function curRoute(){const id=(location.hash.match(/^#\/([\w-]+)/)||[])[1]; return routeMap[id]||routeMap.board;}
function routeParam(){const m=location.hash.match(/^#\/[\w-]+\/(.+)$/); return m?decodeURIComponent(m[1]):'';}

function buildNav(){
  let n=0;
  document.getElementById('nav').innerHTML=ROUTES.map(r=>r.g?`<div class="nav-g">${r.g}</div>`:`<a class="nav-a" href="#/${r.id}" data-id="${r.id}"><span class="no">${++n}</span>${r.t}</a>`).join('');
  document.getElementById('sideFoot').innerHTML='來源：UIO客戶數據平台.xlsx（總表為主）<br>54,129 台車・128,136 張工單';
  const sel=document.getElementById('brSel');
  sel.innerHTML='<option value="">全公司</option>'+branchNames.map(b=>`<option value="${esc(b)}">${esc(b)}${OTHER.has(b)?'（其他）':''}</option>`).join('');
  sel.onchange=()=>setBranch(sel.value);
  const side=document.getElementById('side');
  document.getElementById('menuBtn').onclick=()=>side.classList.toggle('open');
  document.getElementById('nav').addEventListener('click',()=>side.classList.remove('open'));
}

function render(){
  const r=curRoute();
  document.querySelectorAll('.nav-a').forEach(a=>{if(a.dataset.id===r.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  document.getElementById('topTitle').textContent=r.t;
  document.title=r.t+'｜裕信售後營運儀表板';
  document.getElementById('brSel').value=state.branch||'';
  const main=document.getElementById('main');
  main.innerHTML='';
  r.p(main,routeParam());
}

// ---------- building blocks ----------
function el(html){const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild;}
function head(main,title,desc,extra){
  const crumbs=state.branch?`<div class="crumbs"><button type="button" data-clear>全公司</button><span>›</span><span class="cur">${esc(state.branch)}</span></div>`:`<div class="crumbs"><span class="cur">全公司</span></div>`;
  const h=el(`<div class="page-h"><div><h1>${title}</h1><p>${desc}</p></div><div class="btn-row">${crumbs}<button type="button" class="btn" data-print>列印會議版</button>${extra||''}</div></div>`);
  h.querySelector('[data-clear]')?.addEventListener('click',()=>setBranch(null));
  h.querySelector('[data-print]').onclick=()=>window.print();
  main.append(h); return h;
}
function panel(main,title,desc,cls){const p=el(`<section class="panel ${cls||''}"><div class="panel-h"><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div><div class="body"></div></section>`); main.append(p); return p.querySelector('.body');}
function cards(parent,items){
  const w=el('<div class="cards"></div>');
  items.forEach(c=>{const b=el(`<${c.go?'button type="button"':'div'} class="card ${c.cls||''}"><span class="lbl">${c.dot?`<span class="dot" style="--c:${c.dot}"></span>`:''}${c.l}</span><span class="val num">${c.val}</span><span class="sub">${c.sub||''}</span></${c.go?'button':'div'}>`); if(c.go) b.onclick=c.go; w.append(b)});
  parent.append(w); return w;
}
function hbars(parent,items,max){
  const m=max||Math.max(...items.map(i=>i.n))||1;
  const w=el('<div class="hbars"></div>');
  items.forEach(i=>{const r=el(`<div class="hb ${i.go?'click':''}" title="${esc(i.l)}：${esc(i.tip||i.txt)}"><span>${esc(i.l)}</span><span class="t"><i style="width:${pct(i.n,m)}%;--c:${i.c||'var(--s1)'}"></i></span><span class="n num">${i.txt}</span></div>`); if(i.go) r.onclick=i.go; w.append(r)});
  parent.append(w);
}
const tip=document.getElementById('tip');
function showTip(e,html){tip.innerHTML=html; tip.hidden=false; const x=Math.min(e.clientX+14,innerWidth-tip.offsetWidth-8); tip.style.left=x+'px'; tip.style.top=(e.clientY+14)+'px';}
function hideTip(){tip.hidden=true;}

// generic sortable table with CSV
function table(parent,{cols,rows,sort,dir=-1,onRow,search,name,rank,focus}){
  const box=el(`<div><div class="tbl-tools"><div>${search?`<label class="note">搜尋 <input type="search" id="q-${name}" placeholder="輸入姓名或廠別"></label>`:''}</div><div class="btn-row"><button type="button" class="btn" data-csv>⤓ CSV（Excel 可開）</button></div></div><div class="tbl-wrap"><table><thead></thead><tbody></tbody></table></div><div class="tbl-foot"></div></div>`);
  parent.append(box);
  let sk=sort||cols[1].k, sd=dir, q='';
  const val=(r,c)=>c.get?c.get(r):M[c.k]?M[c.k].f(r.r):r[c.k];
  const txt=(r,c)=>c.text?c.text(r):M[c.k]?cell(c.k,r.r):esc(val(r,c));
  function draw(){
    let rs=rows.filter(r=>!q||r.name.includes(q)||(r.branch||'').includes(q));
    const sc=cols.find(c=>c.k===sk);
    rs.sort((a,b)=>(a.other-b.other)||sd*((val(a,sc)>val(b,sc))-(val(a,sc)<val(b,sc))));
    const fk=focus||sk; const fc=cols.find(c=>c.k===fk);
    const maxF=fc&&M[fk]?Math.max(...rs.filter(r=>!r.other).map(r=>val(r,fc)))||1:0;
    box.querySelector('thead').innerHTML='<tr>'+(rank?'<th scope="col" class="l">名次</th>':'')+cols.map(c=>`<th scope="col" class="${c.l2?'l':''}" data-k="${c.k}" ${c.k===sk?`aria-sort="${sd<0?'descending':'ascending'}"`:''}>${c.t}${c.k===sk?(sd<0?' ▼':' ▲'):' ⇅'}</th>`).join('')+'</tr>';
    let n=0;
    box.querySelector('tbody').innerHTML=rs.map(r=>{ if(!r.other) n++; const rk=r.other?'—':(n<=3?['🥇','🥈','🥉'][n-1]:n);
      return `<tr class="${onRow&&!r.noclick?'click':''} ${r.other?'other':''}" data-i="${rows.indexOf(r)}">`+(rank?`<td class="l rank">${rk}</td>`:'')+cols.map(c=>{const bar=(c.k===fk&&maxF&&!r.other)?`<span class="cellbar" style="width:${Math.max(2,val(r,c)/maxF*56)}px"></span>`:''; return `<td class="${c.l2?'l':'num'}">${bar}${txt(r,c)}${c.k===cols[0].k&&r.other?' <span class="pill n">其他</span>':''}</td>`}).join('')+'</tr>'}).join('')||`<tr><td class="empty" colspan="${cols.length+(rank?1:0)}">沒有符合的資料</td></tr>`;
    box.querySelector('.tbl-foot').textContent=`共 ${rs.length} 筆｜點欄位標題可排序${onRow?'；點列可下鑽':''}`;
    box.querySelectorAll('th[data-k]').forEach(th=>th.onclick=()=>{const k=th.dataset.k; if(k===sk) sd*=-1; else {sk=k; sd=-1} draw()});
    if(onRow) box.querySelectorAll('tbody tr.click').forEach(tr=>tr.onclick=()=>onRow(rows[+tr.dataset.i]));
    box._rows=rs;
  }
  if(search){const inp=box.querySelector('input'); inp.oninput=()=>{q=inp.value.trim(); draw()};}
  box.querySelector('[data-csv]').onclick=()=>{
    const head=cols.map(c=>c.t); const lines=[head.join(',')];
    box._rows.forEach(r=>lines.push(cols.map(c=>{let x=val(r,c); if(M[c.k]&&M[c.k].rate) x=x.toFixed(1); else if(typeof x==='number') x=Math.round(x); x=String(x); return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x}).join(',')));
    const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${name}_${scopeName()}_2026-10-02.csv`; document.body.append(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  };
  draw(); return box;
}
const branchRows=()=>branchNames.map(b=>({name:b,r:D.branches[b],other:OTHER.has(b)}));
const nameCol={k:'name',t:'服務廠',l2:1,get:r=>r.name,text:r=>esc(r.name)};

function line(parent,pts,label){
  const box=el('<div class="chart"></div>'); parent.append(box);
  const W=Math.max(320,box.clientWidth||parent.clientWidth||640), H=240, L=58, R=16, T=14, B=30;
  const max=Math.max(...pts.map(p=>p.v))*1.1||1; const step=niceStep(max/4); const top=Math.ceil(max/step)*step;
  const x=i=>L+(W-L-R)*i/(pts.length-1), y=val=>T+(H-T-B)*(1-val/top);
  let g='';
  for(let t=0;t<=top+1;t+=step) g+=`<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="#e2e6eb"/><text x="${L-8}" y="${y(t)+4}" text-anchor="end">${money(t)}</text>`;
  pts.forEach((p,i)=>{ if(W>620||i%2===0) g+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${p.k.slice(2).replace('-','/')}</text>`});
  const P=pts.map((p,i)=>[x(i),y(p.v)]), inner=P.slice(1,-1);
  g+=`<path d="M${inner[0][0]},${y(0)} ${inner.map(q=>'L'+q).join(' ')} L${inner[inner.length-1][0]},${y(0)}Z" fill="var(--s1)" opacity=".1"/>`;
  g+=`<polyline points="${P.slice(0,2).join(' ')}" fill="none" stroke="var(--s1)" stroke-width="2" stroke-dasharray="4 4"/><polyline points="${P.slice(-2).join(' ')}" fill="none" stroke="var(--s1)" stroke-width="2" stroke-dasharray="4 4"/>`;
  g+=`<polyline points="${inner.join(' ')}" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round"/>`;
  P.forEach((q,i)=>{const part=i===0||i===P.length-1; g+=`<circle cx="${q[0]}" cy="${q[1]}" r="4" fill="${part?'#fff':'var(--s1)'}" stroke="var(--s1)" stroke-width="2"/>`});
  g+=`<line class="xh" x1="0" x2="0" y1="${T}" y2="${H-B}" stroke="#cfd5dc" visibility="hidden"/>`;
  box.innerHTML=`<svg width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}<rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="transparent"/></svg>`;
  const svg=box.querySelector('svg'), xh=box.querySelector('.xh');
  svg.addEventListener('pointermove',e=>{const rc=svg.getBoundingClientRect(); const sx=(e.clientX-rc.left)*W/rc.width; let i=Math.round((sx-L)/((W-L-R)/(pts.length-1))); i=Math.max(0,Math.min(pts.length-1,i)); const p=pts[i]; xh.setAttribute('x1',x(i)); xh.setAttribute('x2',x(i)); xh.setAttribute('visibility','visible'); showTip(e,`${p.k}${(i===0||i===pts.length-1)?'（半個月）':''}<br>營收 <b class="num">NT$${fmt(p.v)}</b><br>工單 <b class="num">${fmt(p.n)}</b> 張`)});
  svg.addEventListener('pointerleave',()=>{hideTip(); xh.setAttribute('visibility','hidden')});
}
function niceStep(raw){const p=Math.pow(10,Math.floor(Math.log10(raw))); const f=raw/p; return (f<=1?1:f<=2?2:f<=5?5:10)*p;}
function monthly(){const names=state.branch?[state.branch]:Object.keys(D.branches); return months.map(k=>{let n=0,s=0; names.forEach(b=>{const x=D.brMonth[b+'|'+k]; if(x){n+=x[0];s+=x[1]}}); return {k,n,v:s}});}

// ---------- alerts ----------
function alerts(){
  const A=D.all, out=[]; const rate=(r,k)=>pct(v(r,k),v(r,'veh'));
  if(!state.branch){
    out.push({sev:'crit',tag:'保固判定錯誤',msg:`<b class="num">${fmt(v(A,'w_expkm'))}</b> 台車年限未滿 3 年、但實際里程已達 100,000 km。原 Excel 只看日期，仍標示「未過期」，應為已過保（里程先到）。`,go:'#/warranty'});
    out.push({sev:'warn',tag:'保固即將到期',msg:`未來 30 天有 <b class="num">${fmt(v(A,'w_30'))}</b> 台車原廠保固到期，其中 <b class="num">${fmt(v(A,'act_w30'))}</b> 位車主可聯絡，建議安排到期前健檢。`,go:'#/warranty'});
    const worst=realBranches.slice().sort((a,b)=>rate(D.branches[b],'m_over')-rate(D.branches[a],'m_over'))[0];
    out.push({sev:'warn',tag:'保養逾期',msg:`${worst}保養逾期率 <b class="num">${p1(rate(D.branches[worst],'m_over'))}</b>，高於公司平均 ${p1(rate(A,'m_over'))} 共 <b class="num">${(rate(D.branches[worst],'m_over')-rate(A,'m_over')).toFixed(1)}</b> 個百分點。`,b:worst,go:'#/retention'});
    const wc=realBranches.slice().sort((a,b)=>rate(D.branches[b],'r_churn')-rate(D.branches[a],'r_churn'))[0];
    out.push({sev:'info',tag:'流失風險',msg:`${wc}超過一年未回廠比例 <b class="num">${p1(rate(D.branches[wc],'r_churn'))}</b>（公司 ${p1(rate(A,'r_churn'))}）。全公司高價值車主流失 <b class="num">${fmt(v(A,'hv_churn'))}</b> 位。`,b:wc,go:'#/retention'});
    out.push({sev:'info',tag:'資料品質',msg:`VIN 只有 <b class="num">${p1(rate(A,'vin'))}</b> 有填、Email ${p1(rate(A,'email'))}；${fmt(v(A,'w_pend'))} 台沒有領牌日，保固狀態待確認。`,go:'#/quality'});
  } else {
    const B=cur(), b=state.branch;
    if(v(B,'w_expkm')) out.push({sev:'crit',tag:'保固判定錯誤',msg:`${b}有 <b class="num">${fmt(v(B,'w_expkm'))}</b> 台車年限內但里程已達 100,000 km，原 Excel 仍標示保固內。`,go:'#/warranty'});
    out.push({sev:rate(B,'m_over')>rate(A,'m_over')?'warn':'info',tag:'保養逾期',msg:`保養逾期率 <b class="num">${p1(rate(B,'m_over'))}</b>，公司平均 ${p1(rate(A,'m_over'))}；可聯絡待邀約 <b class="num">${fmt(v(B,'act_mover'))}</b> 位。`,go:'#/retention'});
    out.push({sev:v(B,'w_30')?'warn':'info',tag:'保固即將到期',msg:`30 天內保固到期 <b class="num">${fmt(v(B,'w_30'))}</b> 台、180 天內 <b class="num">${fmt(M.w_180all.f(B))}</b> 台。`,go:'#/warranty'});
    out.push({sev:rate(B,'r_churn')>rate(A,'r_churn')?'warn':'info',tag:'流失風險',msg:`超過一年未回廠 <b class="num">${p1(rate(B,'r_churn'))}</b>（公司 ${p1(rate(A,'r_churn'))}），高價值流失 <b class="num">${fmt(v(B,'hv_churn'))}</b> 位。`,go:'#/retention'});
  }
  return out;
}

// ---------- pages ----------
function pageBoard(main){
  const r=cur(), n=v(r,'veh');
  head(main,'營運總表',`${scopeName()}　一頁看懂：管理警示 → 今日行動 → 車輛與保固 → 服務廠排名`);
  const how=panel(main,'怎麼讀','', 'howto');
  how.innerHTML=`<ol><li>保固依「<b>3 年或 100,000 km，以先到者為準</b>」由系統重算；保固起始日＝領牌日。</li><li>活躍＝近 180 天有工單；流失風險＝超過 365 天未回廠；保養逾期＝最後定保日＋保養週期已過、且未滿 1 年。</li><li>「可聯絡」＝同意使用個資、非暫停聯絡、手機有效。今日行動只算可聯絡的車主。</li><li>上方「服務廠」可切換範圍；表格點列可下鑽到服務專員。</li></ol>`;
  const al=panel(main,'管理警示','依規則自動判斷，點擊看明細');
  const w=el('<div class="alerts"></div>'); al.append(w);
  alerts().forEach(a=>{const b=el(`<button type="button" class="alert sev-${a.sev}"><span class="tag">${a.tag}</span><span>${a.msg}</span><span class="go">查看 →</span></button>`); b.onclick=()=>{ if(a.b!==undefined){state.branch=a.b; save();} location.hash=a.go; if(location.hash===a.go) render(); }; w.append(b)});
  const ac=panel(main,'今日行動','僅計入可聯絡車主');
  cards(ac,[
    {cls:'warn',dot:'var(--warn)',l:'保養逾期，邀約回廠',val:fmt(v(r,'act_mover')),sub:`全部逾期 ${fmt(v(r,'m_over'))} 台`,go:()=>location.hash='#/retention'},
    {cls:'crit',dot:'var(--crit)',l:'保固 30 天內到期，安排健檢',val:fmt(v(r,'act_w30')),sub:`全部 ${fmt(v(r,'w_30'))} 台；180 天內 ${fmt(M.w_180all.f(r))} 台`,go:()=>location.hash='#/warranty'},
    {cls:'info',dot:'var(--serious)',l:'高價值車主一年未回廠',val:fmt(v(r,'act_hvchurn')),sub:`全部 ${fmt(v(r,'hv_churn'))} 位（12 個月 ≥ 3 萬）`,go:()=>location.hash='#/retention'},
    {cls:'info',dot:'var(--s1)',l:'30 天內該保養，預先提醒',val:fmt(v(r,'m_due30')),sub:'依最後定保日＋保養週期',go:()=>location.hash='#/retention'},
  ]);
  const kp=panel(main,'車輛與客戶',scopeName());
  cards(kp,[
    {l:'車輛數',val:fmt(n),sub:`公司法人 ${fmt(v(r,'company'))} 台`},
    {l:'活躍車輛',val:fmt(v(r,'r_act')),sub:p1(pct(v(r,'r_act'),n))+' 近 180 天回廠'},
    {l:'流失風險',val:fmt(v(r,'r_churn')),sub:p1(pct(v(r,'r_churn'),n))+' 超過 1 年未回'},
    {l:'保固內車輛',val:fmt(v(r,'w_in')),sub:'年限與里程皆未到',go:()=>location.hash='#/warranty'},
    {l:'可聯絡車主',val:fmt(v(r,'contactable')),sub:p1(pct(v(r,'contactable'),n))},
    {l:'12 個月工單金額',val:money(v(r,'rev12')),sub:`${fmt(v(r,'ro12'))} 張工單`,go:()=>location.hash='#/revenue'},
  ]);
  if(!state.branch){
    const t=panel(main,'服務廠排名','依保養逾期待邀約排序；點列看該廠服務專員');
    table(t,{name:'服務廠排名',rank:1,rows:branchRows(),sort:'act_mover',cols:[nameCol,
      {k:'veh',t:'車輛'},{k:'act_rate',t:'活躍率'},{k:'act_mover',t:'保養逾期待邀約'},{k:'act_w30',t:'保固到期待聯絡'},{k:'hv_churn',t:'高價值流失'},{k:'w_expkm',t:'里程過保'},{k:'contact_rate',t:'可聯絡率'},{k:'rev12',t:'12 個月金額'}],
      onRow:x=>setBranch(x.name,'#/advisors')});
  } else {
    const t=panel(main,`${esc(state.branch)}服務專員`,'依前一張工單的接待人員');
    peopleTable(t,'adv','act_mover');
  }
}

function pageWarranty(main){
  const r=cur();
  head(main,'保固管理','一般新車原廠保固：3 年／100,000 km，以先到者為準');
  const top=el('<div class="grid2"></div>'); main.append(top);
  const p1b=el('<section class="panel"><div class="panel-h"><h2>保固狀態組成</h2><p>系統重算，非沿用 Excel 欄位</p></div><div class="body"></div></section>'); top.append(p1b); const b=p1b.querySelector('.body');
  b.append(el(`<div class="rule"><b>保固內 ＝ 領牌日起未滿 36 個月 且 最後有效實際里程未達 100,000 km。</b>任一條件先到即過保。排除 &lt;100 km 的假里程。</div>`));
  const exp180=M.w_180all.f(r);
  const segs=[{l:'保固內',n:v(r,'w_in')-exp180,c:'var(--good)'},{l:'180 天內到期',n:exp180,c:'var(--warn)'},{l:'里程已達 10 萬（年限內）',n:v(r,'w_expkm'),c:'var(--crit)'},{l:'已過保（年限）',n:v(r,'w_exp'),c:'var(--neutral)'},{l:'待確認（無領牌日）',n:v(r,'w_pend'),c:'var(--line-2)'}];
  const tot=segs.reduce((a,s)=>a+s.n,0)||1;
  const bar=el('<div class="wbar" role="img" aria-label="保固狀態組成"></div>');
  segs.filter(s=>s.n).forEach(s=>{const sp=el(`<span style="width:${pct(s.n,tot)}%;background:${s.c}"></span>`); sp.onpointermove=e=>showTip(e,`${s.l}<br><b class="num">${fmt(s.n)}</b> 台（${p1(pct(s.n,tot))}）`); sp.onpointerleave=hideTip; bar.append(sp)});
  b.append(bar); b.append(el(`<div class="legend">${segs.map(s=>`<span><span class="dot" style="--c:${s.c}"></span>${s.l} <b class="num">${fmt(s.n)}</b></span>`).join('')}</div>`));
  const p2=el('<section class="panel"><div class="panel-h"><h2>保固預警</h2><p>門檻可由管理者自訂</p></div><div class="kv"></div></section>'); top.append(p2);
  const rows=[['保固內','g','保固內',v(r,'w_in')],['未來 30 天到期','y','年限',v(r,'w_30')],['未來 31～90 天到期','y','年限',v(r,'w_90')],['未來 91～180 天到期','y','年限',v(r,'w_180')],['保固內，80,000～89,999 km','y','里程',v(r,'w_km80')],['保固內，90,000～94,999 km','y','里程',v(r,'w_km90')],['保固內，95,000～99,999 km','y','里程',v(r,'w_km95')],['年限內但 ≥100,000 km（應為已過保）','r','已過保',v(r,'w_expkm')],['保固內但無可信里程','n','待確認',v(r,'w_nokm')],['沒有領牌日','n','待確認',v(r,'w_pend')]];
  p2.querySelector('.kv').innerHTML=rows.map(x=>`<div>${x[0]}<span class="pill ${x[1]}">${x[2]}</span></div><div class="num">${fmt(x[3])}</div>`).join('');
  const t=panel(main,state.branch?`${esc(state.branch)}服務專員`:'各服務廠保固',state.branch?'':'點列看該廠服務專員');
  if(state.branch) peopleTable(t,'adv','w_180all',['veh','w_in','w_30','w_180all','w_km80','w_expkm','act_w30']);
  else table(t,{name:'保固_服務廠',rows:branchRows(),sort:'w_180all',cols:[nameCol,{k:'veh',t:'車輛'},{k:'w_in',t:'保固內'},{k:'w_30',t:'30 天到期'},{k:'w_90',t:'31～90 天'},{k:'w_180all',t:'180 天內到期'},{k:'w_km80',t:'≥80,000 km'},{k:'w_km90',t:'≥90,000 km'},{k:'w_expkm',t:'里程過保'},{k:'w_pend',t:'待確認'},{k:'act_w30',t:'30 天到期可聯絡'}],onRow:x=>setBranch(x.name)});
}

function pageRetention(main){
  const r=cur();
  head(main,'回廠與保養','距最近一次工單天數、保養週期與流失風險');
  cards(main,[
    {cls:'good',l:'活躍（≤180 天）',val:fmt(v(r,'r_act')),sub:p1(pct(v(r,'r_act'),v(r,'veh')))},
    {cls:'warn',l:'沉睡（181～365 天）',val:fmt(v(r,'r_dorm')),sub:p1(pct(v(r,'r_dorm'),v(r,'veh')))},
    {cls:'crit',l:'流失風險（>365 天）',val:fmt(v(r,'r_churn')),sub:p1(pct(v(r,'r_churn'),v(r,'veh')))},
    {cls:'warn',l:'保養逾期',val:fmt(v(r,'m_over')),sub:`可聯絡 ${fmt(v(r,'act_mover'))} 位`},
    {cls:'info',l:'30 天內該保養',val:fmt(v(r,'m_due30')),sub:'預先提醒'},
    {cls:'crit',l:'高價值流失',val:fmt(v(r,'hv_churn')),sub:`可聯絡 ${fmt(v(r,'act_hvchurn'))} 位`},
  ]);
  const g=el('<div class="grid2"></div>'); main.append(g);
  const a=el('<section class="panel"><div class="panel-h"><h2>回廠狀態分布</h2><p>距最近一次工單</p></div></section>'); g.append(a);
  hbars(a,[{l:'≤180 天',n:v(r,'r_act'),c:'var(--good)',txt:fmt(v(r,'r_act'))},{l:'181～365 天',n:v(r,'r_dorm'),c:'var(--warn)',txt:fmt(v(r,'r_dorm'))},{l:'>365 天',n:v(r,'r_churn'),c:'var(--crit)',txt:fmt(v(r,'r_churn'))},{l:'無紀錄',n:v(r,'r_none'),c:'var(--neutral)',txt:fmt(v(r,'r_none'))}]);
  const c=el('<section class="panel"><div class="panel-h"><h2>各廠保養逾期率</h2><p>點長條切換到該廠</p></div></section>'); g.append(c);
  hbars(c,realBranches.map(b=>({l:b,n:M.m_over_rate.f(D.branches[b]),txt:p1(M.m_over_rate.f(D.branches[b])),c:b===state.branch?'var(--s2)':'var(--s1)',go:()=>setBranch(b)})).sort((x,y)=>y.n-x.n),100);
  const t=panel(main,state.branch?`${esc(state.branch)}服務專員`:'各服務廠回廠與保養',state.branch?'':'點列看該廠服務專員');
  if(state.branch) peopleTable(t,'adv','act_mover',['veh','act_rate','r_churn','m_over','m_due30','act_mover','hv_churn']);
  else table(t,{name:'回廠保養_服務廠',rows:branchRows(),sort:'m_over_rate',cols:[nameCol,{k:'veh',t:'車輛'},{k:'act_rate',t:'活躍率'},{k:'r_dorm',t:'沉睡'},{k:'r_churn',t:'流失風險'},{k:'churn_rate',t:'流失率'},{k:'m_over',t:'保養逾期'},{k:'m_over_rate',t:'逾期率'},{k:'m_due30',t:'30 天內該保養'},{k:'act_mover',t:'逾期可聯絡'},{k:'hv_churn',t:'高價值流失'}],onRow:x=>setBranch(x.name)});
}

function pageVehicles(main){
  const r=cur();
  head(main,'車齡與車型','依領牌日計算車齡；車型為原始車型代碼');
  const g=el('<div class="grid2"></div>'); main.append(g);
  const a=el('<section class="panel"><div class="panel-h"><h2>車齡分布</h2><p>'+scopeName()+'</p></div></section>'); g.append(a);
  hbars(a,[['0～3 年','age0_3'],['4～6 年','age4_6'],['7～10 年','age7_10'],['11 年以上','age11']].map(([l,k])=>({l,n:v(r,k),txt:fmt(v(r,k))+'（'+p1(pct(v(r,k),v(r,'veh')-v(r,'w_pend')))+'）'})));
  const b=el('<section class="panel"><div class="panel-h"><h2>車型代碼前 12 名</h2><p>全公司；車系對照表待提供</p></div></section>'); g.append(b);
  const ms=Object.entries(D.models); hbars(b,ms.map(([k,n])=>({l:k,n,txt:fmt(n)})));
  const c=panel(main,'客戶類型',scopeName());
  cards(c,[{l:'個人車主',val:fmt(v(r,'veh')-v(r,'company')),sub:p1(pct(v(r,'veh')-v(r,'company'),v(r,'veh')))},{l:'公司法人',val:fmt(v(r,'company')),sub:p1(pct(v(r,'company'),v(r,'veh')))},{l:'高價值車主',val:fmt(v(r,'hv')),sub:'12 個月工單 ≥ NT$30,000'},{l:'每車年消費',val:'NT$'+fmt(M.avg_rev.f(r)),sub:'12 個月工單金額 ÷ 車輛數'}]);
  if(!state.branch){const t=panel(main,'各服務廠車齡結構','點列切換到該廠');
    table(t,{name:'車齡_服務廠',rows:branchRows(),sort:'veh',cols:[nameCol,{k:'veh',t:'車輛'},{k:'a03',t:'0～3 年',get:x=>v(x.r,'age0_3'),text:x=>fmt(v(x.r,'age0_3'))},{k:'a46',t:'4～6 年',get:x=>v(x.r,'age4_6'),text:x=>fmt(v(x.r,'age4_6'))},{k:'a710',t:'7～10 年',get:x=>v(x.r,'age7_10'),text:x=>fmt(v(x.r,'age7_10'))},{k:'a11',t:'11 年以上',get:x=>v(x.r,'age11'),text:x=>fmt(v(x.r,'age11'))},{k:'avg_rev',t:'每車年消費'}],onRow:x=>setBranch(x.name)});}
}

function pageRevenue(main){
  head(main,'工單營收','工單總金額，依結帳月份');
  const pts=monthly(); const tot=pts.reduce((a,p)=>a+p.v,0), ros=pts.reduce((a,p)=>a+p.n,0);
  cards(main,[{l:'13 個月工單金額',val:money(tot),sub:'2025-08-18～2026-08-18'},{l:'工單數',val:fmt(ros),sub:'張'},{l:'平均單張金額',val:'NT$'+fmt(ros?tot/ros:0),sub:''},{l:'月平均（完整月）',val:money(pts.slice(1,-1).reduce((a,p)=>a+p.v,0)/(pts.length-2)),sub:'不含頭尾半個月'}]);
  const a=panel(main,'月工單營收',scopeName()+'；空心點為半個月資料');
  line(a,pts,scopeName()+'每月工單營收');
  const g=el('<div class="grid2"></div>'); main.append(g);
  const c=el('<section class="panel"><div class="panel-h"><h2>營收結構</h2><p>依工單類別欄位加總</p></div></section>'); g.append(c);
  const names=state.branch?[state.branch]:Object.keys(D.brCat); const sums=D.catNames.map((n,i)=>names.reduce((s,b)=>s+((D.brCat[b]||[])[i]||0),0)); const st=sums.reduce((x,y)=>x+y,0)||1;
  hbars(c,D.catNames.map((n,i)=>({l:n,n:sums[i],txt:money(sums[i]),tip:'NT$'+fmt(sums[i])+'（'+p1(pct(sums[i],st))+'）'})).sort((x,y)=>y.n-x.n));
  const d=el('<section class="panel"><div class="panel-h"><h2>工單類別</h2><p>全公司張數</p></div></section>'); g.append(d);
  const rt=Object.entries(D.roType).sort((x,y)=>y[1]-x[1]); hbars(d,rt.map(([k,n])=>({l:k,n,txt:fmt(n)})));
  if(!state.branch){const t=panel(main,'各服務廠營收','依結帳服務廠；點列切換到該廠');
    const rows=Object.keys(D.brCat).map(b=>{let n=0,s=0; months.forEach(m=>{const x=D.brMonth[b+'|'+m]; if(x){n+=x[0];s+=x[1]}}); return {name:b,r:D.branches[b]||null,ro:n,rev:s,other:OTHER.has(b),noclick:!D.branches[b]}});
    table(t,{name:'營收_服務廠',rank:1,rows,sort:'rev',cols:[nameCol,{k:'rev',t:'工單金額',get:x=>x.rev,text:x=>money(x.rev)},{k:'ro',t:'工單數',get:x=>x.ro,text:x=>fmt(x.ro)},{k:'avg',t:'平均單張',get:x=>x.ro?x.rev/x.ro:0,text:x=>'NT$'+fmt(x.ro?x.rev/x.ro:0)},...D.catNames.slice(0,6).map((c,i)=>({k:'c'+i,t:c,get:x=>(D.brCat[x.name]||[])[i]||0,text:x=>money((D.brCat[x.name]||[])[i]||0)}))],onRow:x=>D.branches[x.name]&&setBranch(x.name)});}
}

function pageBranches(main){
  head(main,'服務廠比較','所有指標並列；點欄位排序、點列進入該廠服務專員');
  const t=panel(main,'服務廠總表','灰色列為外修、鈑噴中心、他經銷商保養等非一般服務廠');
  table(t,{name:'服務廠比較',rank:1,rows:branchRows(),sort:'veh',cols:[nameCol,{k:'veh',t:'車輛'},{k:'act_rate',t:'活躍率'},{k:'churn_rate',t:'流失率'},{k:'m_over_rate',t:'保養逾期率'},{k:'w_in',t:'保固內'},{k:'w_180all',t:'保固 180 天內到期'},{k:'w_expkm',t:'里程過保'},{k:'hv',t:'高價值'},{k:'hv_churn',t:'高價值流失'},{k:'contact_rate',t:'可聯絡率'},{k:'consent_rate',t:'個資同意率'},{k:'rev12',t:'12 個月金額'},{k:'avg_rev',t:'每車年消費'}],onRow:x=>setBranch(x.name,'#/advisors')});
}

function peopleRows(kind){
  const src=kind==='adv'?D.advisors:D.brSales;
  if(state.branch) return Object.keys(src).filter(k=>k.split('|')[0]===state.branch).map(k=>({name:k.slice(k.indexOf('|')+1),branch:state.branch,r:src[k],other:k.endsWith('|未指派')}));
  if(kind==='sales') return Object.keys(D.sales).map(k=>({name:k,branch:'',r:D.sales[k],other:k==='未指派'}));
  return Object.keys(src).filter(k=>!OTHER.has(k.split('|')[0])).map(k=>({name:k.slice(k.indexOf('|')+1),branch:k.split('|')[0],r:src[k],other:k.endsWith('|未指派')}));
}
function peopleTable(parent,kind,sort,keys){
  const ks=keys||['veh','act_rate','churn_rate','m_over','act_mover','w_180all','act_w30','hv_churn','contact_rate','rev12'];
  const cols=[{k:'name',t:kind==='adv'?'服務專員':'關懷業務',l2:1,get:r=>r.name,text:r=>esc(r.name)}];
  const showBranch=!state.branch&&kind==='adv';
  if(showBranch) cols.push({k:'branch',t:'服務廠',l2:1,get:r=>r.branch,text:r=>esc(r.branch)});
  ks.forEach(k=>cols.push({k,t:M[k].l.replace(/（.*）/,'')}));
  table(parent,{name:kind==='adv'?'服務專員':'關懷業務',rank:1,rows:peopleRows(kind),sort,cols,search:1,onRow:showBranch?(x=>setBranch(x.branch)):null});
}
function pagePeople(kind){return function(main){
  const isAdv=kind==='adv';
  head(main,isAdv?'服務專員':'關懷業務',isAdv?'依每台車前一張工單的接待人員歸屬':'依「關懷指派」欄判定的業務歸屬（優先取銷售人員名單中的人）'+(state.branch?'；只計入上次在本廠保養的車':''));
  const rows=peopleRows(kind).filter(x=>!x.other);
  const top=(k)=>rows.slice().sort((a,b)=>M[k].f(b.r)-M[k].f(a.r))[0];
  const tv=top('veh'), to=top('act_mover'), tw=top('act_w30');
  cards(main,[
    {l:isAdv?'服務專員人數':'業務人數',val:fmt(rows.length),sub:scopeName()},
    {l:'負責車輛最多',val:tv?esc(tv.name):'—',sub:tv?`${tv.branch?esc(tv.branch)+'｜':''}${fmt(v(tv.r,'veh'))} 台`:''},
    {cls:'warn',l:'保養逾期待邀約最多',val:to?esc(to.name):'—',sub:to?`${fmt(v(to.r,'act_mover'))} 位`:''},
    {cls:'crit',l:'保固到期待聯絡最多',val:tw?esc(tw.name):'—',sub:tw?`${fmt(v(tw.r,'act_w30'))} 位`:''},
  ]);
  const t=panel(main,(isAdv?'服務專員':'關懷業務')+'排名',state.branch?esc(state.branch):(isAdv?'全公司（不含非一般服務廠）；點列切換到該廠':'全公司'));
  peopleTable(t,kind,'act_mover');
  main.append(el(`<p class="note">再往下的客戶名單（Customer 360 → Vehicle 360）含個資，不在此儀表板呈現，需在正式 CRM 系統依權限開啟。</p>`));
}}

function pageQuality(main){
  const r=cur(), n=v(r,'veh');
  head(main,'資料品質','欄位完整率與需人工確認的例外');
  const a=panel(main,'欄位完整率',scopeName());
  hbars(a,[['手機有效','mob_ok'],['里程可用','km_ok'],['生日','birth'],['個資同意','c_yes'],['VIN','vin'],['Email','email']].map(([l,k])=>{const p=pct(v(r,k),n); return {l,n:p,c:p>=90?'var(--good)':p>=60?'var(--warn)':'var(--crit)',txt:p1(p)+'（'+fmt(v(r,k))+'）'}}),100);
  const e=panel(main,'例外清單（全公司）','Phase 2 匯入時列入 Exception Report，不可自行猜測');
  e.innerHTML='<div class="kv">'+[
    ['原 Excel 標「未過期」但實際里程 ≥100,000 km','65 台'],['沒有領牌日（保固待確認）',fmt(v(D.all,'w_pend'))+' 台'],['前一里程 <100 km 的假里程讀值','2,647 筆'],['延長保固到期日早於原廠到期日','13,272 筆'],['手機號碼無效（補 0 後仍不符格式）','7,670 筆'],['同一手機對應 2～5 位不同車主','182 支'],['車型空白（總表顯示為 0）','15 台'],['個資拒絕／未授權（不可行銷）',fmt(v(D.all,'c_no'))+'／'+fmt(v(D.all,'c_none'))],['暫停聯絡',fmt(v(D.all,'dnc'))+' 台']
  ].map(x=>`<div>${x[0]}</div><div class="num">${x[1]}</div>`).join('')+'</div>';
  if(!state.branch){const t=panel(main,'各服務廠資料品質','點列切換到該廠');
    table(t,{name:'資料品質_服務廠',rows:branchRows(),sort:'mob_rate',dir:1,cols:[nameCol,{k:'veh',t:'車輛'},{k:'mob_rate',t:'手機有效'},{k:'km_rate',t:'里程可用'},{k:'birth_rate',t:'生日'},{k:'vin_rate',t:'VIN'},{k:'email_rate',t:'Email'},{k:'consent_rate',t:'個資同意'},{k:'w_pend',t:'無領牌日'}],onRow:x=>setBranch(x.name)});}
}

function pageAbout(main){
  head(main,'資料說明','資料來源、指標定義與已確認的規則');
  const a=panel(main,'資料來源');
  a.innerHTML='<div class="kv">'+[['主要來源','UIO客戶數據平台.xlsx「總表」（54,129 台車，一車一列）'],['補充欄位','同檔「UIO」工作表：領牌日、VIN、Email、地址、延保、暫停聯絡、關懷指派（以車牌對應）'],['工單','「一年內維修次數-4W0」128,136 張，結帳日 2025-08-18～2026-08-18'],['基準日','2026-10-02'],['服務廠歸屬','上次保養廠別（裕信汽車）；在他經銷商保養者歸「他經銷商保養」'],['服務專員','前一張工單的接待人員'],['關懷業務','「關懷指派」欄中第一位出現在銷售人員名單的人；沒有時取第一位非服務專員；都沒有則為未指派業務']].map(x=>`<div>${x[0]}</div><div style="text-align:left;font-weight:400">${x[1]}</div>`).join('')+'</div>';
  const b=panel(main,'指標定義');
  b.innerHTML='<div class="kv">'+[['保固內','領牌日起未滿 36 個月，且最後有效實際里程 <100,000 km'],['保固即將到期','保固內且年限剩 180／90／30 天以內'],['里程過保（年限內）','年限未到但實際里程 ≥100,000 km'],['活躍／沉睡／流失風險','距前一張工單 ≤180／181～365／>365 天'],['保養逾期','最後定保日＋保養週期（月）已過，且逾期未滿 1 年'],['高價值車主','近 12 個月工單金額 ≥ NT$30,000'],['可聯絡','同意使用個資、非暫停聯絡、手機有效']].map(x=>`<div>${x[0]}</div><div style="text-align:left;font-weight:400">${x[1]}</div>`).join('')+'</div>';
  const c=panel(main,'已確認規則','確認人 2418');
  c.innerHTML='<div class="kv">'+[['保固起始日','以領牌日為準；無領牌日列為待確認'],['關懷指派','是業務，不是服務專員'],['Excel 來源','以總表為主，UIO 補欄位'],['關懷業務判定','優先取關懷指派中的銷售人員；否則第一位非服務專員；否則未指派'],['員工姓名更正','黃廸為、陳啓炳、曾咏智、黃瀞儀']].map(x=>`<div>${x[0]}</div><div style="text-align:left;font-weight:400">${x[1]}</div>`).join('')+'</div>';
  main.append(el('<p class="note">本頁只含彙總數字與員工姓名，不含任何客戶姓名、電話或地址。</p>'));
}

// ---------- 車輛查詢（只在本機私人版有資料） ----------
// 客戶個資放在私人專案 yuxin-crm/private/vehicles.js，不進公開儲存庫。
// 只有用本機檔案（file:）或 localhost 開啟時才會載入；GitHub Pages 上不會去抓。
// 依序嘗試：分享包（OneDrive 資料夾內 data/vehicles.js）→ 開發機私人資料夾
const PRIVATE_SRCS=['data/vehicles.js','../../yuxin-crm/private/vehicles.js'];
const canPrivate=location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';
let V=null, Vloading=null;
const LF={q:'',model:'',age:'',km:'',w:'',br:'',adv:'',sales:'',habit:'',sort:'spend',dir:-1,page:0};
function loadVehicles(){
  if(V) return Promise.resolve(V);
  if(!canPrivate) return Promise.reject(new Error('public'));
  if(Vloading) return Vloading;
  Vloading=new Promise((ok,fail)=>{
    const tryAt=i=>{ if(i>=PRIVATE_SRCS.length) return fail(new Error('missing'));
      const s=document.createElement('script'); s.src=PRIVATE_SRCS[i];
      s.onload=()=>{ if(!window.YX_VEHICLES) return tryAt(i+1); V=prepVehicles(window.YX_VEHICLES); ok(V)};
      s.onerror=()=>{ s.remove(); tryAt(i+1) }; document.head.append(s); };
    tryAt(0);
  });
  return Vloading;
}
function prepVehicles(X){
  const C={}; X.cols.forEach((c,i)=>C[c]=i);
  const num=s=>s===''?NaN:+s;
  const rows=X.rows.map(r=>({r,plate:r[0],pn:r[0].toUpperCase().replace(/[-\s]/g,''),owner:r[1],mob:r[3],age:num(r[C['車齡（年）']]),km:num(r[C['最後有效里程']]),w:r[C['系統保固狀態']],br:r[C['服務廠']],adv:r[C['服務專員']],sales:r[C['關懷業務']],model:r[C['車型']],days:num(r[C['距上次回廠天數']]),spend:num(r[C['12個月工單金額']])||0}));
  const owners={}; rows.forEach(x=>{const k=x.owner+'|'+(x.mob||x.plate); (owners[k]=owners[k]||[]).push(x); x.ok=k});
  const count=f=>{const m={}; rows.forEach(x=>{const k=f(x); if(k) m[k]=(m[k]||0)+1}); return Object.entries(m).sort((a,b)=>b[1]-a[1])};
  return {asOf:X.asOf,C,rows,owners,models:count(x=>x.model),brs:count(x=>x.br),advs:count(x=>x.adv),saless:count(x=>x.sales),ws:count(x=>x.w)};
}
const AGE=[['0-3','0～3 年',x=>x.age<3],['3-5','3～5 年',x=>x.age>=3&&x.age<5],['5-7','5～7 年',x=>x.age>=5&&x.age<7],['7-10','7～10 年',x=>x.age>=7&&x.age<10],['10+','10 年以上',x=>x.age>=10],['na','無領牌日',x=>isNaN(x.age)]];
const KMB=[['0-30','0～30,000 km',x=>x.km<30000],['30-50','30,000～50,000',x=>x.km>=30000&&x.km<50000],['50-80','50,000～80,000',x=>x.km>=50000&&x.km<80000],['80-100','80,000～100,000',x=>x.km>=80000&&x.km<100000],['100+','100,000 km 以上',x=>x.km>=100000],['na','無可信里程',x=>isNaN(x.km)]];
const HABIT=[
  {g:'回廠',o:[['r180','近 180 天有回廠',x=>x.days<=180],['r365','181～365 天未回廠',x=>x.days>180&&x.days<=365],['r999','超過 1 年未回廠',x=>x.days>365]]},
  {g:'定保頻率',o:[['fH','高頻',x=>x.r[V.C['定保頻率']]==='高頻'],['fM','中頻',x=>x.r[V.C['定保頻率']]==='中頻'],['fL','低頻',x=>x.r[V.C['定保頻率']]==='低頻']]},
  {g:'近 12 個月工單金額',o:[['s30','NT$30,000 以上（高價值）',x=>x.spend>=30000],['s10','NT$10,000～30,000',x=>x.spend>=10000&&x.spend<30000],['s1','NT$10,000 以下',x=>x.spend>0&&x.spend<10000],['s0','無工單',x=>!x.spend]]},
  {g:'美容',o:[['bH','美容年消高於 1 萬',x=>x.r[V.C['美容消費等級']]==='美容年消高於1萬'],['bM','美容年消 5 千～1 萬',x=>x.r[V.C['美容消費等級']]==='美容年消5千-1萬'],['bL','美容年消低於 5 千',x=>x.r[V.C['美容消費等級']]==='美容年消低於5千']]},
  {g:'零件更換（一年內）',o:[['tire','有換輪胎',x=>+x.r[V.C['輪胎年更換次數']]>0],['bat','有換電瓶',x=>+x.r[V.C['電瓶年更換次數']]>0]]},
  {g:'會員',o:[['mem','有會員護照／會員方案',x=>!!x.r[V.C['會員護照']]]]},
];
const habitFn=k=>{for(const g of HABIT) for(const o of g.o) if(o[0]===k) return o[2]; return null;};
const maskPhone=p=>p&&p.length>=7?p.slice(0,4)+'-***-'+p.slice(-3):p||'—';
const wPill=w=>`<span class="pill ${w==='保固內'?'g':w==='已過保'?'r':w==='待確認'?'n':'y'}">${esc(w||'—')}</span>`;

function pageLookup(main,param){
  head(main,'車輛查詢','選擇牌照號碼帶出車主與車輛基本資料；可依車型、車齡、里程、保固、服務廠、專員、業務、消費習慣篩選');
  const holder=el('<div style="display:grid;gap:16px"></div>'); main.append(holder);
  if(!canPrivate){ holder.append(el(`<section class="panel"><div class="panel-h"><h2>此頁僅限本機私人版</h2></div><p style="margin:0">車輛查詢含車主姓名、手機等客戶個資，不放在公開網址。請在公司電腦開啟本機版：<br><code>C:\\Projects\\yuxin-dashboard\\app\\index.html</code></p></section>`)); return; }
  holder.append(el('<p class="note">載入車輛資料中…（約 5 萬台，第一次需要幾秒）</p>'));
  loadVehicles().then(()=>{ holder.innerHTML=''; if(param) lookupDetail(holder,param); else lookupSearch(holder); })
   .catch(e=>{ holder.innerHTML=''; holder.append(el(`<section class="panel"><div class="panel-h"><h2>找不到本機車輛資料</h2></div><p style="margin:0">請確認 <code>C:\\Projects\\yuxin-crm\\private\\vehicles.js</code> 存在。這個檔案由 <code>tools/excel-analysis/VehicleLookupExport.cs</code> 從 Excel 產生，不會上傳到 GitHub。</p></section>`)); });
}

function lookupSearch(holder){
  holder.append(el('<p class="note">🔒 本頁含客戶個資，僅供公司內部使用；手機號碼預設遮罩，點「顯示」才會看到完整號碼。資料基準日 '+esc(V.asOf)+'。</p>'));
  const f=el(`<section class="panel"><div class="panel-h"><h2>查詢與篩選</h2><button type="button" class="btn" id="lf-reset">清除條件</button></div>
    <div class="filters">
      <label class="f-q">牌照號碼或車主<input id="lf-q" type="search" placeholder="例：ABC-1234、ABC1234、1234、王小明" autocomplete="off"></label>
      <label>車型<select id="lf-model"></select></label>
      <label>車齡<select id="lf-age"></select></label>
      <label>里程<select id="lf-km"></select></label>
      <label>保固狀態<select id="lf-w"></select></label>
      <label>服務廠<select id="lf-br"></select></label>
      <label>服務專員<select id="lf-adv"></select></label>
      <label>關懷業務<select id="lf-sales"></select></label>
      <label>消費習慣<select id="lf-habit"></select></label>
    </div><div class="lf-count" id="lf-count"></div></section>`);
  holder.append(f);
  const $=id=>f.querySelector('#'+id);
  // 下拉選單只列出「在其他條件下仍有車」的選項，數字是套用其他條件後的台數
  const NONE='__none', FACET={model:['全部車型','未填車型'],w:['全部保固狀態',''],br:['全部服務廠','無服務廠'],adv:['全部服務專員','無服務專員'],sales:['全部業務','未指派業務']};
  function refreshOpts(){
    Object.keys(FACET).forEach(k=>{
      const m={}; let none=0; filtered(k).forEach(x=>{const v=x[k]; if(v) m[v]=(m[v]||0)+1; else none++});
      const s=$('lf-'+k), list=Object.entries(m).sort((a,b)=>b[1]-a[1]);
      if(LF[k]&&LF[k]!==NONE&&!m[LF[k]]) list.unshift([LF[k],0]);
      s.innerHTML=`<option value="">${FACET[k][0]}</option>`+list.map(([v,n])=>`<option value="${esc(v)}">${esc(v)}（${fmt(n)}）</option>`).join('')+(none&&FACET[k][1]?`<option value="${NONE}">${FACET[k][1]}（${fmt(none)}）</option>`:'');
      s.value=LF[k];
    });
  }
  $('lf-age').innerHTML='<option value="">全部車齡</option>'+AGE.map(a=>`<option value="${a[0]}">${a[1]}</option>`).join('');
  $('lf-km').innerHTML='<option value="">全部里程</option>'+KMB.map(a=>`<option value="${a[0]}">${a[1]}</option>`).join('');
  $('lf-habit').innerHTML='<option value="">全部</option>'+HABIT.map(g=>`<optgroup label="${g.g}">${g.o.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</optgroup>`).join('');
  if(!LF.br&&state.branch&&V.brs.some(b=>b[0]===state.branch)) LF.br=state.branch;
  ['model','age','km','w','br','adv','sales','habit'].forEach(k=>{ const s=$('lf-'+k); s.value=LF[k]; s.onchange=()=>{LF[k]=s.value; LF.page=0; draw()}; });
  const q=$('lf-q'); q.value=LF.q; let qt; q.oninput=()=>{clearTimeout(qt); qt=setTimeout(()=>{LF.q=q.value.trim(); LF.page=0; draw()},200)};
  q.onkeydown=e=>{ if(e.key==='Enter'){ const r=filtered(); if(r.length===1) location.hash='#/lookup/'+encodeURIComponent(r[0].plate); }};
  $('lf-reset').onclick=()=>{Object.assign(LF,{q:'',model:'',age:'',km:'',w:'',br:'',adv:'',sales:'',habit:'',page:0}); lookupSearchRedraw()};
  const res=el('<section class="panel"><div class="panel-h"><h2>查詢結果</h2><p>點列看車主與車輛基本資料</p></div><div class="tbl-wrap"><table><thead></thead><tbody></tbody></table></div><div class="pager"></div></section>');
  holder.append(res);
  const COLS=[['plate','牌照號碼',x=>x.plate,1],['owner','車主',x=>x.owner,1],['model','車型',x=>x.model,1],['age','車齡',x=>x.age],['km','最後里程',x=>x.km],['w','保固狀態',x=>x.w,1],['br','服務廠',x=>x.br,1],['adv','服務專員',x=>x.adv,1],['sales','關懷業務',x=>x.sales,1],['days','距上次回廠',x=>x.days],['spend','12 個月金額',x=>x.spend]];
  // except：計算某個下拉選單的選項時，不套用它自己的條件
  function filtered(except){
    const qq=LF.q.toUpperCase().replace(/[-\s]/g,''); const ag=AGE.find(a=>a[0]===LF.age), kb=KMB.find(a=>a[0]===LF.km), hb=LF.habit?habitFn(LF.habit):null;
    const eq=k=>x=>except===k||!LF[k]||(LF[k]===NONE?!x[k]:x[k]===LF[k]);
    const fm=eq('model'),fw=eq('w'),fb=eq('br'),fa=eq('adv'),fs=eq('sales');
    return V.rows.filter(x=>(!qq||x.pn.includes(qq)||x.owner.toUpperCase().includes(qq))&&fm(x)&&(!ag||ag[2](x))&&(!kb||kb[2](x))&&fw(x)&&fb(x)&&fa(x)&&fs(x)&&(!hb||hb(x)));
  }
  function draw(){
    refreshOpts(); const rs=filtered(); const c=COLS.find(c=>c[0]===LF.sort)||COLS[10];
    rs.sort((a,b)=>{let x=c[2](a),y=c[2](b); if(c[3]){x=x||'';y=y||''; return LF.dir*x.localeCompare(y,'zh-Hant')} x=isNaN(x)?-Infinity:x; y=isNaN(y)?-Infinity:y; return LF.dir*(x-y)});
    const owners=new Set(rs.map(x=>x.ok)).size, spend=rs.reduce((a,x)=>a+x.spend,0);
    f.querySelector('#lf-count').innerHTML=`符合 <b class="num">${fmt(rs.length)}</b> 台車・<b class="num">${fmt(owners)}</b> 位車主・12 個月工單金額合計 <b class="num">NT$${fmt(spend)}</b>`;
    const per=50, pages=Math.max(1,Math.ceil(rs.length/per)); LF.page=Math.min(LF.page,pages-1); const slice=rs.slice(LF.page*per,LF.page*per+per);
    res.querySelector('thead').innerHTML='<tr>'+COLS.map(c=>`<th scope="col" class="${c[3]?'l':''}" data-k="${c[0]}" ${c[0]===LF.sort?`aria-sort="${LF.dir<0?'descending':'ascending'}"`:''}>${c[1]}${c[0]===LF.sort?(LF.dir<0?' ▼':' ▲'):' ⇅'}</th>`).join('')+'</tr>';
    res.querySelector('tbody').innerHTML=slice.map(x=>`<tr class="click" data-p="${esc(x.plate)}"><td class="l"><b>${esc(x.plate)}</b></td><td class="l">${esc(x.owner)}</td><td class="l">${esc(x.model||'—')}</td><td class="num">${isNaN(x.age)?'—':x.age.toFixed(1)+' 年'}</td><td class="num">${isNaN(x.km)?'—':fmt(x.km)}</td><td class="l">${wPill(x.w)}</td><td class="l">${esc(x.br||'—')}</td><td class="l">${esc(x.adv||'—')}</td><td class="l">${x.sales?esc(x.sales):'<span class="note">未指派業務</span>'}</td><td class="num">${isNaN(x.days)?'—':fmt(x.days)+' 天'}</td><td class="num">${x.spend?'NT$'+fmt(x.spend):'—'}</td></tr>`).join('')||`<tr><td class="empty" colspan="${COLS.length}">沒有符合的車輛</td></tr>`;
    res.querySelector('.pager').innerHTML=`<span class="note">第 ${LF.page+1} / ${pages} 頁（每頁 50 筆）</span><button type="button" class="btn" data-pg="-1" ${LF.page?'':'disabled'}>上一頁</button><button type="button" class="btn" data-pg="1" ${LF.page<pages-1?'':'disabled'}>下一頁</button>`;
    res.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{LF.page+=+b.dataset.pg; draw(); res.scrollIntoView({block:'start'})});
    res.querySelectorAll('th[data-k]').forEach(th=>th.onclick=()=>{const k=th.dataset.k; if(k===LF.sort) LF.dir*=-1; else {LF.sort=k; LF.dir=-1} draw()});
    res.querySelectorAll('tbody tr.click').forEach(tr=>tr.onclick=()=>location.hash='#/lookup/'+encodeURIComponent(tr.dataset.p));
  }
  function lookupSearchRedraw(){holder.innerHTML=''; lookupSearch(holder);}
  draw();
}

function lookupDetail(holder,plate){
  const pn=plate.toUpperCase().replace(/[-\s]/g,''); const x=V.rows.find(r=>r.pn===pn);
  const back=el('<div class="btn-row"><button type="button" class="btn">← 回查詢結果</button></div>'); back.querySelector('button').onclick=()=>location.hash='#/lookup'; holder.append(back);
  if(!x){ holder.append(el(`<section class="panel"><p style="margin:0">找不到牌照號碼 <b>${esc(plate)}</b>。</p></section>`)); return; }
  const C=V.C, g=k=>x.r[C[k]]||'', dash=s=>s?esc(s):'—';
  const consent=g('車主授權狀態'); const cPill=consent==='同意使用個資'?'g':consent==='拒絕使用個資'?'r':'n';
  const sameOwner=V.owners[x.ok]||[x];
  const phone=(p,id)=>p?`<span id="${id}" data-full="${esc(p)}">${esc(maskPhone(p))}</span> <button type="button" class="btn btn-xs" data-show="${id}">顯示</button>`:'—';
  const kv=list=>'<div class="kv">'+list.map(([k,v])=>`<div>${k}</div><div class="kv-v">${v}</div>`).join('')+'</div>';
  const grid=el('<div class="grid2"></div>'); holder.append(grid);
  const o=el(`<section class="panel"><div class="panel-h"><h2>車主基本資料</h2><p>${sameOwner.length>1?'名下 '+sameOwner.length+' 台車':'名下 1 台車'}</p></div>
    <div class="who"><div class="avatar">${esc((x.owner||'?').slice(0,1))}</div><div><div class="who-n">${dash(x.owner)}</div><div class="note">${dash(g('性別'))}｜${dash(g('車主年齡'))}｜${dash(g('轄區縣市'))}${esc(g('轄區區域'))}</div></div></div>
    ${kv([['車主行動電話',phone(g('車主行動電話'),'ph1')],['性別',dash(g('性別'))],['車主年齡',dash(g('車主年齡'))],['轄區',dash(g('轄區縣市')+g('轄區區域'))],['個資授權',`<span class="pill ${cPill}">${dash(consent)}</span>${cPill!=='g'?'<span class="note">　不可列入行銷名單</span>':''}`],['會員護照',dash(g('會員護照'))],['駕駛',dash(g('駕駛'))],['駕駛行動電話',phone(g('駕駛行動電話'),'ph2')],['銷售人員',dash(g('銷售人員'))],['關懷業務',g('關懷業務')?esc(g('關懷業務')):'未指派業務'],['關懷指派（原始）',dash(g('關懷指派（原始）'))]])}</section>`);
  grid.append(o);
  const wDiff=(g('新車保固到期（原 Excel）')==='未過期')!==(['保固內','年限即將到期','里程即將到期','即將到期（年限＋里程）'].includes(g('系統保固狀態')));
  const vcard=el(`<section class="panel"><div class="panel-h"><h2>車輛基本資料</h2><p>${esc(x.plate)}</p></div>
    <div class="who"><div class="avatar car">🚗</div><div><div class="who-n">${esc(x.plate)}</div><div class="note">${dash(g('車型'))}｜車齡 ${dash(g('車齡'))}</div></div></div>
    ${kv([['牌照號碼',esc(x.plate)],['車型',dash(g('車型'))],['車齡',dash(g('車齡'))+(g('車齡（年）')?`（${g('車齡（年）')} 年）`:'')],['領牌日',dash(g('領牌日'))],['最後有效里程',g('最後有效里程')?fmt(+g('最後有效里程'))+' km':'—'],['系統保固狀態',wPill(g('系統保固狀態'))],['保固到期日（年限）',dash(g('保固到期日'))],['保固說明',dash(g('保固說明'))],['原 Excel 新車保固到期',dash(g('新車保固到期（原 Excel）'))+(wDiff?'<span class="pill r">與系統判定不同</span>':'')],['服務廠',dash(g('服務廠'))],['服務專員',dash(g('服務專員'))],['指定服專',dash(g('指定服專'))]])}</section>`);
  grid.append(vcard);
  const s=el(`<section class="panel"><div class="panel-h"><h2>回廠與消費</h2><p>12 個月＝2025-08-18～2026-08-18 工單</p></div>${kv([
    ['最後定保日期',dash(g('最後定保日期'))],['上次定保里程',g('上次定保里程')?fmt(+g('上次定保里程'))+' km':'—'],['前一工單日期',dash(g('前一工單日期'))],['距上次回廠',g('距上次回廠天數')?fmt(+g('距上次回廠天數'))+' 天':'—'],['一年回廠定保次數',dash(g('一年回廠定保次數'))],['定保頻率',dash(g('定保頻率'))],['近 3 個月消費',g('近3個月消費')?'NT$'+fmt(+g('近3個月消費')):'—'],['美容一年消費',g('美容一年消費')?'NT$'+fmt(+g('美容一年消費'))+'（'+esc(g('美容消費等級'))+'）':'—'],['輪胎',g('輪胎年更換次數')?`一年換 ${esc(g('輪胎年更換次數'))} 次，最後 ${dash(g('輪胎最後更換'))}`:'一年內未更換'],['電瓶',g('電瓶年更換次數')?`一年換 ${esc(g('電瓶年更換次數'))} 次，最後 ${dash(g('電瓶最後更換'))}`:'一年內未更換'],['12 個月工單',`${fmt(+g('12個月工單數'))} 張、NT$${fmt(+g('12個月工單金額'))}`],['其中定保／輪胎／電瓶／美容',`NT$${fmt(+g('12個月定保金額'))}／${fmt(+g('12個月輪胎金額'))}／${fmt(+g('12個月電瓶金額'))}／${fmt(+g('12個月美容金額'))}`]])}</section>`);
  holder.append(s);
  if(sameOwner.length>1){ const l=el(`<section class="panel"><div class="panel-h"><h2>同車主名下車輛</h2><p>依車主姓名＋手機比對，尚未經正式身分辨識${sameOwner.length>50?'；只列前 50 台':''}</p></div><div class="tbl-wrap"><table><thead><tr><th class="l">牌照號碼</th><th class="l">車型</th><th>車齡</th><th>最後里程</th><th class="l">保固狀態</th><th class="l">服務廠</th><th>12 個月金額</th></tr></thead><tbody>${sameOwner.slice(0,50).map(y=>`<tr class="click ${y===x?'other':''}" data-p="${esc(y.plate)}"><td class="l"><b>${esc(y.plate)}</b>${y===x?' <span class="pill n">本車</span>':''}</td><td class="l">${dash(y.model)}</td><td class="num">${isNaN(y.age)?'—':y.age.toFixed(1)+' 年'}</td><td class="num">${isNaN(y.km)?'—':fmt(y.km)}</td><td class="l">${wPill(y.w)}</td><td class="l">${dash(y.br)}</td><td class="num">${y.spend?'NT$'+fmt(y.spend):'—'}</td></tr>`).join('')}</tbody></table></div></section>`);
    l.querySelectorAll('tr.click').forEach(tr=>tr.onclick=()=>location.hash='#/lookup/'+encodeURIComponent(tr.dataset.p)); holder.append(l); }
  holder.querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>{const sp=holder.querySelector('#'+b.dataset.show); const full=sp.textContent===sp.dataset.full; sp.textContent=full?maskPhone(sp.dataset.full):sp.dataset.full; b.textContent=full?'顯示':'隱藏'});
}

buildNav();
addEventListener('hashchange',()=>{render(); window.scrollTo(0,0)});
let rt; addEventListener('resize',()=>{clearTimeout(rt); rt=setTimeout(()=>{ if(curRoute().id==='revenue') render(); },200)});
render();
})();
