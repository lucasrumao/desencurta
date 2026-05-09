const HK = 'desencurta_history';
    function loadHistory(){ try{return JSON.parse(localStorage.getItem(HK))||[];}catch{return[];} }
    function saveHistory(h){ localStorage.setItem(HK,JSON.stringify(h)); }
    function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2500); }
    function getDomain(url){ try{return new URL(url).hostname.replace(/^www\./,'');}catch{return url;} }
    function fmt(d){ return new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}); }

    function analyzeStatus(url){
      const domain=getDomain(url);
      const isHttps=url.startsWith('https://');
      const hasIP=/^\d{1,3}(\.\d{1,3}){3}$/.test(domain);
      const badTlds=['.xyz','.tk','.ml','.ga','.cf','.gq','.top','.click'];
      const tld=domain.includes('.')?'.'+domain.split('.').slice(-2).join('.'):'';
      const isBad=badTlds.some(t=>tld.endsWith(t));
      if(!isHttps||hasIP||isBad) return 'danger';
      return 'safe';
    }

    function renderList(filter=''){
      const container=document.getElementById('history-list');
      let h=loadHistory();
      if(filter) h=h.filter(i=>i.original.toLowerCase().includes(filter)||i.final.toLowerCase().includes(filter));

      if(!h.length){
        const isEmpty=loadHistory().length===0;
        container.innerHTML=`<div class="history-empty">
          <span class="material-symbols-outlined">manage_search</span>
          <div class="history-empty-title">${isEmpty?'Nenhum link ainda':'Nenhum resultado'}</div>
          <div class="history-empty-desc">${isEmpty?'Os links que você expandir na página inicial aparecerão aqui automaticamente.':'Tente uma busca diferente.'}</div>
          ${isEmpty?`<a href="index.html" class="btn-go-home"><span class="material-symbols-outlined">arrow_back</span>Ir para a página inicial</a>`:''}
        </div>`;
        return;
      }

      container.innerHTML=h.map((item,idx)=>{
        const status=analyzeStatus(item.final);
        const statusLabel=status==='safe'?'Seguro':status==='danger'?'Malicioso':'Desconhecido';
        const origShort=item.original.length>30?item.original.substring(0,30)+'...':item.original;
        return `<div class="h-item" onclick="goExpand('${esc(item.original)}')">
          <div class="h-item-left">
            <div class="h-icon ${status}">
              <span class="material-symbols-outlined">${status==='safe'?'verified_user':status==='danger'?'gpp_bad':'gpp_maybe'}</span>
            </div>
            <div class="h-info">
              <div class="h-meta">
                <span class="h-orig-pill">${esc(origShort)}</span>
                <span class="h-arrow"><span class="material-symbols-outlined">arrow_forward</span></span>
                <span class="h-final">${esc(getDomain(item.final))}</span>
              </div>
              <div class="h-status-row">
                <span class="h-badge ${status}"><span class="h-badge-dot"></span>${statusLabel}</span>
                <span class="h-date">${fmt(item.date)}</span>
              </div>
            </div>
          </div>
          <div class="h-actions" onclick="event.stopPropagation()">
            <button class="h-btn" title="Copiar URL final" onclick="copyUrl('${esc(item.final)}')">
              <span class="material-symbols-outlined">content_copy</span>
            </button>
            <button class="h-btn" title="Remover" onclick="removeItem(${idx})">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>`;
      }).join('');
    }

    function removeItem(idx){
      const h=loadHistory();
      const filtered=document.getElementById('search-input').value.toLowerCase();
      if(filtered){
        const all=h;
        const visible=all.filter(i=>i.original.toLowerCase().includes(filtered)||i.final.toLowerCase().includes(filtered));
        const toRemove=visible[idx];
        const globalIdx=all.indexOf(toRemove);
        if(globalIdx>-1) all.splice(globalIdx,1);
        saveHistory(all);
      }else{
        h.splice(idx,1);
        saveHistory(h);
      }
      renderList(document.getElementById('search-input').value.toLowerCase());
      showToast('Item removido');
    }

    function copyUrl(url){ navigator.clipboard.writeText(url).then(()=>showToast('URL copiada!')); }
    function goExpand(url){ window.location.href=`index.html?url=${encodeURIComponent(url)}`; }

    document.getElementById('search-input').addEventListener('input',e=>renderList(e.target.value.toLowerCase()));
    document.getElementById('btn-clear-all').addEventListener('click',()=>{
      if(!confirm('Apagar todo o histórico?')) return;
      localStorage.removeItem(HK);
      renderList();
      showToast('Histórico limpo');
    });

    renderList();