const form = document.querySelector('#searchForm');
const input = document.querySelector('#letters');
const section = document.querySelector('#resultsSection');
const grid = document.querySelector('#wordGrid');
const count = document.querySelector('#resultCount');
const title = document.querySelector('#resultsTitle');
const empty = document.querySelector('#emptyState');
const more = document.querySelector('#moreButton');
const clear = document.querySelector('#clearButton');

let words = [];
let matches = [];
let shown = 0;
const PAGE_SIZE = 80;

const normalizeLetters = value => value
  .toLocaleLowerCase('uk-UA')
  .replace(/[^а-щьюяєіїґ]/g, '');

const letterCounts = value => [...value].reduce((map, letter) => {
  map.set(letter, (map.get(letter) || 0) + 1);
  return map;
}, new Map());

const containsAllLetters = (word, required) => {
  for (const [letter, needed] of required) {
    let found = 0;
    for (const char of word) if (char === letter) found++;
    if (found < needed) return false;
  }
  return true;
};

const highlight = (word, letters) => {
  const set = new Set(letters);
  const fragment = document.createDocumentFragment();
  for (const char of word) {
    const node = document.createElement(set.has(char) ? 'mark' : 'span');
    node.textContent = char;
    fragment.append(node);
  }
  return fragment;
};

function renderMore() {
  const letters = normalizeLetters(input.value);
  const batch = matches.slice(shown, shown + PAGE_SIZE);
  const fragment = document.createDocumentFragment();
  for (const word of batch) {
    const item = document.createElement('div');
    item.className = 'word';
    item.append(highlight(word, letters));
    fragment.append(item);
  }
  grid.append(fragment);
  shown += batch.length;
  more.hidden = shown >= matches.length;
}

function runSearch(event) {
  event?.preventDefault();
  const letters = normalizeLetters(input.value);
  if (!letters) {
    input.focus();
    input.setAttribute('aria-invalid', 'true');
    return;
  }
  input.removeAttribute('aria-invalid');
  const required = letterCounts(letters);
  matches = words
    .filter(word => containsAllLetters(word, required))
    .sort((a, b) => a.length - b.length || a.localeCompare(b, 'uk'));
  shown = 0;
  grid.replaceChildren();
  section.hidden = false;
  clear.hidden = false;
  empty.hidden = matches.length > 0;
  count.textContent = matches.length.toLocaleString('uk-UA');
  title.textContent = `Літери «${[...letters].join(' · ')}»`;
  if (matches.length) renderMore();
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', `#${encodeURIComponent(letters)}`);
}

form.addEventListener('submit', runSearch);
more.addEventListener('click', renderMore);
clear.addEventListener('click', () => {
  input.value = '';
  section.hidden = true;
  clear.hidden = true;
  history.replaceState(null, '', location.pathname);
  input.focus();
});

input.addEventListener('input', () => input.removeAttribute('aria-invalid'));

fetch('words.txt')
  .then(response => {
    if (!response.ok) throw new Error('Не вдалося завантажити словник');
    return response.text();
  })
  .then(text => {
    words = text.split(/\r?\n/).map(word => word.trim()).filter(Boolean);
    const fromHash = decodeURIComponent(location.hash.slice(1));
    if (fromHash) {
      input.value = fromHash;
      runSearch();
    }
  })
  .catch(() => {
    document.querySelector('#hint').textContent = 'Словник тимчасово не завантажився. Оновіть сторінку.';
  });
