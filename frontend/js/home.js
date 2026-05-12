 /* ── CONFIG ── */
    const API_BASE = 'https://desencurta.onrender.com';

    /* ── PANELS ── */
    function openPanel(id){
      closeAllPanels(false);
      document.getElementById(id)?.classList.add('open');
      document.getElementById('overlay').classList.add('active');
      document.body.style.overflow='hidden';
    }
    function closeAllPanels(restore=true){
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('open'));
      document.getElementById('overlay').classList.remove('active');
      if(restore) document.body.style.overflow='';
    }
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAllPanels();});

    /* ── TOAST ── */
    function showToast(msg){
      const t=document.getElementById('toast');
      t.textContent=msg; t.classList.add('show');
      setTimeout(()=>t.classList.remove('show'),2500);
    }

    /* ── HISTORY ── */
    const HK='desencurta_history';
    function loadHistory(){try{return JSON.parse(localStorage.getItem(HK))||[];}catch{return[];}}
    function saveHistory(orig,fin){
      const h=loadHistory();
      h.unshift({original:orig,final:fin,date:new Date().toISOString()});
      if(h.length>30)h.pop();
      localStorage.setItem(HK,JSON.stringify(h));
      renderHistory();
    }
    function renderHistory(){
      const body=document.getElementById('history-body');
      const h=loadHistory();
      if(!h.length){
        body.innerHTML=`<div class="h-empty"><span class="material-symbols-outlined">manage_search</span><div class="h-empty-title">Nenhum link ainda</div><div class="h-empty-desc">Os links que você expandir aparecerão aqui.</div></div>`;
        return;
      }
      const fmt=d=>new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
      body.innerHTML=`<div class="h-list">${h.map(item=>`<div class="h-item" onclick="fillAndExpand('${esc(item.original)}')"><div class="h-orig">${esc(item.original)}</div><div class="h-final">${esc(item.final)}</div><div class="h-date">${fmt(item.date)}</div></div>`).join('')}</div><button class="btn-clear-h" onclick="clearHistory()"><span class="material-symbols-outlined" style="font-size:15px">delete</span>Limpar histórico</button>`;
    }
    function clearHistory(){localStorage.removeItem(HK);renderHistory();showToast('Histórico limpo');}
    function fillAndExpand(url){document.getElementById('url-input').value=url;closeAllPanels();expandUrl();}
    function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

    /* ── HELPERS ── */
    function isValidUrl(s){try{const u=new URL(s);return u.protocol==='http:'||u.protocol==='https:';}catch{return false;}}
    function getDomain(url){try{return new URL(url).hostname.replace(/^www\./,'');}catch{return url;}}
    function getTLD(url){try{const p=new URL(url).hostname.split('.');return'.'+p.slice(-2).join('.');}catch{return'';}}
    function statusLabel(c){return{301:'Mov. Permanente',302:'Mov. Temporária',303:'See Other',307:'Redir. Temporário',308:'Redir. Permanente',200:'OK'}[c]||`HTTP ${c}`;}

    /* ── SECURITY SCORE ── */
    function analyzeScore(finalUrl){
      const domain=getDomain(finalUrl),tld=getTLD(finalUrl);
      const checks=[
        {label:'Conexão HTTPS',pass:finalUrl.startsWith('https://')},
        {label:'Sem IP direto',pass:!/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)},
        {label:'TLD confiável',pass:!['.xyz','.tk','.ml','.ga','.cf','.gq','.top','.click'].some(t=>tld.endsWith(t))},
        {label:'Domínio estruturado',pass:domain.split('.').length<=3},
      ];
      const score=checks.filter(c=>c.pass).length;
      const cls=score===4?'safe':score>=2?'warning':'danger';
      return{checks,score,cls,label:score===4?'Seguro':score>=2?'Atenção':'Suspeito'};
    }

  /* ── PREVIEW VIA BACKEND ── */
async function fetchPreview(url) {
  try {
    
    // 1. Tenta o seu backend primeiro
    const res = await fetch(`${API_BASE}/preview?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    const data = await res.json();

    // 2. Se não veio imagem, tenta o Microlink só para isso
    if (!data.image) {
  try {
    const cleanUrl = (() => {
      try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
          const v = u.searchParams.get('v') || u.pathname.replace('/', '');
          if (v) return { type: 'youtube', id: v };
        }
        return { type: 'other', url };
      } catch { return { type: 'other', url }; }
    })();

    if (cleanUrl.type === 'youtube') {
      // Thumbnail pública do YouTube, sem precisar do Microlink
      data.image = `https://img.youtube.com/vi/${cleanUrl.id}/maxresdefault.jpg`;
    } else {
      const ml = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(cleanUrl.url)}`, {
        signal: AbortSignal.timeout(6000)
      });
      const mlJson = await ml.json();
      if (mlJson.status === 'success' && mlJson.data?.image?.url) {
        data.image = mlJson.data.image.url;
      }
    }
  } catch { /* sem imagem */ }
}

    return data;
  } catch { return null; }
}

    function buildPreviewBlock(meta){
      if(!meta||(!meta.title&&!meta.description&&!meta.image)) return '';
      const title=meta.title||'';
      const desc=meta.description||'';
      const imgUrl=meta.image||'';
      const imgHtml=imgUrl
        ? `<img class="preview-img" src="${imgUrl}" alt="${title}" onerror="this.parentElement.innerHTML='<div class=preview-placeholder><span class=material-symbols-outlined>image</span></div>'" />`
        : `<div class="preview-placeholder"><span class="material-symbols-outlined">image</span></div>`;
      return `<div class="r-preview">
        ${imgHtml}
        <div style="flex:1;min-width:0">
          ${title?`<div class="preview-title">${title}</div>`:''}
          ${desc?`<div class="preview-desc">${desc}</div>`:''}
          <div class="preview-url">${meta.url||''}</div>
        </div>
      </div>`;
    }

    /* ── RENDER LOADING ── */
    function showResult(html){
      const s=document.getElementById('result-section');
      document.getElementById('result-container').innerHTML=html;
      s.classList.add('visible');
      setTimeout(()=>s.scrollIntoView({behavior:'smooth',block:'nearest'}),50);
    }
    function showLoading(){
      showResult(`<div class="loading-card"><div class="spinner"></div><div class="loading-label">Expandindo URL… (pode levar até 60s na primeira vez)</div><div class="l-steps"><div class="l-step active" id="ls1"><span class="l-dot"></span>Resolvendo redirecionamentos</div><div class="l-step" id="ls2"><span class="l-dot"></span>Coletando metadados</div><div class="l-step" id="ls3"><span class="l-dot"></span>Analisando segurança</div></div></div>`);
      let step=1;
      const iv=setInterval(()=>{
        const p=document.getElementById(`ls${step}`);
        if(p){p.classList.remove('active');p.classList.add('done');}
        step++;
        const c=document.getElementById(`ls${step}`);
        if(c)c.classList.add('active');
        if(step>=3)clearInterval(iv);
      },700);
    }
    function showError(title,detail){
      showResult(`<div class="error-card"><div class="err-ico"><span class="material-symbols-outlined">error</span></div><div><div class="err-title">${title}</div>${detail?`<div class="err-msg">${detail}</div>`:''}</div></div>`);
    }

    /* ── RENDER SAFE RESULT ── */
    function renderSafeResult(data, meta){
      const {checks,score,cls,label}=analyzeScore(data.finalUrl);
      const domain=getDomain(data.finalUrl),tld=getTLD(data.finalUrl);
      const hops=data.redirects?.length||0;
      const favicon=`https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      const pct=(score/4*100).toFixed(0);

      const chainItems=(()=>{
        if(!data.redirects?.length) return`<p style="font-size:13px;color:var(--outline)">Nenhum redirecionamento — URL direta.</p>`;
        const all=[...data.redirects,{url:data.finalUrl,statusCode:200}];
        return all.map((hop,i)=>{
          const isFirst=i===0,isLast=i===all.length-1;
          const url=typeof hop==='string'?hop:hop.url;
          const code=typeof hop==='object'?hop.statusCode:'';
          return`<div class="chain-item ${isFirst?'first':isLast?'last':''}"><div class="chain-spine"><div class="chain-dot"></div>${!isLast?'<div class="chain-line"></div>':''}</div><div class="chain-body"><div class="chain-url">${url}</div><div class="chain-code-row">${!isLast?`<span class="http-code">${code}</span>`:''}<span class="http-lbl">${statusLabel(code)}</span></div></div></div>`;
        }).join('');
      })();

      const checksHtml=checks.map(c=>`<div class="check-row ${c.pass?'pass':'fail'}"><span class="material-symbols-outlined">${c.pass?'check_circle':'cancel'}</span>${c.label}</div>`).join('');
      const previewHtml=buildPreviewBlock(meta);

      showResult(`<div class="result-card">
        <div class="r-header">
          <div class="r-status">
            <span class="status-pill ${cls}"><span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block"></span>${label}</span>
            <span class="r-hops">${hops} redirect${hops!==1?'s':''}</span>
          </div>
          <div class="r-actions">
            <button class="btn-sm" onclick="copyUrl('${data.finalUrl.replace(/'/g,"\\'")}')"><span class="material-symbols-outlined">content_copy</span>Copiar</button>
           <a href="${data.finalUrl}" target="_blank" rel="noopener noreferrer" class="btn-sm"><span class="material-symbols-outlined">open_in_new</span>Abrir</a>
           <button class="btn-sm" onclick="copyShareUrl('${data.originalUrl?.replace(/'/g,"\\'")||raw.replace(/'/g,"\\'")}')"><span class="material-symbols-outlined">share</span>Compartilhar</button>
          </div>
        </div>
        ${previewHtml}
        <div class="r-url">
          <div class="block-label">URL final</div>
          <a href="${data.finalUrl}" target="_blank" rel="noopener noreferrer" class="final-url">${data.finalUrl}</a>
          <div class="domain-row">
            <img class="domain-fav" src="${favicon}" alt="" onerror="this.style.display='none'" />
            <span class="domain-name">${domain}</span>
            <span class="domain-tld">${tld}</span>
          </div>
        </div>
        <div class="r-meta">
          <div class="meta-cell"><div class="meta-lbl">Status HTTP</div><div class="meta-val mono">${data.statusCode||200}</div></div>
          <div class="meta-cell"><div class="meta-lbl">Redirects</div><div class="meta-val">${hops} ${hops===1?'salto':'saltos'}</div></div>
          <div class="meta-cell"><div class="meta-lbl">Domínio</div><div class="meta-val">${domain}</div></div>
          <div class="meta-cell"><div class="meta-lbl">Segurança</div><div class="meta-val" style="color:${cls==='safe'?'var(--green)':cls==='warning'?'var(--amber)':'var(--red)'}">${pct}%</div></div>
        </div>
        <div class="r-security">
          <div class="score-top"><div class="block-label" style="margin:0">Score de segurança</div><span style="font-size:13px;font-weight:600;color:${cls==='safe'?'var(--green)':cls==='warning'?'var(--amber)':'var(--red)'}">${score}/4 — ${label}</span></div>
          <div class="score-track"><div class="score-fill ${cls}" id="score-fill" style="width:0%"></div></div>
          <div class="score-checks">${checksHtml}</div>
        </div>
        <div class="r-chain">
          <div class="block-label">Cadeia de redirecionamentos</div>
          <div class="chain-list">${chainItems}</div>
        </div>
      </div>`);

      requestAnimationFrame(()=>{
        setTimeout(()=>{const f=document.getElementById('score-fill');if(f)f.style.width=pct+'%';},300);
      });
    }

    /* ── RENDER DANGER RESULT ── */
    function renderDangerResult(data){
      const domain=getDomain(data.finalUrl);
      const hops=data.redirects?.length||0;

      const chainItems=(()=>{
        if(!data.redirects?.length) return`<div class="chain-item danger-hop"><div class="chain-spine"><div class="chain-dot"></div></div><div class="chain-body"><div class="chain-url">${data.finalUrl}</div><div class="chain-code-row"><span class="http-lbl" style="color:var(--red)">⚠ AMEAÇA DETECTADA</span></div></div></div>`;
        const all=[...data.redirects,{url:data.finalUrl,statusCode:200}];
        return all.map((hop,i)=>{
          const isFirst=i===0,isLast=i===all.length-1;
          const url=typeof hop==='string'?hop:hop.url;
          const code=typeof hop==='object'?hop.statusCode:'';
          const isDanger=isLast||url.includes('.xyz')||url.includes('.tk')||url.includes('.ml');
          return`<div class="chain-item ${isFirst?'first':''} ${isDanger&&isLast?'danger-hop':''}"><div class="chain-spine"><div class="chain-dot"></div>${!isLast?'<div class="chain-line"></div>':''}</div><div class="chain-body"><div class="chain-url" style="${isDanger&&isLast?'color:var(--red);font-weight:600':''}">${url}</div><div class="chain-code-row">${!isLast?`<span class="http-code">${code}</span>`:''}<span class="http-lbl" style="${isDanger&&isLast?'color:var(--red)':''}">  ${isDanger&&isLast?'⚠ AMEAÇA DETECTADA':statusLabel(code)}</span></div></div></div>`;
        }).join('');
      })();

      showResult(`<div class="danger-card">
        <div class="danger-header">
          <div class="danger-icon-wrap"><span class="material-symbols-outlined" style="font-size:36px">report</span></div>
          <h2 class="danger-title">Ameaça Detectada</h2>
          <p class="danger-subtitle">Nossos sistemas identificaram riscos graves neste link. Recomendamos cautela imediata.</p>
        </div>
        <div class="danger-url-block">
          <div class="block-label">URL analisada</div>
          <div class="danger-url-pill">
            <span class="material-symbols-outlined" style="color:var(--red);flex-shrink:0">link_off</span>
            <code class="danger-url-text">${data.finalUrl}</code>
            <span class="danger-risk-badge">ALTO RISCO</span>
          </div>
        </div>
        <div class="danger-grid">
          <div class="danger-cell">
            <div class="danger-cell-title"><span class="material-symbols-outlined">phishing</span>Phishing</div>
            <div class="danger-cell-desc">Página pode estar mimetizando um portal legítimo para roubo de credenciais e dados pessoais.</div>
          </div>
          <div class="danger-cell">
            <div class="danger-cell-title"><span class="material-symbols-outlined">bug_report</span>Malware</div>
            <div class="danger-cell-desc">Scripts suspeitos detectados que podem tentar instalar softwares indesejados no seu dispositivo.</div>
          </div>
        </div>
        <div class="danger-chain r-chain">
          <div class="block-label">Caminho do link</div>
          <div class="chain-list">${chainItems}</div>
        </div>
        <div class="danger-actions">
          <button class="btn-back" onclick="resetForm()"><span class="material-symbols-outlined">home</span>Voltar ao início</button>
          <button class="btn-ignore" onclick="window.open('${data.finalUrl}','_blank')"><span class="material-symbols-outlined">report_off</span>Ignorar aviso</button>
        </div>
      </div>`);
    }

    /* ── EXPAND ── */
    async function expandUrl(){
      const raw=document.getElementById('url-input').value.trim();
      window._lastRaw = raw;
      const btn=document.getElementById('btn-expand');
      if(!raw){document.getElementById('url-input').focus();return;}
      if(!isValidUrl(raw)){
        showError('URL inválida','Verifique se começa com http:// ou https://');
        document.getElementById('result-section').classList.add('visible');
        return;
      }
      btn.disabled=true;
      showLoading();
      try{
        const res=await fetch(`${API_BASE}/expand?url=${encodeURIComponent(raw)}`,{signal:AbortSignal.timeout(60000)});
        if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.message||`Erro HTTP ${res.status}`);}
        const data=await res.json();

        // Analisar segurança
        const {score}=analyzeScore(data.finalUrl);
        const isDangerous=score<=1;

        if(isDangerous){
          renderDangerResult(data);
        }else{
          // Buscar preview do Microlink em paralelo
          const meta=await fetchPreview(data.finalUrl);
          renderSafeResult(data,meta);
          saveHistory(raw,data.finalUrl);
        }
      }catch(err){
        if(err.name==='TimeoutError') showError('Tempo limite excedido','O servidor demorou muito. Tente novamente em alguns segundos.');
        else if(err.name==='TypeError'&&err.message.toLowerCase().includes('fetch')) showError('Backend inacessível','Não foi possível conectar ao servidor.');
        else showError('Falha ao expandir',err.message||'Verifique a URL e tente novamente.');
      }finally{btn.disabled=false;}
    }

    function resetForm(){
      document.getElementById('url-input').value='';
      document.getElementById('result-section').classList.remove('visible');
      window.scrollTo({top:0,behavior:'smooth'});
    }
    function copyUrl(url){navigator.clipboard.writeText(url).then(()=>showToast('URL copiada!'));}

    /* ── EVENTS ── */
    document.getElementById('btn-expand').addEventListener('click',expandUrl);
    document.getElementById('url-input').addEventListener('keydown',e=>{if(e.key==='Enter')expandUrl();});
    document.getElementById('url-input').addEventListener('paste',()=>{
      setTimeout(()=>{const v=document.getElementById('url-input').value.trim();if(v&&isValidUrl(v))expandUrl();},80);
    });
    document.querySelectorAll('.stag').forEach(t=>{
      t.addEventListener('click',()=>{document.getElementById('url-input').value=t.dataset.url;expandUrl();});
    });

    if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
    /* ── COMPARTILHAR RESULTADO ── */
function copyShareUrl() {
  const shareUrl = `https://desencurta.vercel.app/?url=${encodeURIComponent(window._lastRaw)}`;
  navigator.clipboard.writeText(shareUrl).then(() => showToast('Link de compartilhamento copiado! ✓'));
}

/* ── DETECTA ?url= NA ABERTURA DA PÁGINA ── */
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (urlParam && isValidUrl(urlParam)) {
    document.getElementById('url-input').value = urlParam;
    setTimeout(() => expandUrl(), 500);
  }
});

renderHistory();