const COLOR_CLASS_BY_CODE = {
  lg: 'buff',
  r: 'harm',
  b: 'energy',
  p: 'arcane',
  o: 'fire',
  y: 'geo',
  ly: 'shock',
  bl: 'energy',
  ur: 'unholy',
  g: 'caustic',
};

/**
 * Converts a Stoneshard tooltip string and formula map into the HTML format used by index.html.
 *
 * @param {string} tooltipDescription
 * @param {Record<string, string> | undefined} formulaMap
 * @returns {string}
 */
export function stoneshardTooltipToHTML(tooltipDescription, formulaMap = {}) {
  if (!tooltipDescription.trim()) return '';

  const sortedFormulaMap = sortFormulaMap(formulaMap ?? {});

  const html = tooltipDescription
    .split('##')
    .map((paragraph) => `<p>${formatParagraph(paragraph)}</p>\n\n`)
    .join('');

  return replaceFormulaKeysWithFormulas(html, sortedFormulaMap);
}

/**
 * @param {Record<string, string>} formulaMap
 * @returns {Record<string, string>}
 */
function sortFormulaMap(formulaMap) {
  // Sort longer keys first so HP_Limit cannot replace part of Max_HP_Limit.
  return Object.fromEntries(
    Object.entries(formulaMap).sort(([keyA], [keyB]) => keyB.length - keyA.length),
  );
}

/**
 * @param {string} paragraph
 * @returns {string}
 */
function formatParagraph(paragraph) {
  return paragraph
    .trim()
    .replace(/#/g, '<br>\n')
    .replace(/~([a-z]+)~(.*?)~\/~/g, (match, color, text) => replaceTag(color, text));
}

/**
 * @param {string} html
 * @param {Record<string, string>} formulaMap
 * @returns {string}
 */
function replaceFormulaKeysWithFormulas(html, formulaMap) {
  return html.replace(
    /<stat-formula([^>]*)>(.*?)<\/stat-formula>/g,
    (match, attributes, innerText) => {
      let formulaText = innerText;
      for (const [key, value] of Object.entries(formulaMap)) {
        formulaText = formulaText.replaceAll(key, value);
      }
      return `<stat-formula${attributes}>${formulaText}</stat-formula>`;
    },
  );
}

/**
 * @param {string} color
 * @param {string} text
 * @returns {string}
 */
function replaceTag(color, text) {
  text = text.replace(/\/\*([^*]+)\*\//g, (match, formulaKey) => {
    return `<stat-formula formula-key="${formulaKey}">${formulaKey}</stat-formula>`;
  });

  if (color === 'w') {
    return `<strong>${text}</strong>`;
  }
  return `<span class="${getSpanClass(color)}">${text}</span>`;
}

/**
 * @param {string} colorCode
 * @returns {string}
 */
function getSpanClass(colorCode) {
  return COLOR_CLASS_BY_CODE[colorCode] || 'unknown-tag';
}
