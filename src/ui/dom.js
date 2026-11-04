/** Cria um elemento com propriedades e filhos: h('button', { className: 'btn' }, 'Texto'). */
export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key in element) element[key] = value;
    else element.setAttribute(key, value);
  }
  element.append(...children);
  return element;
}
