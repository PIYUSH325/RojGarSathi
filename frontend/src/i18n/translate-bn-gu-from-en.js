const fs = require('fs');

const SOURCE_FILE = 'en.json';
const TARGETS = {
  bn: 'bn',
  gu: 'gu',
};

const BATCH_SIZE = 8;
const RETRIES = 3;

const source = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const flatten = (obj, prefix = '', out = {}) => {
  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (isObject(value)) flatten(value, full, out);
    else out[full] = String(value);
  }
  return out;
};

const cloneStructure = (obj) => {
  if (!isObject(obj)) return obj;
  const out = {};
  for (const key of Object.keys(obj)) out[key] = cloneStructure(obj[key]);
  return out;
};

const setAtPath = (obj, path, value) => {
  const parts = path.split('.');
  let node = obj;
  for (let i = 0; i < parts.length - 1; i += 1) node = node[parts[i]];
  node[parts[parts.length - 1]] = value;
};

const protect = (text) => {
  const placeholders = [];
  const protectedText = text
    .replace(/\{\{[^}]+\}\}/g, (m) => {
      const token = `__PH_${placeholders.length}__`;
      placeholders.push(m);
      return token;
    })
    .replace(/\bRojgarSathi\b/g, (m) => {
      const token = `__PH_${placeholders.length}__`;
      placeholders.push(m);
      return token;
    });

  return { protectedText, placeholders };
};

const restore = (text, placeholders) => {
  let out = text;
  placeholders.forEach((ph, i) => {
    out = out.replaceAll(`__PH_${i}__`, ph);
  });
  return out;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldSkipTranslation = (value) => {
  if (!value.trim()) return true;
  if (/^https?:\/\//i.test(value)) return true;
  if (/^[A-Z0-9_\-/.]+$/.test(value) && value.length <= 15) return true;
  return false;
};

const translateOne = async (text, targetLang) => {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', targetLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const translated = (data[0] || []).map((entry) => entry[0]).join('');
      return translated || text;
    } catch (err) {
      if (attempt === RETRIES) throw err;
      await sleep(250 * attempt);
    }
  }

  return text;
};

(async () => {
  const sourceFlat = flatten(source);
  const keys = Object.keys(sourceFlat);

  for (const [fileBase, lang] of Object.entries(TARGETS)) {
    const next = cloneStructure(source);

    const directKeys = [];
    const translateEntries = [];

    for (const key of keys) {
      const englishText = sourceFlat[key];
      if (shouldSkipTranslation(englishText)) {
        directKeys.push(key);
      } else {
        const protectedEntry = protect(englishText);
        translateEntries.push({ key, ...protectedEntry });
      }
    }

    directKeys.forEach((key) => setAtPath(next, key, sourceFlat[key]));

    console.log(`${fileBase}.json: translating ${translateEntries.length} entries`);

    for (let i = 0; i < translateEntries.length; i += BATCH_SIZE) {
      const batch = translateEntries.slice(i, i + BATCH_SIZE);
      const translated = await Promise.all(
        batch.map((entry) => translateOne(entry.protectedText, lang))
      );

      translated.forEach((translatedText, index) => {
        const entry = batch[index];
        const restored = restore(translatedText, entry.placeholders);
        setAtPath(next, entry.key, restored);
      });

      process.stdout.write(`  ${Math.min(i + BATCH_SIZE, translateEntries.length)}/${translateEntries.length}\r`);
    }

    process.stdout.write('\n');
    fs.writeFileSync(`${fileBase}.json`, `${JSON.stringify(next, null, 2)}\n`);
  }

  console.log('bn.json and gu.json translation completed.');
})();
