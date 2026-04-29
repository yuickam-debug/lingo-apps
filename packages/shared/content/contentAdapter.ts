/**
 * Adapts the MorningCI content.json format → LingoCI Story format.
 *
 * Key behaviours:
 *  - Prose stories: quote-aware sentence splitter (doesn't break inside "...")
 *  - Lyrics (tagged 'lyrics'): newline splitter (each line = one sentence)
 *  - Vocabulary matching: stems both vocab word AND text token, so inflected
 *    forms like 'große' correctly match vocab entry 'groß'
 */

import type { Story, Sentence, WordDefinition, CEFRLevel, GrammarPoint } from '../types';

// ─── MorningCI source types ───────────────────────────────────────

export interface MCVocabWord {
  word: string;        // e.g. "das Haus", "gehen", "en and"
  translation: string;
  notes?: string;
}

export interface MCGrammarPoint {
  rule: string;
  exampleSentence: string;
  explanation: string;
}

export interface MCStory {
  id: string;
  language: 'de' | 'da';
  level: string;
  title: string;
  titleEn: string;
  dateAdded: string;
  tags: string[];
  body: string;
  vocabulary: MCVocabWord[];
  grammarPoints: MCGrammarPoint[];
}

export interface MCManifest {
  version: string;
  lastUpdated: string;
  stories: MCStory[];
}

// ─── Article stripping ────────────────────────────────────────────

const DE_ARTICLES = /^(der|die|das|den|dem|des|ein|eine|einen|einem|eines)\s+/i;
const DA_ARTICLES = /^(en|et)\s+/i;

function stripArticle(vocabWord: string, lang: 'de' | 'da'): string {
  return vocabWord
    .replace(lang === 'de' ? DE_ARTICLES : DA_ARTICLES, '')
    .toLowerCase()
    .trim();
}

// ─── Stemming ─────────────────────────────────────────────────────
// Applied to BOTH the vocabulary base word AND each text token.
// A match fires when any stem of a text token equals any stem of a vocab word.
// This catches: groß → große/großem/großen, Wald → Wäldern, etc.

function getDeStems(word: string): Set<string> {
  const stems = new Set([word]);
  if (word.endsWith('ssen') && word.length > 5) stems.add(word.slice(0, -4) + 'ß'); // müssen→müß
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
  // Umlaut variants: Wald → Wälder (wäld) ↔ wald
  const umlauted = word.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
  if (umlauted !== word) stems.add(umlauted);
  const deUmlauted = word.replace(/a/g, 'ä').replace(/o/g, 'ö').replace(/u/g, 'ü');
  if (deUmlauted !== word) stems.add(deUmlauted);
  return stems;
}

function getDaStems(word: string): Set<string> {
  const stems = new Set([word]);
  // Definite suffixes: hunden→hund, huset→hus, fuglene→fugl
  if (word.endsWith('erne') && word.length > 5) stems.add(word.slice(0, -4));
  if (word.endsWith('ene') && word.length > 4) stems.add(word.slice(0, -3));
  if (word.endsWith('en') && word.length > 3) stems.add(word.slice(0, -2));
  if (word.endsWith('et') && word.length > 3) stems.add(word.slice(0, -2));
  // Plural -er: fugler→fugl, dyr stays
  if (word.endsWith('er') && word.length > 3) stems.add(word.slice(0, -2));
  // Adjective -e: smukke→smukkk, lykkelige→lykkelig (strip -e)
  if (word.endsWith('e') && word.length > 3) stems.add(word.slice(0, -1));
  // Infinitive -e is covered above; past tense -ede: løbede→løb
  if (word.endsWith('ede') && word.length > 4) stems.add(word.slice(0, -3));
  if (word.endsWith('te') && word.length > 3) stems.add(word.slice(0, -2));
  return stems;
}

// ─── Part-of-speech inference ─────────────────────────────────────

function inferPOS(vocabWord: string, lang: 'de' | 'da'): string {
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

// ─── Sentence splitting ───────────────────────────────────────────

// Quote characters: track depth so we don't split inside "..."
const OPEN_QUOTES  = new Set(['\u201C', '\u201E', '\u00AB', '\u00BB']); // " „ « »
const CLOSE_QUOTES = new Set(['\u201D', '\u00AB', '\u00BB']);            // " « »

function splitProse(body: string): string[] {
  const sentences: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];

    // Track quote depth
    if (OPEN_QUOTES.has(ch)) {
      depth++;
    } else if (CLOSE_QUOTES.has(ch) && depth > 0) {
      depth--;
    } else if (ch === '"') {
      // ASCII double-quote: toggle
      depth = depth > 0 ? depth - 1 : depth + 1;
    }

    current += ch;

    // Split only outside quotes, on sentence-ending punctuation
    if (depth === 0 && (ch === '.' || ch === '!' || ch === '?')) {
      // Look ahead: skip spaces, check for capital or opening quote
      let j = i + 1;
      while (j < body.length && body[j] === ' ') j++;
      const next = body[j];
      if (next && /[A-ZÄÖÜÀÁÂÃÅÆ\u201C\u201E\u00AB\u00BB"]/.test(next)) {
        const s = current.trim();
        if (s.length > 2) sentences.push(s);
        current = '';
        i = j - 1; // skip whitespace (loop will i++)
      }
    }
  }

  const last = current.trim();
  if (last.length > 2) sentences.push(last);
  return sentences;
}

function splitLyricsWithBreaks(body: string): { lines: string[]; stanzaBreaks: number[] } {
  const lines: string[] = [];
  const stanzaBreaks: number[] = [];
  for (const stanzaBlock of body.trim().split('\n\n')) {
    const stanzaLines = stanzaBlock.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (stanzaLines.length === 0) continue;
    if (lines.length > 0) stanzaBreaks.push(lines.length);
    lines.push(...stanzaLines);
  }
  return { lines, stanzaBreaks };
}

// ─── Word matching ────────────────────────────────────────────────

function tokenizeText(text: string): string[] {
  return text
    .split(/[\s\u201C\u201D\u201E\u00AB\u00BB".,!?;:()\[\]{}\-–—]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function findWordsInSentence(
  sentence: string,
  vocabulary: MCVocabWord[],
  lang: 'de' | 'da'
): WordDefinition[] {
  const textTokens = tokenizeText(sentence);
  const found: WordDefinition[] = [];
  const claimed = new Set<string>(); // claimed text token forms (lowercase)

  for (const v of vocabulary) {
    const vBase = stripArticle(v.word, lang);
    if (!vBase || vBase.length < 2) continue;

    const vStems = lang === 'de' ? getDeStems(vBase) : getDaStems(vBase);

    for (const token of textTokens) {
      const tokenLower = token.toLowerCase();
      if (claimed.has(tokenLower)) continue;

      const tokenStems = lang === 'de' ? getDeStems(tokenLower) : getDaStems(tokenLower);

      // Match if any stem of the text token equals any stem of the vocab word
      let matched = false;
      for (const ts of tokenStems) {
        if (vStems.has(ts)) { matched = true; break; }
      }

      if (matched) {
        claimed.add(tokenLower);
        found.push({
          word: tokenLower, // exact text form → precise highlighting
          definition: v.translation,
          partOfSpeech: inferPOS(v.word, lang),
          grammar: v.notes,
        });
        break; // move to next vocab word
      }
    }
  }

  return found;
}

// ─── Main adapter ─────────────────────────────────────────────────

export function adaptStory(mc: MCStory): Story {
  const isLyrics =
    mc.tags.includes('lyrics') || mc.tags.includes('song');

  const { lines: rawLines, stanzaBreaks } = isLyrics
    ? splitLyricsWithBreaks(mc.body)
    : { lines: splitProse(mc.body), stanzaBreaks: [] };

  const sentences: Sentence[] = rawLines.map((text, i) => ({
    id: `${mc.id}-s${String(i + 1).padStart(2, '0')}`,
    text,
    translation: '', // MorningCI format has no sentence-level translations
    words: findWordsInSentence(text, mc.vocabulary, mc.language),
  }));

  const grammarPoints: GrammarPoint[] = mc.grammarPoints.map((gp) => ({
    rule: gp.rule,
    exampleSentence: gp.exampleSentence,
    explanation: gp.explanation,
  }));

  return {
    id: mc.id,
    title: mc.title,
    level: (mc.level as CEFRLevel) ?? 'A1',
    genre: isLyrics ? 'lyrics' : 'narrative',
    source: isLyrics ? 'lyrics' : 'story',
    sentences,
    metadata: {
      titleEn: mc.titleEn,
      tags: mc.tags,
      grammarPoints,
      stanzaBreaks: isLyrics && stanzaBreaks.length > 0 ? stanzaBreaks : undefined,
    },
  };
}

export function adaptManifest(manifest: MCManifest, lang: 'de' | 'da'): Story[] {
  return manifest.stories
    .filter((s) => s.language === lang)
    .map(adaptStory);
}
