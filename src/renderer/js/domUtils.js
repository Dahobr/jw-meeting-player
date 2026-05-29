/**
 * @fileoverview DomUtils
 * Utility class to encapsulate DOM access, manipulation, and creation,
 * reducing direct document/element DOM operations.
 */
class DomUtils {
    static get(id) {
        return document.getElementById(id);
    }
    
    /**
     * Queries for elements.
     * @param {string} selector 
     * @param {Element|Document} [context=document] 
     */
    static query(selector, context = document) {
        return context.querySelector(selector);
    }

    /**
     * Queries all elements.
     * @param {string} selector 
     * @param {Element|Document} [context=document] 
     */
    static queryAll(selector, context = document) {
        return context.querySelectorAll(selector);
    }

    /**
     * Creates a new element.
     * @param {string} tagName 
     * @param {Object} [options={}] 
     */
    static create(tagName, options = {}) {
        const el = document.createElement(tagName);
        if (options.className) el.className = options.className;
        if (options.innerHTML) el.innerHTML = options.innerHTML;
        if (options.dataset) {
            Object.entries(options.dataset).forEach(([key, value]) => {
                el.dataset[key] = value;
            });
        }
        return el;
    }
}
window.DomUtils = DomUtils;
