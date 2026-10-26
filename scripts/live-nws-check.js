import { fetchNwsAlerts } from '../src/shared/nwsClient.js';

const location = {
  name: 'Houston, TX',
  latitude: 29.76328,
  longitude: -95.36327
};

try {
  const result = await fetchNwsAlerts(location);
  console.log(`Live NWS request succeeded for ${location.name}.`);
  console.log(`Endpoint: ${result.url}`);
  console.log(`Active alerts returned: ${result.totalActive}`);
  console.log(`Updated: ${result.updated}`);
  if (result.totalActive === 0) {
    console.log('No active alerts were returned for this point at request time.');
  }
} catch (error) {
  console.error(`Live NWS request failed for ${location.name}: ${error.message}`);
  process.exitCode = 1;
}
