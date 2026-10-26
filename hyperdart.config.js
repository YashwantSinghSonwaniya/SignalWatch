import pkg from './package.json' with { type: 'json' };

export default {
  // Component name from package.json
  name: pkg.name,

  triggers: {
    keywords: [
      'weather alerts',
      'weather alert',
      'weather warnings',
      'weather warning',
      'severe weather',
      'tornado warning',
      'flood warning',
      'heat advisory',
      'winter storm warning',
      'safety alerts'
    ]
  },

  query_format: {
    regex: [
      '(weather|severe\\s+weather|safety|emergency)\\s+(alerts?|warnings?|advisories)\\s+(in|for|near|at)\\s+HD_LOCATION(__\\w+)?.*',
      '(tornado|flood|flash\\s+flood|heat|winter\\s+storm|storm|wind|fire\\s+weather|hurricane|air\\s+quality)\\s+(alerts?|warnings?|watch(es)?|advisor(y|ies))\\s+(in|for|near|at)\\s+HD_LOCATION(__\\w+)?.*',
      'is\\s+there\\s+(a|an|any)\\s+.*(warning|alert|watch|advisory)\\s+(in|for|near)\\s+HD_LOCATION(__\\w+)?.*',
      'HD_LOCATION(__\\w+)?\\s+(weather\\s+)?(alerts?|warnings?|advisories).*',
      '(weather\\s+)?(alerts?|warnings?)\\s+(near|around)\\s+me.*'
    ]
  },

  server: {
    location: 'dist/backend/index.js',
    configPath: 'dist/backend/wrangler.jsonc',
    schemaPath: 'dist/backend/schema.jsonc'
  },

  client: {
    location: pkg.module,
    moduleName: pkg.umdName || 'HD' + pkg.name,
    baseURL: '/' + pkg.name
  },

  format: {
    mainline: true,
    sidebar: true
  },

  permissions: {},

  info: {
    title: 'SignalWatch — Live Disruption & Safety Alerts',
    description: 'Instant, verified emergency warnings and disruption alerts with official National Weather Service data, localized timezones, and safety instructions.',
    author: 'Yashwant Singh Sonwaniya',
    version: pkg.version
  },

  github: 'https://github.com/yashwantsingh/signalwatch',
  demovideo: 'https://youtu.be/z-G_Uy_1Uu4'
};
