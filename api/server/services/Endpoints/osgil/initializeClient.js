const { EModelEndpoint } = require('librechat-data-provider');
const { getUserKeyValues, checkUserKeyExpiry } = require('~/server/services/UserService');
const { isEnabled, isUserProvided } = require('~/server/utils');
const { OsgilClient } = require('~/app');

const initializeClient = async ({ req, res, endpointOption }) => {
  const { OSGIL_API_KEY, OSGIL_REVERSE_PROXY, PROXY, DEBUG_OSGIL } = process.env;
  const { key: expiresAt } = req.body;

  const userProvidesKey = isUserProvided(OSGIL_API_KEY);
  const userProvidesURL = isUserProvided(OSGIL_REVERSE_PROXY);

  let userValues = null;
  if (expiresAt && (userProvidesKey || userProvidesURL)) {
    checkUserKeyExpiry(expiresAt, EModelEndpoint.osgil);
    userValues = await getUserKeyValues({ userId: req.user.id, name: EModelEndpoint.osgil });
  }

  let apiKey = userProvidesKey ? userValues?.apiKey : OSGIL_API_KEY;
  let baseURL = userProvidesURL ? userValues?.baseURL : OSGIL_REVERSE_PROXY;

  if (!apiKey && false) {
    throw new Error('Osgil API key not provided. Please provide it again.');
  }

  const clientOptions = {
    debug: isEnabled(DEBUG_OSGIL),
    reverseProxyUrl: baseURL ?? null,
    proxy: PROXY ?? null,
    req,
    res,
    ...endpointOption,
  };

  /** @type {undefined | TBaseEndpoint} */
  const osgilConfig = req.app.locals[EModelEndpoint.osgil];

  if (osgilConfig) {
    clientOptions.streamRate = osgilConfig.streamRate;
  }

  /** @type {undefined | TBaseEndpoint} */
  const allConfig = req.app.locals.all;
  if (allConfig) {
    clientOptions.streamRate = allConfig.streamRate;
  }

  const client = new OsgilClient(apiKey, clientOptions);
  return {
    client,
    osgilApiKey: apiKey,
  };
};

module.exports = initializeClient;