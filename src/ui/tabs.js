/** Liga as abas do header aos painéis, com teclado (padrão WAI-ARIA) e link direto via hash. */
export function initTabs() {
  const tabs = [...document.querySelectorAll('[role="tab"]')];

  function select(tab, { focus = false } = {}) {
    for (const other of tabs) {
      const isActive = other === tab;
      other.setAttribute('aria-selected', String(isActive));
      other.tabIndex = isActive ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !isActive;
    }
    if (focus) tab.focus();
  }

  function tabFromHash() {
    return tabs.find((tab) => `#${tab.dataset.hash}` === location.hash) ?? tabs[0];
  }

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => {
      history.replaceState(null, '', `#${tab.dataset.hash}`);
      select(tab);
    });

    tab.addEventListener('keydown', (event) => {
      const offset = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!offset) return;
      event.preventDefault();
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      history.replaceState(null, '', `#${next.dataset.hash}`);
      select(next, { focus: true });
    });
  }

  window.addEventListener('hashchange', () => select(tabFromHash()));
  select(tabFromHash());
}
