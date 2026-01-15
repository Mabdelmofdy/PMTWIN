/**
 * Location Configuration Module
 * Single source of truth for countries and cities
 * Config-driven location data for Opportunity workflows
 */

(function() {
  'use strict';

  /**
   * Allowed countries for opportunities
   * @type {string[]}
   */
  const allowedCountries = [
    'Saudi Arabia',
    'United Arab Emirates',
    'Egypt'
  ];

  /**
   * Cities mapped by country
   * @type {Object.<string, string[]>}
   */
  const citiesByCountry = {
    'Saudi Arabia': [
      'Riyadh',
      'Jeddah',
      'Dammam',
      'Khobar',
      'Makkah',
      'Madinah',
      'Tabuk (NEOM)'
    ],
    'United Arab Emirates': [
      'Dubai',
      'Abu Dhabi',
      'Sharjah'
    ],
    'Egypt': [
      'Cairo',
      'Alexandria',
      'Giza'
    ]
  };

  /**
   * Default country (optional)
   * @type {string|null}
   */
  const defaultCountry = 'Saudi Arabia';

  /**
   * Get all allowed countries
   * @returns {string[]}
   */
  function getAllowedCountries() {
    return [...allowedCountries];
  }

  /**
   * Get cities for a specific country
   * @param {string} country - Country name
   * @returns {string[]} - Array of city names
   */
  function getCitiesByCountry(country) {
    if (!country) return [];
    return citiesByCountry[country] || [];
  }

  /**
   * Check if a country is allowed
   * @param {string} country - Country name
   * @returns {boolean}
   */
  function isCountryAllowed(country) {
    return allowedCountries.includes(country);
  }

  /**
   * Check if a city exists in a country
   * @param {string} country - Country name
   * @param {string} city - City name
   * @returns {boolean}
   */
  function isCityInCountry(country, city) {
    const cities = getCitiesByCountry(country);
    return cities.includes(city);
  }

  /**
   * Get default country
   * @returns {string|null}
   */
  function getDefaultCountry() {
    return defaultCountry;
  }

  // Export to window for global access
  window.LocationConfig = {
    allowedCountries: getAllowedCountries(),
    citiesByCountry: citiesByCountry,
    defaultCountry: defaultCountry,
    getAllowedCountries: getAllowedCountries,
    getCitiesByCountry: getCitiesByCountry,
    isCountryAllowed: isCountryAllowed,
    isCityInCountry: isCityInCountry,
    getDefaultCountry: getDefaultCountry
  };

  console.log('[LocationConfig] Initialized with', allowedCountries.length, 'countries');
})();
