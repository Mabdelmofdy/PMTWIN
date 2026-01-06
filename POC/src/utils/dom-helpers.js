/**
 * PMTwin DOM Helpers
 * DOM manipulation utilities
 */

(function() {
  'use strict';

  /**
   * Get element by ID (with null check)
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} Element or null
   */
  function getElementById(id) {
    return document.getElementById(id);
  }

  /**
   * Query selector (with null check)
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null} Element or null
   */
  function querySelector(selector, context = document) {
    return context.querySelector(selector);
  }

  /**
   * Query selector all
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {NodeList} Node list
   */
  function querySelectorAll(selector, context = document) {
    return context.querySelectorAll(selector);
  }

  /**
   * Create element with attributes
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string} content - Inner HTML content
   * @returns {HTMLElement} Created element
   */
  function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'textContent') {
        element.textContent = attributes[key];
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    if (content) {
      element.innerHTML = content;
    }
    return element;
  }

  /**
   * Show element
   * @param {Element} element - Element to show
   */
  function showElement(element) {
    if (element) {
      element.style.display = '';
      element.classList.remove('hidden');
    }
  }

  /**
   * Hide element
   * @param {Element} element - Element to hide
   */
  function hideElement(element) {
    if (element) {
      element.style.display = 'none';
      element.classList.add('hidden');
    }
  }

  /**
   * Toggle element visibility
   * @param {Element} element - Element to toggle
   */
  function toggleElement(element) {
    if (element) {
      if (element.style.display === 'none' || element.classList.contains('hidden')) {
        showElement(element);
      } else {
        hideElement(element);
      }
    }
  }

  /**
   * Add class to element
   * @param {Element} element - Element
   * @param {string} className - Class name
   */
  function addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  }

  /**
   * Remove class from element
   * @param {Element} element - Element
   * @param {string} className - Class name
   */
  function removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  }

  /**
   * Toggle class on element
   * @param {Element} element - Element
   * @param {string} className - Class name
   */
  function toggleClass(element, className) {
    if (element) {
      element.classList.toggle(className);
    }
  }

  /**
   * Set inner HTML safely
   * @param {Element} element - Element
   * @param {string} html - HTML content
   */
  function setInnerHTML(element, html) {
    if (element) {
      element.innerHTML = html;
    }
  }

  /**
   * Clear element content
   * @param {Element} element - Element
   */
  function clearElement(element) {
    if (element) {
      element.innerHTML = '';
    }
  }

  // Export
  window.DOMHelpers = {
    getElementById,
    querySelector,
    querySelectorAll,
    createElement,
    showElement,
    hideElement,
    toggleElement,
    addClass,
    removeClass,
    toggleClass,
    setInnerHTML,
    clearElement
  };

})();

