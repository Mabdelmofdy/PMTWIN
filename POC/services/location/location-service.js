/**
 * Location Service
 * Manages countries, regions, and cities data
 */

(function() {
  'use strict';

  let locationsData = null;

  /**
   * Load locations data
   */
  async function loadLocationsData() {
    if (locationsData) {
      return locationsData;
    }

    try {
      const currentPath = window.location.pathname;
      const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC' && p !== '');
      const basePath = segments.length > 0 ? '../'.repeat(segments.length) : '';
      
      const response = await fetch(basePath + 'data/locations.json');
      if (!response.ok) {
        throw new Error('Failed to load locations data');
      }
      
      locationsData = await response.json();
      return locationsData;
    } catch (error) {
      console.error('[LocationService] Error loading locations data:', error);
      return null;
    }
  }

  /**
   * Get all countries
   */
  async function getCountries() {
    const data = await loadLocationsData();
    if (!data || !data.countries) return [];
    
    return data.countries.map(country => ({
      code: country.code,
      name: country.name
    }));
  }

  /**
   * Get regions for a country
   */
  async function getRegions(countryCode) {
    const data = await loadLocationsData();
    if (!data || !data.countries) return [];
    
    const country = data.countries.find(c => c.code === countryCode);
    if (!country || !country.regions) return [];
    
    return country.regions.map(region => ({
      code: region.code,
      name: region.name
    }));
  }

  /**
   * Get cities for a region in a country
   */
  async function getCities(countryCode, regionCode) {
    const data = await loadLocationsData();
    if (!data || !data.countries) return [];
    
    const country = data.countries.find(c => c.code === countryCode);
    if (!country || !country.regions) return [];
    
    const region = country.regions.find(r => r.code === regionCode);
    if (!region || !region.cities) return [];
    
    return region.cities;
  }

  /**
   * Find country by name or code
   */
  async function findCountry(countryNameOrCode) {
    const data = await loadLocationsData();
    if (!data || !data.countries) return null;
    
    return data.countries.find(c => 
      c.name === countryNameOrCode || 
      c.code === countryNameOrCode ||
      c.name.toLowerCase() === countryNameOrCode.toLowerCase()
    );
  }

  /**
   * Find region by name or code
   */
  async function findRegion(countryCode, regionNameOrCode) {
    const data = await loadLocationsData();
    if (!data || !data.countries) return null;
    
    const country = data.countries.find(c => c.code === countryCode);
    if (!country || !country.regions) return null;
    
    return country.regions.find(r => 
      r.name === regionNameOrCode || 
      r.code === regionNameOrCode ||
      r.name.toLowerCase() === regionNameOrCode.toLowerCase()
    );
  }

  /**
   * Find city
   */
  async function findCity(countryCode, regionCode, cityName) {
    const cities = await getCities(countryCode, regionCode);
    return cities.find(c => 
      c === cityName || 
      c.toLowerCase() === cityName.toLowerCase()
    );
  }

  /**
   * Get country code from country name
   */
  async function getCountryCode(countryName) {
    const country = await findCountry(countryName);
    return country ? country.code : null;
  }

  /**
   * Get region code from region name
   */
  async function getRegionCode(countryCode, regionName) {
    const region = await findRegion(countryCode, regionName);
    return region ? region.code : null;
  }

  // Export
  if (!window.LocationService) {
    window.LocationService = {
      loadLocationsData,
      getCountries,
      getRegions,
      getCities,
      findCountry,
      findRegion,
      findCity,
      getCountryCode,
      getRegionCode
    };
  }

})();


