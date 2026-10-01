// Page produits : filtre des cartes et lien WhatsApp du produit choisi.
// Sans JavaScript, tous les produits restent visibles et les liens WhatsApp fonctionnent.
(() => {
  const filters = document.querySelector('[data-filters]');
  const cards = document.querySelectorAll('[data-product]');
  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      const value = btn.dataset.filter;
      filters.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      cards.forEach((c) => { c.hidden = value !== 'all' && c.dataset.product !== value; });
    });
  }

  const choices = document.querySelector('[data-choices]');
  if (choices) {
    const links = document.querySelectorAll('[data-wa-selected]');
    const msg = document.querySelector('[data-selected-msg]');
    choices.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-choice]');
      if (!btn) return;
      choices.querySelectorAll('[data-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      links.forEach((a) => { a.href = btn.dataset.wa; });
      if (msg) msg.textContent = btn.dataset.msg;
    });
  }
})();
