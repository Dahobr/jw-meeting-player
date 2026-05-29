/**
 * domUtils.js
 * Utility for DOM manipulation.
 */
const DomUtils = {
    get: (id) => document.getElementById(id),
    query: (selector) => document.querySelector(selector)
};
