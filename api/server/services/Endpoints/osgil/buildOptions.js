const { removeNullishValues } = require('librechat-data-provider');
const generateArtifactsPrompt = require('~/app/clients/prompts/artifacts');

const buildOptions = (endpoint, parsedBody) => {
  const {
    modelName,
    promptPrefix,
    maxContextTokens,
    resendFiles = true,
    imageDetail,
    iconURL,
    greeting,
    spec,
    artifacts,
    ...modelOptions
  } = parsedBody;

  console.log('[TESTLOG] BUILD OPTIONS', parsedBody);

  const endpointOption = removeNullishValues({
    endpoint,
    modelName,
    promptPrefix,
    resendFiles,
    imageDetail,
    iconURL,
    greeting,
    spec,
    maxContextTokens,
    modelOptions,
  });

  if (typeof artifacts === 'string') {
    endpointOption.artifactsPrompt = generateArtifactsPrompt({ endpoint, artifacts });
  }

  return endpointOption;
};

module.exports = buildOptions;