/**
 * Categories are stored in `event.categoriesAvailable` as a string.
 *
 * Legacy format (text):
 *   Age Groups: U-10, U-12
 *   Strokes: Freestyle, Backstroke
 *
 * Modern format (JSON string):
 *   {"version":2,"sections":[{"id":"...","label":"Age Groups","items":["U-10","U-12"]}]}
 *
 * We support reading both; we always *write* JSON v2 for correctness.
 */

const V2_VERSION = 2;

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const uniq = (arr) => Array.from(new Set((arr || []).map((s) => String(s || '').trim()).filter(Boolean)));

export function parseCategoriesAvailable(value) {
  const text = String(value || '').trim();
  if (!text) return { version: V2_VERSION, sections: [] };

  // Try JSON v2 first
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const obj = JSON.parse(text);
      if (obj && typeof obj === 'object') {
        const sectionsRaw = Array.isArray(obj.sections) ? obj.sections : Array.isArray(obj) ? obj : null;
        if (sectionsRaw) {
          const sections = sectionsRaw
            .map((s) => {
              const label = String(s?.label || s?.name || '').trim();
              const items = uniq(s?.items || s?.values || []);
              if (!label || items.length === 0) return null;
              return { id: String(s?.id || makeId()), label, items };
            })
            .filter(Boolean);
          return { version: V2_VERSION, sections };
        }
      }
    } catch {
      // fall through to legacy text parsing
    }
  }

  // Legacy text parsing: each "Label: a, b, c" becomes a section.
  const sections = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) continue;
    const label = String(m[1] || '').trim();
    const items = uniq(String(m[2] || '').split(',').map((v) => v.trim()));
    if (!label || items.length === 0) continue;
    sections.push({ id: makeId(), label, items });
  }

  return { version: V2_VERSION, sections };
}

export function normalizeCategoriesModel(model) {
  const sections = (model?.sections || [])
    .map((s) => {
      const label = String(s?.label || '').trim();
      const items = uniq(s?.items || []);
      if (!label || items.length === 0) return null;
      return { id: String(s?.id || makeId()), label, items };
    })
    .filter(Boolean);

  return { version: V2_VERSION, sections };
}

export function serializeCategoriesAvailable(model) {
  const normalized = normalizeCategoriesModel(model);
  // Keep it compact (DB field is a string)
  return normalized.sections.length ? JSON.stringify(normalized) : '';
}

export function buildSelectedCategoryString(sections, selectedByIndex) {
  const values = (sections || []).map((_, idx) => String(selectedByIndex?.[idx] || '').trim());
  if (values.some((v) => !v)) return '';
  return values.join(' | ');
}

