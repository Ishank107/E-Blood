const serverless = require('serverless-http');
const { createApp } = require('../app');

module.exports = serverless(createApp());
