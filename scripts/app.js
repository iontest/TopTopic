const storageKey = 'btao_projects_v1';
const projectsGrid = document.getElementById('projectsGrid');
const addBtn = document.getElementById('addBtn');
const modal = document.getElementById('modal');
const cancelBtn = document.getElementById('cancelBtn');
const addRepoBtn = document.getElementById('addRepoBtn');
const repoLinkInput = document.getElementById('repoLink');
const topicsInput = document.getElementById('topicsInput');
const modalMsg = document.getElementById('modalMsg');
const toast = document.getElementById('toast');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
function loadProjects(){
  const raw = localStorage.getItem(storageKey);
  if(!raw) return [];
  try{
    const arr = JSON.parse(raw);
    if(Array.isArray(arr)) return arr;
    return [];
  }catch(e){
    return [];
  }
}
function saveProjects(list){
  localStorage.setItem(storageKey, JSON.stringify(list));
}
function showToast(text, time=2800){
  toast.textContent = text;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.add('hidden'), time);
}
function normalizeRepoInput(input){
  input = input.trim();
  if(input.startsWith('https://') || input.startsWith('http://')){
    try{
      const url = new URL(input);
      const parts = url.pathname.split('/').filter(Boolean);
      if(parts.length>=2) return `${parts[0]}/${parts[1]}`;
    }catch(e){
      return null;
    }
  }else{
    const parts = input.split('/').filter(Boolean);
    if(parts.length===2) return `${parts[0]}/${parts[1]}`;
  }
  return null;
}
async function fetchRepo(fullName){
  const api = `https://api.github.com/repos/${fullName}`;
  const resp = await fetch(api);
  if(resp.status===404) throw new Error('Repository not found');
  if(!resp.ok) throw new Error('GitHub API error: '+resp.status);
  const data = await resp.json();
  return data;
}
function renderProjects(list){
  projectsGrid.innerHTML = '';
  if(!list.length){
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = '<strong>Sem projetos</strong><div style="margin-top:8px">Clique no botão + para adicionar repositórios.</div>';
    projectsGrid.appendChild(empty);
    return;
  }
  list.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.tabIndex = 0;
    const top = document.createElement('div');
    top.className = 'repo-top';
    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = p.ownerAvatar || p.avatar || '';
    avatar.alt = p.full_name;
    const title = document.createElement('div');
    title.className = 'repo-title';
    title.textContent = p.full_name;
    const desc = document.createElement('div');
    desc.className = 'repo-desc';
    desc.textContent = p.description || '';
    const meta = document.createElement('div');
    meta.className = 'meta';
    const stars = document.createElement('div');
    stars.className = 'stars';
    stars.textContent = `★ ${p.stars || 0}`;
    top.appendChild(avatar);
    top.appendChild(title);
    card.appendChild(top);
    card.appendChild(desc);
    const tagContainer = document.createElement('div');
    tagContainer.className = 'meta';
    const topics = Array.isArray(p.topics) ? p.topics : [];
    topics.slice(0,6).forEach(t=>{
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.textContent = t;
      tag.addEventListener('click', ev=>{
        ev.stopPropagation();
        window.location.href = `../pages/app.html?topic=${encodeURIComponent(t)}`;
      });
      tagContainer.appendChild(tag);
    });
    tagContainer.appendChild(stars);
    card.appendChild(tagContainer);
    card.addEventListener('click', ()=>{
      const firstTopic = (Array.isArray(p.topics) && p.topics[0]) || null;
      if(firstTopic){
        window.location.href = `../pages/app.html?topic=${encodeURIComponent(firstTopic)}`;
      }else{
        window.open(p.html_url || '#','_blank');
      }
    });
    projectsGrid.appendChild(card);
  });
}
function refreshUI(){
  const all = loadProjects();
  const filter = (searchInput.value || '').trim().toLowerCase();
  const filtered = all.filter(p=>{
    if(!filter) return true;
    if((p.full_name||'').toLowerCase().includes(filter)) return true;
    const topics = Array.isArray(p.topics) ? p.topics.join(' ') : '';
    if(topics.toLowerCase().includes(filter)) return true;
    return false;
  });
  renderProjects(filtered);
}
addBtn.addEventListener('click', ()=>{
  modal.classList.remove('hidden');
  repoLinkInput.value = '';
  topicsInput.value = '';
  modalMsg.textContent = '';
});
cancelBtn.addEventListener('click', ()=>modal.classList.add('hidden'));
window.addEventListener('click', e=>{
  if(e.target===modal) modal.classList.add('hidden');
});
addRepoBtn.addEventListener('click', async ()=>{
  modalMsg.textContent = '';
  const raw = repoLinkInput.value.trim();
  const normalized = normalizeRepoInput(raw);
  if(!normalized){
    modalMsg.textContent = 'Formato inválido. Use owner/repo ou link completo.';
    return;
  }
  addRepoBtn.disabled = true;
  try{
    const data = await fetchRepo(normalized);
    const topicsRaw = (topicsInput.value || '').split(',').map(s=>s.trim()).filter(Boolean);
    const stored = loadProjects();
    const exists = stored.find(p=>p.full_name && p.full_name.toLowerCase()===data.full_name.toLowerCase());
    if(exists){
      modalMsg.textContent = 'Repositório já adicionado.';
      addRepoBtn.disabled = false;
      return;
    }
    const item = {
      id: `${data.full_name}@${Date.now()}`,
      full_name: data.full_name,
      description: data.description,
      html_url: data.html_url,
      stars: data.stargazers_count || 0,
      ownerAvatar: data.owner && data.owner.avatar_url,
      topics: topicsRaw.length ? topicsRaw : (data.topics || []),
      addedAt: new Date().toISOString()
    };
    stored.unshift(item);
    saveProjects(stored);
    refreshUI();
    modal.classList.add('hidden');
    showToast('Repositório adicionado');
  }catch(err){
    modalMsg.textContent = err.message || 'Erro';
  }finally{
    addRepoBtn.disabled = false;
  }
});
searchInput.addEventListener('input', refreshUI);
clearBtn.addEventListener('click', ()=>{
  searchInput.value = '';
  refreshUI();
});
document.addEventListener('DOMContentLoaded', ()=>{
  refreshUI();
  const params = new URLSearchParams(window.location.search);
  const topic = params.get('topic');
  if(topic){
    fetchTopicPage(topic);
  }
});
async function fetchTopicPage(topic){
  const q = `topic:${encodeURIComponent(topic)}`;
  const api = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=100`;
  projectsGrid.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'empty';
  header.innerHTML = `<strong>Repositórios para tópico: ${topic}</strong><div style="margin-top:8px">Carregando…</div>`;
  projectsGrid.appendChild(header);
  try{
    const resp = await fetch(api);
    if(!resp.ok) throw new Error('GitHub API error: '+resp.status);
    const data = await resp.json();
    const items = data.items || [];
    if(!items.length){
      header.innerHTML = `<strong>Nenhum repositório encontrado para: ${topic}</strong>`;
      return;
    }
    const listFragment = document.createDocumentFragment();
    items.forEach(it=>{
      const card = document.createElement('div');
      card.className = 'card';
      const top = document.createElement('div');
      top.className = 'repo-top';
      const avatar = document.createElement('img');
      avatar.className = 'avatar';
      avatar.src = it.owner && it.owner.avatar_url;
      const title = document.createElement('div');
      title.className = 'repo-title';
      title.innerHTML = `<a href="${it.html_url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${it.full_name}</a>`;
      const desc = document.createElement('div');
      desc.className = 'repo-desc';
      desc.textContent = it.description || '';
      const meta = document.createElement('div');
      meta.className = 'meta';
      const stars = document.createElement('div');
      stars.className = 'stars';
      stars.textContent = `★ ${it.stargazers_count || 0}`;
      top.appendChild(avatar);
      top.appendChild(title);
      card.appendChild(top);
      card.appendChild(desc);
      const topics = (it.topics || []).slice(0,6);
      topics.forEach(t=>{
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.textContent = t;
        tag.addEventListener('click', ev=>{
          ev.stopPropagation();
          window.location.href = `../pages/app.html?topic=${encodeURIComponent(t)}`;
        });
        meta.appendChild(tag);
      });
      meta.appendChild(stars);
      card.appendChild(meta);
      listFragment.appendChild(card);
    });
    projectsGrid.innerHTML = '';
    projectsGrid.appendChild(listFragment);
  }catch(e){
    projectsGrid.innerHTML = `<div class="empty"><strong>Erro ao buscar por tópico</strong><div style="margin-top:8px">${e.message}</div></div>`;
  }
}
