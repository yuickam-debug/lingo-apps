/**
 * generateV2.mjs
 *
 * Converts data.json (MorningCI / v1 schema) → data.v2.json (LingoCI Story schema).
 *
 * Run from the lingo-apps root:
 *   node scripts/generateV2.mjs
 *
 * Safe: never overwrites data.json. Rewrites data.v2.json in place.
 * After running, manually add translations to data.v2.json — those entries
 * take precedence over the v1 runtime-adapted versions in contentService.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC  = resolve(ROOT, 'packages/shared/content/data.json');
const DEST = resolve(ROOT, 'packages/shared/content/data.v2.json');

// ─── Sentence splitter (mirrors contentAdapter.ts) ───────────────

const OPEN_QUOTES  = new Set(['“', '„', '«', '»']);
const CLOSE_QUOTES = new Set(['”', '«', '»']);

function splitProse(body) {
  const sentences = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (OPEN_QUOTES.has(ch)) depth++;
    else if (CLOSE_QUOTES.has(ch) && depth > 0) depth--;
    else if (ch === '"') depth = depth > 0 ? depth - 1 : depth + 1;

    current += ch;

    if (depth === 0 && (ch === '.' || ch === '!' || ch === '?')) {
      let j = i + 1;
      while (j < body.length && body[j] === ' ') j++;
      const next = body[j];
      if (next && /[A-ZÄÖÜÀÁÂÃÅÆ“„«»"]/.test(next)) {
        const s = current.trim();
        if (s.length > 2) sentences.push(s);
        current = '';
        i = j - 1;
      }
    }
  }
  const last = current.trim();
  if (last.length > 2) sentences.push(last);
  return sentences;
}

function splitLyrics(body) {
  return body.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

// ─── Vocabulary matching (mirrors contentAdapter.ts) ─────────────

const DE_ARTICLES = /^(der|die|das|den|dem|des|ein|eine|einen|einem|eines)\s+/i;
const DA_ARTICLES = /^(en|et)\s+/i;

function stripArticle(word, lang) {
  return word.replace(lang === 'de' ? DE_ARTICLES : DA_ARTICLES, '').toLowerCase().trim();
}

function inferPOS(vocabWord, lang) {
  if (lang === 'de') {
    if (DE_ARTICLES.test(vocabWord)) return 'noun';
    if (/en$/.test(vocabWord) && vocabWord.length > 4) return 'verb (inf.)';
  }
  if (lang === 'da') {
    if (DA_ARTICLES.test(vocabWord)) return 'noun';
    if (/e$/.test(vocabWord) && vocabWord.length > 3) return 'verb (inf.)';
  }
  return '';
}

function getDeStems(word) {
  const stems = new Set([word]);
  if (word.endsWith('ssen') && word.length > 5) stems.add(word.slice(0, -4) + 'ß');
  if (word.endsWith('nen') && word.length > 4) stems.add(word.slice(0, -3));
  if (word.endsWith('ten') && word.length > 4) stems.add(word.slice(0, -3));
  if (word.endsWith('sten') && word.length > 5) stems.add(word.slice(0, -4));
  if (word.endsWith('en') && word.length > 4) stems.add(word.slice(0, -2));
  if (word.endsWith('est') && word.length > 4) stems.add(word.slice(0, -3));
  if (word.endsWith('ste') && word.length > 4) stems.add(word.slice(0, -3));
  if (word.endsWith('st') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('te') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('em') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('er') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('es') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('en') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('e') && word.length > 3) stems.add(word.slice(0, -1));
  if (word.endsWith('t') && word.length > 3) stems.add(word.slice(0, -1));
  const umlauted = word.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
  if (umlauted !== word) stems.add(umlauted);
  const deUmlauted = word.replace(/a/g, 'ä').replace(/o/g, 'ö').replace(/u/g, 'ü');
  if (deUmlauted !== word) stems.add(deUmlauted);
  return stems;
}

function getDaStems(word) {
  const stems = new Set([word]);
  if (word.endsWith('erne') && word.length > 5) stems.add(word.slice(0, -4));
  if (word.endsWith('ene') && word.length > 4) stems.add(word.slice(0, -3));
  if (word.endsWith('en') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('et') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('er') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('e') && word.length > 3) stems.add(word.slice(0, -1));
  if (word.endsWith('ede') && word.length > 4) stems.add(word.slice(0, -3));
  if (word.endsWith('te') && word.length > 3) stems.add(word.slice(0, -2));
  return stems;
}

function tokenizeText(text) {
  return text
    .split(/[\s“”„«»".,!?;:()\[\]{}\-–—]+/)
    .map(t => t.trim())
    .filter(t => t.length > 1);
}

function findWordsInSentence(sentence, vocabulary, lang) {
  const textTokens = tokenizeText(sentence);
  const found = [];
  const claimed = new Set();

  for (const v of vocabulary) {
    const vBase = stripArticle(v.word, lang);
    if (!vBase || vBase.length < 2) continue;
    const vStems = lang === 'de' ? getDeStems(vBase) : getDaStems(vBase);

    for (const token of textTokens) {
      const tokenLower = token.toLowerCase();
      if (claimed.has(tokenLower)) continue;
      const tokenStems = lang === 'de' ? getDeStems(tokenLower) : getDaStems(tokenLower);
      let matched = false;
      for (const ts of tokenStems) {
        if (vStems.has(ts)) { matched = true; break; }
      }
      if (matched) {
        claimed.add(tokenLower);
        found.push({
          word: tokenLower,
          definition: v.translation,
          partOfSpeech: inferPOS(v.word, lang),
          grammar: v.notes ?? undefined,
        });
        break;
      }
    }
  }
  return found;
}

// ─── Adapt one v1 story → v2 Story ───────────────────────────────

function adaptStory(mc) {
  const isLyrics = mc.tags.includes('lyrics') || mc.tags.includes('song');
  const rawLines = isLyrics ? splitLyrics(mc.body) : splitProse(mc.body);

  const sentences = rawLines.map((text, i) => ({
    id: `${mc.id}-s${String(i + 1).padStart(2, '0')}`,
    text,
    translation: '',   // intentionally empty — fill in manually for each story
    words: findWordsInSentence(text, mc.vocabulary, mc.language),
  }));

  const grammarPoints = (mc.grammarPoints ?? []).map(gp => ({
    rule: gp.rule,
    exampleSentence: gp.exampleSentence,
    explanation: gp.explanation,
  }));

  return {
    // Extra field for contentService language-filtering (not in LingoCI Story type)
    language: mc.language,
    id: mc.id,
    title: mc.title,
    level: mc.level,
    genre: isLyrics ? 'lyrics' : 'narrative',
    source: isLyrics ? 'lyrics' : 'story',
    sentences,
    metadata: {
      titleEn: mc.titleEn,
      tags: mc.tags,
      grammarPoints,
    },
  };
}

// ─── Main ─────────────────────────────────────────────────────────

const v1 = JSON.parse(readFileSync(SRC, 'utf8'));

const v2 = {
  version: '2',
  lastUpdated: new Date().toISOString().split('T')[0],
  stories: v1.stories.map(adaptStory),
};

writeFileSync(DEST, JSON.stringify(v2, null, 2), 'utf8');

console.log(`✓ Written ${v2.stories.length} stories to data.v2.json`);
console.log(`  ${v2.stories.filter(s => s.language === 'de').length} German, ${v2.stories.filter(s => s.language === 'da').length} Danish`);
console.log(`\nNext step: open packages/shared/content/data.v2.json and fill in`);
console.log(`  sentence[].translation fields for each story.`);
