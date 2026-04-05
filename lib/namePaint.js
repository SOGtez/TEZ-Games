/**
 * Parses a CSS declaration string into a React inline style object.
 * Splits on ';', then on the FIRST ':' in each declaration.
 * Converts kebab-case property names to camelCase.
 *
 * e.g. "background: linear-gradient(135deg, #f00, #00f); background-size: 200%"
 *   → { background: "linear-gradient(135deg, #f00, #00f)", backgroundSize: "200%" }
 */
export function parsePaintStyle(cssValue) {
  if (!cssValue) return null;
  const style = {};
  cssValue.split(';').forEach(decl => {
    const idx = decl.indexOf(':');
    if (idx === -1) return;
    const prop = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!prop || !val) return;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[camel] = val;
  });
  return Object.keys(style).length > 0 ? style : null;
}
