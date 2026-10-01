// Menu mobile : ouverture/fermeture accessible (aria-expanded, Échap, resize).
(() => {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.getElementById('menu-mobile');
  if (!toggle || !menu) return;

  const set = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  };

  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { set(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1040px)').addEventListener('change', (e) => { if (e.matches) set(false); });
})();
