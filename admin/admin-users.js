/* ════════════════════════════════════════════════════════════════════
   ALVATOWASH — GESTIÓN DE USUARIOS ADMIN
   ──────────────────────────────────────────────────────────────────
   Solo visible para superadmin. Lista usuarios, crear, eliminar.
═════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const CSS = `
.au-root{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#1D1D1F}
.au-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:14px}
.au-eye{font-size:11.5px;font-weight:700;color:#86868B;letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px}
.au-title{font-size:22px;font-weight:600;letter-spacing:-.5px;line-height:1.1}
.au-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;background:#DC2626;color:#fff;font-weight:600;font-size:13.5px;border-radius:10px;border:none;cursor:pointer;font-family:inherit;letter-spacing:-.1px;transition:background .12s}
.au-btn:hover{background:#991B1B}
.au-btn svg{width:14px;height:14px;stroke-width:2.4}

.au-card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:16px;overflow:hidden}
.au-row{display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid rgba(0,0,0,.04)}
.au-row:last-child{border-bottom:none}
.au-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;flex-shrink:0}
.au-avatar.super{background:linear-gradient(135deg,#FFD700,#D4A017);color:#1D1D1F}
.au-avatar.enc{background:linear-gradient(135deg,#DC2626,#991B1B)}
.au-info{flex:1;min-width:0}
.au-name{font-size:14.5px;font-weight:600;letter-spacing:-.2px;line-height:1.2}
.au-meta{font-size:12px;color:#86868B;margin-top:2px}
.au-role{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:99px;letter-spacing:.3px;text-transform:uppercase}
.au-role.super{background:rgba(255,215,0,.15);color:#9C5F00}
.au-role.enc{background:rgba(220,38,38,.1);color:#991B1B}
.au-del{background:transparent;border:1px solid rgba(0,0,0,.1);color:#FF3B30;font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:inherit;transition:background .12s}
.au-del:hover{background:rgba(255,69,58,.06)}
.au-del:disabled{opacity:.35;cursor:not-allowed}

.au-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(8px);z-index:300;display:none;align-items:flex-end;justify-content:center;padding:0}
@media(min-width:760px){.au-overlay{align-items:center;padding:20px}}
.au-overlay.show{display:flex}
.au-modal{background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:440px;padding:20px 22px;animation:auUp .3s cubic-bezier(.22,1,.36,1)}
@media(min-width:760px){.au-modal{border-radius:20px}}
@keyframes auUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
.au-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.au-modal-title{font-size:18px;font-weight:600;letter-spacing:-.3px}
.au-x{width:32px;height:32px;background:rgba(0,0,0,.05);border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer}
.au-x svg{width:14px;height:14px;stroke-width:2.5}
.au-field{margin-bottom:13px}
.au-field label{display:block;font-size:12px;font-weight:600;color:#424245;margin-bottom:5px;letter-spacing:-.1px}
.au-input{width:100%;padding:11px 13px;border:1px solid rgba(0,0,0,.1);border-radius:9px;font-size:14.5px;outline:none;font-family:inherit;background:#FAFAFA;transition:border-color .12s,background .12s}
.au-input:focus{border-color:#DC2626;background:#fff}
.au-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.au-err{font-size:12.5px;color:#FF3B30;text-align:center;min-height:18px;margin-top:6px}
.au-actions{display:flex;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(0,0,0,.06)}
.au-actions button{flex:1;padding:11px;border-radius:10px;font-weight:600;font-size:13.5px;border:none;cursor:pointer;font-family:inherit;letter-spacing:-.1px}
.au-actions .au-cancel{background:#FAFAFA;color:#424245}
.au-actions .au-save{background:#DC2626;color:#fff}
.au-actions .au-save:hover{background:#991B1B}
.au-actions .au-save:disabled{opacity:.4;cursor:not-allowed}

.au-empty{padding:40px 22px;text-align:center;color:#86868B;font-size:13.5px}
`;

(function injectCss(){
  if (document.getElementById('au-styles')) return;
  const s = document.createElement('style'); s.id='au-styles'; s.textContent=CSS;
  document.head.appendChild(s);
})();

let USERS = [];

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

async function loadUsers(){
  if (!window.bgCall) return;
  try {
    const r = await window.bgCall('getAdminUsers');
    USERS = (r && r.users) || [];
  } catch(e) { USERS = []; }
}

async function render(){
  const root = document.getElementById('adminUsersRoot');
  if (!root) return;

  /* Solo superadmin puede ver esta sección */
  if (!window.CURRENT_USER || window.CURRENT_USER.rol !== 'superadmin') {
    root.innerHTML = '<div class="au-empty">Esta sección es solo para super admins</div>';
    return;
  }

  root.innerHTML = `<div class="au-root"><div class="au-empty">Cargando usuarios...</div></div>`;
  await loadUsers();

  const centrosCfg = (window.CONFIG && window.CONFIG.centros) || [];

  root.innerHTML = `
    <div class="au-root">
      <div class="au-head">
        <div>
          <div class="au-eye">Equipo administrativo</div>
          <div class="au-title">${USERS.length} usuario${USERS.length===1?'':'s'}</div>
        </div>
        <button class="au-btn" id="auBtnNew">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo usuario
        </button>
      </div>

      ${USERS.length === 0 ? `<div class="au-empty">No hay usuarios admin todavía</div>` : `
        <div class="au-card">
          ${USERS.map(u => {
            const isSuper = u.rol === 'superadmin';
            const initials = String(u.nombre || u.usuario).split(' ').map(p=>p[0]||'').join('').slice(0,2).toUpperCase();
            const centro = centrosCfg.find(c => c.id === u.centro);
            const centroLabel = isSuper ? 'Todos los centros' : (centro ? centro.ciudad : (u.centro === '*' ? 'Todos' : u.centro));
            const lastLogin = u.last_login ? new Date(u.last_login).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Nunca';
            const isCurrentUser = window.CURRENT_USER && String(window.CURRENT_USER.usuario).toLowerCase() === String(u.usuario).toLowerCase();
            return `<div class="au-row">
              <div class="au-avatar ${isSuper?'super':'enc'}">${esc(initials)}</div>
              <div class="au-info">
                <div class="au-name">${esc(u.nombre || u.usuario)}</div>
                <div class="au-meta">@${esc(u.usuario)} · ${esc(centroLabel)} · Último login: ${esc(lastLogin)}</div>
              </div>
              <span class="au-role ${isSuper?'super':'enc'}">${isSuper?'★ Super':'Encargado'}</span>
              <button class="au-del" data-del="${esc(u.usuario)}" ${isCurrentUser?'disabled title="No podés eliminarte a vos mismo"':''}>Eliminar</button>
            </div>`;
          }).join('')}
        </div>
      `}
    </div>

    <!-- Modal crear usuario -->
    <div class="au-overlay" id="auOverlay">
      <div class="au-modal">
        <div class="au-modal-head">
          <div class="au-modal-title">Nuevo usuario admin</div>
          <button class="au-x" id="auClose"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="au-field">
          <label>Nombre completo</label>
          <input class="au-input" id="auNombre" placeholder="Ej. María Rodríguez"/>
        </div>
        <div class="au-row2">
          <div class="au-field">
            <label>Usuario</label>
            <input class="au-input" id="auUsuario" placeholder="mrodriguez" autocapitalize="none"/>
          </div>
          <div class="au-field">
            <label>Contraseña</label>
            <input class="au-input" id="auPassword" type="password" placeholder="Min 6 caracteres"/>
          </div>
        </div>
        <div class="au-row2">
          <div class="au-field">
            <label>Rol</label>
            <select class="au-input" id="auRol">
              <option value="encargado">Encargado de centro</option>
              <option value="superadmin">Super admin (ve todo)</option>
            </select>
          </div>
          <div class="au-field" id="auCentroBlock">
            <label>Centro asignado</label>
            <select class="au-input" id="auCentro">
              ${centrosCfg.map(c => `<option value="${esc(c.id)}">${esc(c.ciudad)} · ${esc(c.nombre)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="au-err" id="auErr"></div>
        <div class="au-actions">
          <button class="au-cancel" id="auCancel">Cancelar</button>
          <button class="au-save" id="auSave">Crear usuario</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('auBtnNew').addEventListener('click', openModal);
  document.getElementById('auClose').addEventListener('click', closeModal);
  document.getElementById('auCancel').addEventListener('click', closeModal);
  document.getElementById('auOverlay').addEventListener('click', e => { if (e.target.id==='auOverlay') closeModal(); });
  document.getElementById('auSave').addEventListener('click', saveUser);
  document.getElementById('auRol').addEventListener('change', e => {
    document.getElementById('auCentroBlock').style.display = e.target.value === 'superadmin' ? 'none' : '';
  });
  root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteUser(b.dataset.del)));
}

function openModal(){
  document.getElementById('auOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
  ['auNombre','auUsuario','auPassword'].forEach(id => document.getElementById(id).value='');
  document.getElementById('auRol').value = 'encargado';
  document.getElementById('auCentroBlock').style.display = '';
  document.getElementById('auErr').textContent = '';
  setTimeout(() => document.getElementById('auNombre').focus(), 100);
}
function closeModal(){
  document.getElementById('auOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

async function saveUser(){
  const nombre = document.getElementById('auNombre').value.trim();
  const usuario = document.getElementById('auUsuario').value.trim().toLowerCase();
  const password = document.getElementById('auPassword').value;
  const rol = document.getElementById('auRol').value;
  const centro = rol === 'superadmin' ? '*' : document.getElementById('auCentro').value;
  const err = document.getElementById('auErr');
  err.textContent = '';

  if (!nombre) { err.textContent = 'El nombre es obligatorio'; return; }
  if (!usuario || usuario.length < 3) { err.textContent = 'Usuario inválido (min 3 caracteres)'; return; }
  if (!/^[a-z0-9_-]+$/.test(usuario)) { err.textContent = 'Usuario solo letras minúsculas, números, _ o -'; return; }
  if (!password || password.length < 6) { err.textContent = 'Contraseña mínimo 6 caracteres'; return; }

  const btn = document.getElementById('auSave');
  btn.disabled = true; btn.textContent = 'Creando…';
  try {
    const r = await window.bgCall('addAdminUser', { nombre, usuario, password, rol, centro });
    if (r.error) {
      err.textContent = r.error;
    } else {
      closeModal();
      if (window.toast) window.toast('✓ Usuario ' + usuario + ' creado');
      render();
    }
  } catch(e){
    err.textContent = 'Error de red';
  } finally {
    btn.disabled = false; btn.textContent = 'Crear usuario';
  }
}

async function deleteUser(usuario){
  if (!confirm(`¿Eliminar el usuario "${usuario}"? Esta acción es irreversible.`)) return;
  try {
    const r = await window.bgCall('deleteAdminUser', { usuario });
    if (r.error) { alert(r.error); return; }
    if (window.toast) window.toast('Usuario ' + usuario + ' eliminado');
    render();
  } catch(e){
    alert('Error de red');
  }
}

window.renderAdminUsers = render;

/* Hook para cargar cuando se navega a esta pestaña */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('[data-page="adminusers"]');
  if (btn) btn.addEventListener('click', () => setTimeout(render, 60));
});

})();
