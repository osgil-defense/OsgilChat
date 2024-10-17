const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const BaseClient = require('./BaseClient');
const { EModelEndpoint } = require('librechat-data-provider');
const { logger } = require('~/config');

class OsgilClient extends BaseClient {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.apiUrl = options.apiUrl || 'ws://localhost:8889';
    console.log("[OSGIL] API URL", this.apiUrl);
    this.sender = 'Osgil';
    this.iconURL = 'https://framerusercontent.com/images/xsYMhuWJGE7qmVkSDcVnfonzWEU.png';
    this.setOptions(options);
  }

  setOptions(options) {
    if (this.options && !this.options.replaceOptions) {
      this.options = {
        ...this.options,
        ...options,
      };
    } else {
      this.options = options;
    }
    this.options.endpoint = this.options.endpoint || EModelEndpoint.osgil;
  }

  async sendMessage(message, opts = {}) {
    console.log("[OSGIL] SENDING MESSAGE", message);
    console.log("[OSGIL] OPTIONS", opts);
    const { onProgress, abortController = new AbortController() } = opts;
    console.log("[OSGIL] ABORT CONTROLLER", abortController);
    return new Promise(async (resolve, reject) => {
      const socket = new WebSocket(`${this.apiUrl}/ws`);
      let responseMessage = {
        sender: this.sender,
        text: '',
        messageId: uuidv4(),
        parentMessageId: opts.parentMessageId,
        conversationId: opts.conversationId || uuidv4(),
        isCreatedByUser: false,
        error: false,
      };
      console.log("[OSGIL] RESPONSE MESSAGE", responseMessage);
      const startTime = process.hrtime.bigint();
      let streamStartTime = null;
      let streamFirstChunkTime = null;
      let toolUseStartTime = null;
      let toolUseEndTime = null;

      socket.on('error', (error) => {
        logger.error('OsgilClient WebSocket error:', error);
        reject(error);
      });

      socket.on('close', () => {
        logger.debug('OsgilClient WebSocket connection closed');
      });

      socket.on('open', () => {
        logger.debug('OsgilClient WebSocket connection established');
        socket.send(message);
      });

      const handleMessage = (data) => {
        const chunk = JSON.parse(data);

        switch (chunk.type) {
          case 'stream':
            if (!streamStartTime) {
              streamStartTime = process.hrtime.bigint();
            }
            if (!streamFirstChunkTime) {
              streamFirstChunkTime = process.hrtime.bigint();
            }
            responseMessage.text += chunk.content;
            if (onProgress) {
              onProgress(chunk.content);
            }
            break;

          case 'final':
            responseMessage.citations = chunk.citation_logs;
            resolve(responseMessage);
            break;

          case 'tool_start':
            toolUseStartTime = process.hrtime.bigint();
            break;

          case 'tool_end':
            toolUseEndTime = process.hrtime.bigint();
            break;
        }
      };

      socket.on('message', handleMessage);

      abortController.signal.addEventListener('abort', () => {
        socket.close();
        reject(new Error('Request aborted'));
      });
    });
  }

  async getCompletion(message, options) {
    throw new Error('Method not implemented');
  }

  async createChatCompletion(message, options) {
    throw new Error('Method not implemented');
  }

  getBuildMessagesOptions() {
    throw new Error('Method not implemented');
  }

  getSaveOptions() {
    return {
      endpoint: this.options.endpoint,
    };
  }
}

module.exports = OsgilClient;