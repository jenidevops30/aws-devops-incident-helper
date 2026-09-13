/**
 * Client-Side Incident History Storage Manager
 * Uses browser localStorage for 100% privacy, zero server storage, and zero cost.
 */

const STORAGE_KEY = 'aws_incident_history_v2';
const MAX_HISTORY_ITEMS = 50;

/**
 * Retrieve all saved incidents from localStorage, sorted newest first.
 */
export function getHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read incident history from localStorage:', err);
    return [];
  }
}

/**
 * Save an incident or log analysis to localStorage.
 * @param {Object} item
 * @param {string} item.title - Human readable title
 * @param {'incident'|'log_analysis'} item.type - Type of analysis
 * @param {string} item.severity - LOW | MEDIUM | HIGH | CRITICAL
 * @param {string} item.summary - Executive summary
 * @param {Object} item.analysis - Full analysis JSON payload
 * @param {string} item.rawInput - Original incident or log text (trimmed)
 * @returns {Object} the saved record
 */
export function saveIncident({ title, type = 'incident', severity = 'MEDIUM', summary = '', analysis = {}, rawInput = '' }) {
  if (typeof window === 'undefined') return null;

  try {
    const existing = getHistory();
    const id = 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date();

    const newRecord = {
      id,
      timestamp: now.toISOString(),
      formattedDate: now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      title: (title || summary || 'AWS Incident Investigation').slice(0, 80),
      type, // 'incident' or 'log_analysis'
      severity: severity || 'MEDIUM',
      summary: (summary || '').slice(0, 240),
      analysis,
      // For privacy and localStorage quota, save a safe snippet of the input
      inputSnippet: (rawInput || '').slice(0, 500),
    };

    // Prepend to array and limit to MAX_HISTORY_ITEMS
    const updated = [newRecord, ...existing.filter((item) => item.id !== id)].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch a custom window event so Navbar badge can update reactively
    window.dispatchEvent(new Event('incident_history_updated'));

    return newRecord;
  } catch (err) {
    console.error('Failed to save incident to localStorage:', err);
    return null;
  }
}

/**
 * Delete a specific incident by ID.
 */
export function deleteIncident(id) {
  if (typeof window === 'undefined' || !id) return false;
  try {
    const existing = getHistory();
    const filtered = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('incident_history_updated'));
    return true;
  } catch (err) {
    console.error('Failed to delete incident:', err);
    return false;
  }
}

/**
 * Clear all saved incident history.
 */
export function clearAllHistory() {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('incident_history_updated'));
    return true;
  } catch (err) {
    console.error('Failed to clear history:', err);
    return false;
  }
}

/**
 * Search saved incidents by keyword.
 */
export function searchHistory(query) {
  const all = getHistory();
  if (!query || !query.trim()) return all;

  const q = query.toLowerCase().trim();
  return all.filter((item) => {
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.summary && item.summary.toLowerCase().includes(q)) ||
      (item.severity && item.severity.toLowerCase().includes(q)) ||
      (item.type && item.type.toLowerCase().includes(q)) ||
      (item.inputSnippet && item.inputSnippet.toLowerCase().includes(q))
    );
  });
}

/**
 * Find related saved incidents based on simple keyword and AWS service matching.
 * Transparently labeled as local browser history matching (no vector search pretence).
 */
export function findRelatedIncidents(text, currentId = null) {
  if (!text || typeof text !== 'string') return [];
  const history = getHistory().filter((item) => item.id !== currentId);
  if (history.length === 0) return [];

  const lowerText = text.toLowerCase();

  // AWS service & incident category keywords
  const keywords = [
    'lambda', 'api gateway', 'apigateway', 's3', 'dynamodb', 'rds', 'aurora',
    'ecs', 'fargate', 'eks', 'ec2', 'vpc', 'subnet', 'nat gateway', 'cloudwatch',
    'timeout', '502', '504', '500', '403', 'accessdenied', 'permission',
    'throttl', 'memory', 'cpu', 'connection refused', 'connection pool',
  ];

  const matchedKeywords = keywords.filter((kw) => lowerText.includes(kw));
  if (matchedKeywords.length === 0) return [];

  const scored = history
    .map((item) => {
      const itemContent = `${item.title} ${item.summary} ${item.inputSnippet}`.toLowerCase();
      let score = 0;
      matchedKeywords.forEach((kw) => {
        if (itemContent.includes(kw)) {
          score += 1;
        }
      });
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.item);

  return scored;
}
