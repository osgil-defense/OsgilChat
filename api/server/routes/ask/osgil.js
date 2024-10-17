const express = require('express');
const AskController = require('~/server/controllers/AskController');
const { initializeClient, addTitle } = require('~/server/services/Endpoints/osgil');
const {
  setHeaders,
  handleAbort,
  validateModel,
  validateEndpoint,
  buildEndpointOption,
} = require('~/server/middleware');

const router = express.Router();

router.post('/abort', handleAbort());

router.post(
  '/',
  validateEndpoint,
  validateModel,
  buildEndpointOption,
  setHeaders,
  async (req, res, next) => {
    console.log('OSGIL ROUTE');
    await AskController(req, res, next, initializeClient, addTitle);
  },
);

router.post('/test', (req, res) => {
  console.log('[TESTLOG] TEST ROUTE');
  res.send('Hello World');
});

module.exports = router;