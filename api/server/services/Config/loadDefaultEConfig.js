const { EModelEndpoint, getEnabledEndpoints } = require('librechat-data-provider');
const loadAsyncEndpoints = require('./loadAsyncEndpoints');
const { config } = require('./EndpointService');

/**
 * Load async endpoints and return a configuration object
 * @param {Express.Request} req - The request object
 * @returns {Promise<Object.<string, EndpointWithOrder>>} An object whose keys are endpoint names and values are objects that contain the endpoint configuration and an order.
 */
async function loadDefaultEndpointsConfig(req) {
  console.log("LOADING DEFAULT ENDPOINTS CONFIG", config);

  const { google, gptPlugins } = await loadAsyncEndpoints(req);
  const { assistants, azureAssistants, bingAI, azureOpenAI, chatGPTBrowser } = config;

  const enabledEndpoints = getEnabledEndpoints();

  console.log("ENABLED ENDPOINTS", enabledEndpoints);

  const endpointConfig = {
    [EModelEndpoint.openAI]: config[EModelEndpoint.openAI],
    [EModelEndpoint.agents]: config[EModelEndpoint.agents],
    [EModelEndpoint.assistants]: assistants,
    [EModelEndpoint.azureAssistants]: azureAssistants,
    [EModelEndpoint.azureOpenAI]: azureOpenAI,
    [EModelEndpoint.google]: google,
    [EModelEndpoint.bingAI]: bingAI,
    [EModelEndpoint.chatGPTBrowser]: chatGPTBrowser,
    [EModelEndpoint.gptPlugins]: gptPlugins,
    [EModelEndpoint.anthropic]: config[EModelEndpoint.anthropic],
    [EModelEndpoint.bedrock]: config[EModelEndpoint.bedrock],
    [EModelEndpoint.osgil]: config[EModelEndpoint.osgil],
  };

  const orderedAndFilteredEndpoints = enabledEndpoints.reduce((config, key, index) => {
    if (endpointConfig[key]) {
      config[key] = { ...(endpointConfig[key] ?? {}), order: index };
    }
    return config;
  }, {});

  console.log("ORDERED AND FILTERED ENDPOINTS", orderedAndFilteredEndpoints);

  return orderedAndFilteredEndpoints;
}

module.exports = loadDefaultEndpointsConfig;
