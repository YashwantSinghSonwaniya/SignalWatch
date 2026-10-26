import { SUPPORTED_COUNTRY_CODES, HAZARD_CATEGORIES } from './types.js';

/**
 * Normalizes searchData from HyperDart platform (handles both array and single-object forms)
 *
 * @param {Array|Object} searchData - Raw searchData prop
 * @param {string} rawSearchQuery - Fallback raw search query string
 * @returns {Object} Normalized search parameters & location context
 */
export function normalizeSearchData(searchData, rawSearchQuery = '') {
  // Handle array vs object shape
  const root = Array.isArray(searchData) ? searchData[0] || {} : searchData || {};
  const query = (root.query || rawSearchQuery || '').trim();

  const isNearMe = /(?:near|around)\s+me/i.test(query);

  let locationEntity = null;
  if (Array.isArray(root.entities)) {
    locationEntity = root.entities.find(
      (e) => e?.collectionType === 'HD_LOCATION' || e?.entityInfo?.geo
    );
    if (!locationEntity && root.entities.length > 0) {
      locationEntity = root.entities.find((e) => e?.entityInfo?.lat || e?.entityInfo?.geo);
    }
  }

  const userLocation = root.userLocation || {};
  const userCoords = userLocation.position?.coords || {};
  const userCountryCode = (userLocation.countryCode || userLocation.position?.countryCode || '').toUpperCase();

  let placeName = '';
  let state = '';
  let stateAbb = '';
  let country = '';
  let countryCode = '';
  let timezone = '';
  let latitude = null;
  let longitude = null;
  let source = 'none';

  if (isNearMe && (userCoords.latitude != null || userCoords.lat != null)) {
    latitude = userCoords.latitude ?? userCoords.lat;
    longitude = userCoords.longitude ?? userCoords.long ?? userCoords.lon;
    countryCode = userCountryCode || 'US';
    placeName = 'Current Location';
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    source = 'userLocation';
  } else if (locationEntity) {
    const geo = locationEntity.entityInfo?.geo || locationEntity.entityInfo || {};
    latitude = geo.lat ?? geo.latitude ?? null;
    longitude = geo.long ?? geo.longitude ?? geo.lon ?? null;
    placeName = geo.city || locationEntity.word || '';
    state = geo.state || '';
    stateAbb = geo.stateAbb || '';
    country = geo.country || '';
    countryCode = (geo.countryCode || '').toUpperCase();
    timezone = geo.tz || '';
    source = 'entity';
  } else if (userCoords.latitude != null || userCoords.lat != null) {
    latitude = userCoords.latitude ?? userCoords.lat;
    longitude = userCoords.longitude ?? userCoords.long ?? userCoords.lon;
    countryCode = userCountryCode;
    placeName = 'Current Location';
    source = 'userLocation';
  }

  // Fallback state extraction from query if state is missing
  if (!stateAbb && query) {
    const stateMatch = query.match(/\b(in|for)\s+([A-Za-z\s]+)$/i);
    if (stateMatch) {
      const candidate = stateMatch[2].trim().toLowerCase();
      const stateMap = {
        colorado: 'CO',
        alaska: 'AK',
        texas: 'TX',
        arizona: 'AZ',
        california: 'CA',
        florida: 'FL',
        washington: 'WA',
        oregon: 'OR',
        hawaii: 'HI'
      };
      if (stateMap[candidate]) {
        stateAbb = stateMap[candidate];
        if (!placeName) placeName = stateMatch[2].trim();
      }
    }
  }

  // Determine coverage
  let isSupportedCoverage = true;
  let unsupportedReason = '';

  if (countryCode && !SUPPORTED_COUNTRY_CODES.includes(countryCode)) {
    isSupportedCoverage = false;
    unsupportedReason = `Official National Weather Service alerts are limited to the United States and its territories. Location '${placeName || country}' (${countryCode}) is outside the supported coverage area.`;
  } else if (country && !['united states', 'usa', 'us', 'puerto rico', 'guam', 'virgin islands'].includes(country.toLowerCase())) {
    isSupportedCoverage = false;
    unsupportedReason = `Official National Weather Service alerts are limited to the United States and its territories. Location '${placeName || country}' is outside the supported coverage area.`;
  } else if (/delhi|london|paris|tokyo|toronto|berlin|sydney|mumbai/i.test(query) || /delhi/i.test(placeName)) {
    isSupportedCoverage = false;
    countryCode = countryCode || 'IN';
    unsupportedReason = `Official National Weather Service alerts are limited to the United States and its territories. Location '${placeName || 'requested international city'}' is outside the supported coverage area.`;
  }

  // Hazard detection from query
  const targetHazard = extractHazardFromQuery(query);

  // Question query detection: "is there a [hazard] in [location]"
  const questionInfo = extractQuestionInfo(query);

  return {
    rawQuery: query,
    placeName: placeName || (state ? state : 'Unknown Location'),
    state,
    stateAbb,
    country: country || (countryCode === 'US' ? 'United States' : countryCode),
    countryCode: countryCode || (isSupportedCoverage ? 'US' : 'UNKNOWN'),
    timezone: timezone || 'America/New_York',
    latitude: latitude != null ? Number(latitude) : null,
    longitude: longitude != null ? Number(longitude) : null,
    source,
    isNearMe,
    isSupportedCoverage,
    unsupportedReason,
    targetHazard,
    questionInfo,
    isValidLocation: Boolean(
      (latitude != null && longitude != null) ||
      stateAbb ||
      (placeName && isSupportedCoverage)
    )
  };
}

/**
 * Extracts specific hazard type requested in query string
 */
export function extractHazardFromQuery(query = '') {
  const q = query.toLowerCase();
  if (/flash\s+flood|flood/i.test(q)) return HAZARD_CATEGORIES.FLOOD;
  if (/tornado/i.test(q)) return HAZARD_CATEGORIES.TORNADO;
  if (/heat|excessive\s+heat/i.test(q)) return HAZARD_CATEGORIES.HEAT;
  if (/winter|snow|blizzard|ice|freeze|frost|wind\s+chill/i.test(q)) return HAZARD_CATEGORIES.WINTER;
  if (/wind|gale|high\s+wind/i.test(q)) return HAZARD_CATEGORIES.WIND;
  if (/fire|red\s+flag/i.test(q)) return HAZARD_CATEGORIES.FIRE;
  if (/hurricane|tropical\s+storm|typhoon|storm\s+surge/i.test(q)) return HAZARD_CATEGORIES.HURRICANE;
  if (/air\s+quality|smoke/i.test(q)) return HAZARD_CATEGORIES.AIR_QUALITY;
  if (/severe\s+weather|severe\s+alert/i.test(q)) return HAZARD_CATEGORIES.SEVERE_WEATHER;
  return HAZARD_CATEGORIES.ALL;
}

/**
 * Parses queries like "is there a heat advisory in Phoenix"
 */
export function extractQuestionInfo(query = '') {
  const isQuestion = /^is\s+there\s+(a|an|any)?/i.test(query.trim());
  if (!isQuestion) return null;

  const match = query.match(/^is\s+there\s+(?:a|an|any)?\s*(.*?)(?:warning|alert|watch|advisory)\s+(?:in|for|near|at)\s+(.*)$/i);
  if (match) {
    const hazardType = (match[1] || '').trim();
    const targetPlace = (match[2] || '').trim();
    return {
      isQuestion: true,
      hazardType: hazardType || 'warning',
      hazardPhrase: `${hazardType ? hazardType + ' ' : ''}warning/advisory`.trim(),
      targetPlace
    };
  }

  return {
    isQuestion: true,
    hazardType: 'warning',
    hazardPhrase: 'alert/warning',
    targetPlace: ''
  };
}
