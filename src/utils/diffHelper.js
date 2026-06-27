'use strict';
/**
 * diffHelper.js
 * diff kütüphanesi üzerine yardımcı sarmalayıcı.
 */

const diffLib = require('diff');

/**
 * İki metin arasındaki farkı hesaplar.
 * @param {string} oldText
 * @param {string} newText
 * @returns {{ added: boolean, removed: boolean, value: string }[]}
 */
function computeDiff(oldText, newText) {
  return diffLib.diffWords(oldText || '', newText || '').map((part) => ({
    added: part.added ?? false,
    removed: part.removed ?? false,
    value: part.value,
  }));
}

module.exports = { computeDiff };
