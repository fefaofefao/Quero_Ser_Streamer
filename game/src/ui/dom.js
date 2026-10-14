// DOM helpers: modals, toasts, confirm dialogs.
import { ic } from './icons.js';
import { sfx } from '../audio.js';
import { t } from '../i18n.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const stack = [];

// opts: { title, body (html), cls, onClose, buttons: [{label, cls, onClick, close}] , noClose, icon }
export function modal(opts) {
  const root = $('#modals');
  const el = document.createElement('div');
  el.className = 'modal-wrap ' + (opts.wrapCls || '');
  el.innerHTML = `<div class="modal ${opts.cls || ''}" role="dialog">
    ${opts.noClose ? '' : `<button class="m-x" aria-label="${t('close')}">${ic('close')}</button>`}
    ${opts.title ? `<div class="m-head">${opts.icon || ''}<h2>${opts.title}</h2></div>` : ''}
    <div class="m-body">${opts.body || ''}</div>
    ${opts.buttons && opts.buttons.length ? `<div class="m-btns">${opts.buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-bi="${i}">${b.label}</button>`).join('')}</div>` : ''}
  </div>`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  sfx.open();
  const api = {
    el, body: $('.m-body', el),
    close() {
      if (api.closed) return; api.closed = true;
      el.classList.remove('in'); el.classList.add('out');
      setTimeout(() => el.remove(), 220);
      const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
      opts.onClose && opts.onClose();
    },
  };
  stack.push(api);
  el.addEventListener('click', (e) => {
    if (e.target === el && !opts.noClose && !opts.noBackdropClose) { api.close(); return; }
    const x = e.target.closest('.m-x'); if (x) { sfx.click(); api.close(); return; }
    const b = e.target.closest('[data-bi]');
    if (b && b.closest('.m-btns')) {
      const def = opts.buttons[+b.dataset.bi];
      sfx.click();
      const r = def.onClick ? def.onClick(api) : undefined;
      if (def.close !== false && r !== false) api.close();
    }
  });
  return api;
}

export function topModal() { return stack[stack.length - 1]; }
export function closeTopModal() { const m = topModal(); if (m) { m.close(); return true; } return false; }
export function modalOpen() { return stack.length > 0; }

export function confirmBox(text, onYes, yesLabel) {
  return modal({ body: `<p class="center">${text}</p>`, cls: 'small', buttons: [{ label: t('cancel'), cls: 'ghost' }, { label: yesLabel || t('ok'), cls: 'primary', onClick: onYes }] });
}

export function toast(html, kind = '') {
  const root = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = html;
  root.appendChild(el);
  while (root.children.length > 3) root.firstChild.remove();
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); }, 2600);
}

// Small bouncy "pop" on an element (purchase feedback).
export function bump(el) {
  if (!el) return;
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
