// Minimal browser console for the KV store. The token is kept in localStorage
// and sent as a Bearer header — never persisted server-side.
export const dashboardHtml = /* html */ `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>kv</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;font:14px/1.5 ui-sans-serif,system-ui,sans-serif;background:#0b0f17;color:#e5e7eb}
header{padding:18px 24px;border-bottom:1px solid #1f2937;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
h1{margin:0;font-size:18px}
input,textarea{background:#0b0f17;border:1px solid #374151;color:#e5e7eb;border-radius:8px;padding:8px;font:inherit}
textarea{font-family:ui-monospace,monospace}
button{background:#2563eb;border:0;color:#fff;padding:8px 12px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#1d4ed8}button.mini{background:#374151;padding:4px 9px;font-size:12px}
main{padding:20px 24px;max-width:900px;margin:0 auto;display:grid;grid-template-columns:280px 1fr;gap:20px}
@media(max-width:760px){main{grid-template-columns:1fr}}
.k{padding:8px;border:1px solid #1f2937;border-radius:8px;margin-bottom:6px;cursor:pointer;font-family:ui-monospace,monospace;font-size:13px}
.k:hover{border-color:#374151}.muted{color:#6b7280}.err{color:#ef4444}
</style></head><body>
<header><h1>🗄️ kv</h1>
  <input id="token" type="password" placeholder="KV_TOKEN" style="flex:1;min-width:160px"/>
  <button id="save-tok" class="mini">salvar token</button>
</header>
<main>
  <div>
    <div style="display:flex;gap:6px;margin-bottom:10px">
      <input id="new-key" placeholder="nova chave" style="flex:1"/><button id="new-btn" class="mini">novo</button>
    </div>
    <div id="keys"></div>
  </div>
  <div>
    <div id="cur" class="muted" style="margin-bottom:6px">Selecione uma chave.</div>
    <textarea id="val" style="width:100%;min-height:220px" placeholder='{"json":"aqui"}'></textarea>
    <div style="margin-top:8px;display:flex;gap:6px">
      <input id="ttl" type="number" placeholder="ttl (s, opcional)" style="width:150px"/>
      <button id="put">salvar valor</button><button id="del" class="mini">deletar</button>
    </div>
    <div id="msg"></div>
  </div>
</main>
<script>
var tok=localStorage.getItem('kv_token')||'';document.getElementById('token').value=tok;var sel=null;
function H(){return {'authorization':'Bearer '+document.getElementById('token').value};}
document.getElementById('save-tok').onclick=function(){localStorage.setItem('kv_token',document.getElementById('token').value);load();};
async function load(){
  var r=await fetch('/api/kv',{headers:H()});
  if(r.status===401){document.getElementById('keys').innerHTML='<div class="err">Token inválido.</div>';return;}
  var d=await r.json();
  document.getElementById('keys').innerHTML=d.keys.map(function(k){return '<div class="k" data-k="'+encodeURIComponent(k.key)+'">'+k.key+' <span class="muted">('+k.bytes+'b)</span></div>';}).join('')||'<div class="muted">vazio</div>';
  document.querySelectorAll('.k').forEach(function(el){el.onclick=function(){open(decodeURIComponent(el.dataset.k));};});
}
async function open(key){
  sel=key;document.getElementById('cur').textContent=key;
  var r=await fetch('/api/kv/'+key.split('/').map(encodeURIComponent).join('/'),{headers:H()});
  var d=await r.json();document.getElementById('val').value=r.ok?JSON.stringify(d.value,null,2):'';
}
document.getElementById('new-btn').onclick=function(){var k=document.getElementById('new-key').value.trim();if(k){sel=k;document.getElementById('cur').textContent=k;document.getElementById('val').value='';}};
document.getElementById('put').onclick=async function(){
  if(!sel)return;var msg=document.getElementById('msg');
  var ttl=document.getElementById('ttl').value;
  var r=await fetch('/api/kv/'+sel.split('/').map(encodeURIComponent).join('/')+(ttl?('?ttl='+ttl):''),{method:'PUT',headers:H(),body:document.getElementById('val').value});
  msg.innerHTML=r.ok?'<span class="muted">salvo ✓</span>':'<span class="err">'+((await r.json()).error)+'</span>';load();
};
document.getElementById('del').onclick=async function(){if(!sel)return;await fetch('/api/kv/'+sel.split('/').map(encodeURIComponent).join('/'),{method:'DELETE',headers:H()});sel=null;document.getElementById('val').value='';document.getElementById('cur').textContent='Selecione uma chave.';load();};
load();
</script></body></html>`;
