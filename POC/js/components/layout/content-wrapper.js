/**
 * Content Wrapper Component
 * Provides standardized content section creation
 */

(function() {
  'use strict';

  /**
   * Create a content section
   * @param {Object} options - Content section options
   * @param {string} options.id - Section ID (optional)
   * @param {string} options.className - Additional CSS classes (optional)
   * @param {string} options.content - HTML content
   * @param {boolean} options.animate - Enable fade-in animation (default: true)
   * @returns {string} HTML string
   */
  function createContentSection(options = {}) {
    const {
      id = '',
      className = '',
      content = '',
      animate = true
    } = options;

    const classes = ['content-section'];
    if (className) {
      classes.push(className);
    }
    if (animate) {
      classes.push('fade-in');
    }

    const idAttr = id ? ` id="${id}"` : '';
    const classAttr = classes.join(' ');

    return `<div${idAttr} class="${classAttr}">${content}</div>`;
  }

  /**
   * Create multiple content sections
   * @param {Array} sections - Array of section options
   * @returns {string} HTML string
   */
  function createContentSections(sections = []) {
    return sections.map(section => createContentSection(section)).join('');
  }

  // Export
  window.ContentWrapper = {
    create: createContentSection,
    createMultiple: createContentSections
  };

})();

