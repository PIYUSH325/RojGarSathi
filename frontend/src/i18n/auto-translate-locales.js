const fs = require('fs');

const source = JSON.parse(fs.readFileSync('en.json', 'utf8'));

const localeMap = {
  hi: 'hi',
  pa: 'pa',
  bn: 'bn',
  mr: 'mr',
  ta: 'ta',
  te: 'te',
  gu: 'gu',
  kn: 'kn',
  ml: 'ml',
};

const BATCH_SIZE = 30;

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const flatten = (obj, prefix = '', out = {}) => {
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (isObject(value)) {
      flatten(value, fullKey, out);
    } else {
      out[fullKey] = String(value);
    }
  }
  return out;
};

const setAtPath = (obj, path, value) => {
  const parts = path.split('.');
  let node = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
};

const protectPlaceholders = (text) => {
  const placeholders = [];
  const protectedText = text.replace(/\{\{[^}]+\}\}/g, (m) => {
    const token = `__PH_${placeholders.length}__`;
    placeholders.push(m);
    return token;
  });
  return { protectedText, placeholders };
};

const restorePlaceholders = (text, placeholders) => {
  let restored = text;
  placeholders.forEach((ph, i) => {
    restored = restored.replaceAll(`__PH_${i}__`, ph);
  });
  return restored;
};

const translateBatch = async (texts, targetLang) => {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', targetLang);
  url.searchParams.set('dt', 't');

  texts.forEach((text) => url.searchParams.append('q', text));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${targetLang}`);
  }

  const json = await response.json();
  return json[0].map((entry) => entry[0]);
};

(async () => {
  const sourceFlat = flatten(source);

  for (const [fileBase, targetLang] of Object.entries(localeMap)) {
    const fileName = `${fileBase}.json`;
    const localeData = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    const localeFlat = flatten(localeData);

    const keysToTranslate = Object.keys(sourceFlat).filter((key) => {
      const srcVal = sourceFlat[key];
      const locVal = localeFlat[key];
      return locVal === srcVal;
    });

    console.log(`${fileName}: translating ${keysToTranslate.length} entries`);

    for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
      const batchKeys = keysToTranslate.slice(i, i + BATCH_SIZE);
      const protectedEntries = batchKeys.map((key) => protectPlaceholders(sourceFlat[key]));
      const batchTexts = protectedEntries.map((e) => e.protectedText);

      const translated = await translateBatch(batchTexts, targetLang);

      translated.forEach((translatedText, index) => {
        const original = protectedEntries[index];
        const finalText = restorePlaceholders(translatedText, original.placeholders);
        setAtPath(localeData, batchKeys[index], finalText);
      });

      process.stdout.write(`  ${Math.min(i + BATCH_SIZE, keysToTranslate.length)}/${keysToTranslate.length}\r`);
    }

    fs.writeFileSync(fileName, `${JSON.stringify(localeData, null, 2)}\n`);
    process.stdout.write('\n');
  }

  console.log('Auto-translation complete.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
