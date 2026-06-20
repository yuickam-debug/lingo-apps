# DALingo Content Guide

This guide is for content researchers creating new **stories**, **lyrics**, and **news digests** for the DALingo app.
No coding knowledge required — you only need to produce a JSON file in the format below.

---

## How the workflow works

1. You write the content and fill in the JSON template
2. Share the file back → it gets dropped into the GitHub bundle
3. The app fetches it automatically on next open (no app update needed)

---

## CEFR Levels

| Level | Description | Sentence length | Vocabulary |
|-------|-------------|-----------------|------------|
| `A1`  | Beginner    | Short, simple   | ~200 most common words |
| `A2`  | Elementary  | Simple, concrete| ~500 words |
| `B1`  | Intermediate| Some complexity | Everyday topics |
| `B2`  | Upper-Intermediate | Varied  | Abstract, colloquial |

---

## Story Template

Use this for narrative content (short stories, news excerpts, dialogues).

```json
{
  "id": "da-story-XXX-short-title",
  "title": "Danish title here",
  "level": "A1",
  "genre": "narrative",
  "source": "story",
  "sentences": [
    {
      "id": "da-story-XXX-s01",
      "text": "Danish sentence here.",
      "translation": "English translation here.",
      "words": [
        {
          "word": "danish-word",
          "definition": "English meaning",
          "partOfSpeech": "noun, c.",
          "grammar": "Optional grammar note — article form, verb conjugation, etc."
        }
      ]
    },
    {
      "id": "da-story-XXX-s02",
      "text": "Next sentence.",
      "translation": "English translation.",
      "words": []
    }
  ]
}
```

### Story field rules

**`id`**
- Pattern: `da-story-XXX-short-title` where XXX is a 3-digit number
- Use the next available number (current highest: `da-story-005`)
- Short title: lowercase, hyphens only, no special characters
- Examples: `da-story-006-pigen-og-havet`, `da-story-007-kofferter`

**`title`**
- The Danish title as it appears in the app
- Can use Danish characters (æ ø å)

**`level`**
- One of: `"A1"` `"A2"` `"B1"` `"B2"`

**`genre`** and **`source`**
- For stories always use: `"genre": "narrative"`, `"source": "story"`

**`sentences`**
- Aim for 8–15 sentences per story
- Each sentence gets its own object in the array

**`sentences[].id`**
- Pattern: `{story-id}-s01`, `{story-id}-s02`, …
- Zero-pad to 2 digits: `s01`, `s02`, … `s10`, `s11`

**`sentences[].text`**
- The Danish sentence, exactly as it should appear to the reader

**`sentences[].translation`**
- The English translation — shown when the reader taps the sentence
- Must be filled in for every sentence

**`sentences[].words`**
- List only words that are non-obvious and worth teaching
- Do not list every single word — target 1–4 words per sentence
- Words with no notes: set `"grammar": ""` or omit the key
- Can be `[]` if no words in that sentence need annotation

**`words[].word`**
- The exact lowercase form as it appears in the sentence
- For nouns: use the form in the sentence (not the base form)
- Example: sentence has "solen" → `"word": "solen"`

**`words[].definition`**
- Short English definition, ideally under 8 words
- For nouns include the article: `"the sun"`, `"a train station"`

**`words[].partOfSpeech`**
- Use these conventions:
  - `"noun, c."` — common gender (en-word)
  - `"noun, n."` — neuter gender (et-word)
  - `"verb (inf.)"` — verb, shown in infinitive form
  - `"adj."` — adjective
  - `"adv."` — adverb
  - `"prep."` — preposition

**`words[].grammar`**
- Optional — use for things worth explaining:
  - Article forms: `"en sol (a sun) · solen (the sun)"`
  - Verb tenses: `"stå → står (present) · stod (past)"`
  - Fixed phrases: `"se sig omkring = to look around"`
- Leave `""` or omit if nothing useful to say

---

## Lyrics Template

Use this for song lyrics. Each line of the song = one sentence object.
Stanzas are separated using the `stanzaBreaks` field.

```json
{
  "id": "da-artist-short-title",
  "title": "Song title in Danish",
  "level": "B1",
  "genre": "lyrics",
  "source": "lyrics",
  "metadata": {
    "artist": "Artist Name",
    "titleEn": "English song title",
    "tags": ["lyrics", "artist-name", "mood-or-theme"],
    "grammarPoints": [
      {
        "rule": "Name of the grammar pattern",
        "exampleSentence": "A line from the song that shows it.",
        "explanation": "2–3 sentence explanation of the pattern and why it matters."
      }
    ],
    "stanzaBreaks": [4, 8, 12]
  },
  "sentences": [
    {
      "id": "da-artist-short-title-s01",
      "text": "First line of the song",
      "translation": "English translation of the first line",
      "words": []
    },
    {
      "id": "da-artist-short-title-s02",
      "text": "Second line",
      "translation": "English translation",
      "words": [
        {
          "word": "danish-word",
          "definition": "English meaning",
          "partOfSpeech": "verb (inf.)"
        }
      ]
    }
  ]
}
```

### Lyrics-specific field rules

**`id`**
- Pattern: `da-{artist-short}-{song-short-title}`
- Examples: `da-guldimund-det-kun-vigtigt`, `da-master-fatman-kongen`
- Lowercase, hyphens only

**`metadata.stanzaBreaks`**
- List the sentence index where each new stanza starts
- Index is 0-based counting from the start of `sentences[]`
- Example: if stanzas are lines 1–4, 5–8, 9–12:
  `"stanzaBreaks": [4, 8]`
  (the break happens *before* sentence at that index)
- Choruses are detected automatically when a stanza repeats

**`metadata.grammarPoints`**
- Include 2–3 grammar patterns highlighted by the lyrics
- Focus on things a learner would find surprising or useful
- Each needs `rule` (short name), `exampleSentence` (from the lyrics), `explanation` (2–3 sentences)

**`sentences[].words`**
- For lyrics, annotate words that are colloquial, contracted, or unusual
- Danish spoken contractions are especially worth noting (e.g. `det'` = `det er`)

---

## News Digest Template

The news section is organised by **week**. Each week contains 3–5 short articles on different topics.
The bundle file wraps all weeks together — you only need to supply the **week object** for your new week.

### Week object structure

```json
{
  "weekOf": "2026-06-23",
  "articles": [
    { ... article 1 ... },
    { ... article 2 ... },
    { ... article 3 ... }
  ]
}
```

**`weekOf`**
- The Monday of the week, in `YYYY-MM-DD` format
- This is the key the app uses to navigate between weeks — always use the Monday date

### Article template

```json
{
  "id": "da-news-YYYYwWW-NN",
  "title": "Danish headline here",
  "level": "A2",
  "genre": "news",
  "source": "news",
  "metadata": {
    "publishedDate": "2026-06-23",
    "topic": "Kultur"
  },
  "sentences": [
    {
      "id": "da-nNN-s01",
      "text": "Danish sentence here.",
      "translation": "English translation here.",
      "words": [
        {
          "word": "danish-word",
          "definition": "English meaning",
          "partOfSpeech": "noun, c.",
          "grammar": "en X · Xen (definite) · any useful note"
        }
      ]
    },
    {
      "id": "da-nNN-s02",
      "text": "Next sentence.",
      "translation": "English translation.",
      "words": []
    }
  ]
}
```

### News-specific field rules

**`id`**
- Pattern: `da-news-{YYYY}w{WW}-{NN}`
- `{YYYY}` = year, `{WW}` = ISO week number (2 digits), `{NN}` = article number within the week (01, 02 …)
- Example for week 26 of 2026, second article: `da-news-2026w26-02`
- To find the ISO week number: [whatweekisit.com](https://whatweekisit.com) or count from Jan 1

**`metadata.topic`**
- A short Danish category label shown as a tag on the article card
- Use one of the established topics for consistency, or add a new one if needed:
  - `Vejr` · `Politik` · `Kultur` · `Sport` · `Sundhed` · `Økonomi` · `Teknologi` · `Film` · `Musik` · `Videnskab` · `Miljø` · `Uddannelse`

**`metadata.publishedDate`**
- The specific date the article is "published", in `YYYY-MM-DD` format
- Shown to the reader below the headline
- Can be any day within the week — spread articles across different days if you like

**`genre`** and **`source`**
- Always `"genre": "news"`, `"source": "news"`

**`sentences`**
- Aim for 4–6 sentences per article — news articles are short
- Write in simple journalistic Danish (subject–verb–object, no sub-clauses at A1/A2)
- Higher levels (B1/B2) can use passive voice, subordinate clauses, reported speech

**`sentences[].id`**
- Pattern: `da-n{NN}-s{MM}` where `NN` is the article number within the week and `MM` is the sentence number
- Example: article 3, sentence 2 → `da-n03-s02`

**`words[]`**
- Same rules as for stories (see above)
- For news, pay extra attention to: political/institutional vocabulary, comparative/superlative forms, passive voice constructions

### Full week example

```json
{
  "weekOf": "2026-06-23",
  "articles": [
    {
      "id": "da-news-2026w26-01",
      "title": "Sommerferie starter for millioner af danskere",
      "level": "A1",
      "genre": "news",
      "source": "news",
      "metadata": {
        "publishedDate": "2026-06-23",
        "topic": "Uddannelse"
      },
      "sentences": [
        {
          "id": "da-n01-s01",
          "text": "I dag starter sommerferien for mange danske skolebørn.",
          "translation": "Today the summer holiday begins for many Danish schoolchildren.",
          "words": [
            {
              "word": "skolebørn",
              "definition": "schoolchildren",
              "partOfSpeech": "noun, n. pl.",
              "grammar": "et skolebarn · skolebørn (pl.) · skole + barn compound"
            }
          ]
        },
        {
          "id": "da-n01-s02",
          "text": "Ferien varer seks uger.",
          "translation": "The holiday lasts six weeks.",
          "words": [
            {
              "word": "varer",
              "definition": "lasts, takes",
              "partOfSpeech": "verb",
              "grammar": "vare (to last) · present: varer · past: varede"
            }
          ]
        }
      ]
    },
    {
      "id": "da-news-2026w26-02",
      "title": "Ny bro forbinder to danske øer",
      "level": "A2",
      "genre": "news",
      "source": "news",
      "metadata": {
        "publishedDate": "2026-06-24",
        "topic": "Politik"
      },
      "sentences": [
        {
          "id": "da-n02-s01",
          "text": "En ny bro er åbnet mellem to danske øer.",
          "translation": "A new bridge has been opened between two Danish islands.",
          "words": [
            {
              "word": "bro",
              "definition": "bridge",
              "partOfSpeech": "noun, c.",
              "grammar": "en bro · broen (def.) · broer (pl.)"
            },
            {
              "word": "øer",
              "definition": "islands",
              "partOfSpeech": "noun, c. pl.",
              "grammar": "en ø · øer (pl.) · øen (def. sg.) · irregular"
            }
          ]
        },
        {
          "id": "da-n02-s02",
          "text": "Broen sparer pendlerne for over en time i transport dagligt.",
          "translation": "The bridge saves commuters over an hour of transport daily.",
          "words": [
            {
              "word": "pendlerne",
              "definition": "the commuters",
              "partOfSpeech": "noun, c. pl.",
              "grammar": "en pendler · pendlerne (def. pl.) · from pendle (to commute)"
            },
            {
              "word": "dagligt",
              "definition": "daily",
              "partOfSpeech": "adv.",
              "grammar": "daglig (daily adj.) · dagligt (adverb/neuter form)"
            }
          ]
        }
      ]
    }
  ]
}
```

### How to deliver news content

Deliver **one file per week**, named `week-YYYY-MM-DD.json` (using the Monday date).
The file contains exactly one week object as shown above — not wrapped in any array or bundle.

Example filename: `week-2026-06-23.json`

---

## Full story example (A1)

```json
{
  "id": "da-story-006-pigen-og-havet",
  "title": "Pigen og havet",
  "level": "A1",
  "genre": "narrative",
  "source": "story",
  "sentences": [
    {
      "id": "da-story-006-s01",
      "text": "Astrid bor i en lille by ved havet.",
      "translation": "Astrid lives in a small town by the sea.",
      "words": [
        {
          "word": "havet",
          "definition": "the sea",
          "partOfSpeech": "noun, n.",
          "grammar": "et hav (a sea) · havet (the sea) · -et suffix = neuter definite"
        }
      ]
    },
    {
      "id": "da-story-006-s02",
      "text": "Hver morgen går hun ned til stranden.",
      "translation": "Every morning she walks down to the beach.",
      "words": [
        {
          "word": "stranden",
          "definition": "the beach",
          "partOfSpeech": "noun, c.",
          "grammar": "en strand (a beach) · stranden (the beach)"
        }
      ]
    }
  ]
}
```

---

## Checklist before sharing

**All content types**
- [ ] `id` is unique and follows the naming pattern for its type
- [ ] Every sentence has a non-empty `translation`
- [ ] Sentence IDs are sequential and zero-padded (`s01`, `s02` …)
- [ ] Each `words[].word` appears verbatim (lowercase) in that sentence's `text`
- [ ] `level` is one of `A1` / `A2` / `B1` / `B2`
- [ ] JSON is valid (paste into [jsonlint.com](https://jsonlint.com) to check)

**Stories only**
- [ ] `"genre": "narrative"`, `"source": "story"`
- [ ] 8–15 sentences

**Lyrics only**
- [ ] `"genre": "lyrics"`, `"source": "lyrics"`
- [ ] `stanzaBreaks` indices match actual stanza boundaries
- [ ] At least 2 `grammarPoints` in metadata
- [ ] `metadata.artist` and `metadata.titleEn` are filled in

**News only**
- [ ] File is named `week-YYYY-MM-DD.json` using the Monday of the week
- [ ] `weekOf` date is a Monday in `YYYY-MM-DD` format
- [ ] 3–5 articles per week, each 4–6 sentences
- [ ] Article IDs follow `da-news-{YYYY}w{WW}-{NN}` pattern
- [ ] `metadata.topic` is filled in for every article
- [ ] `metadata.publishedDate` is filled in for every article
- [ ] `"genre": "news"`, `"source": "news"`
