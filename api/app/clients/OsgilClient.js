const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const BaseClient = require('./BaseClient');
const { EModelEndpoint } = require('librechat-data-provider');
const { logger } = require('~/config');

class OsgilClient extends BaseClient {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.apiUrl = options.apiUrl || 'wss://osgilapi.ngrok.io';
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
    
    this.responsePromise = new Promise(async (resolve, reject) => {
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

      socket.on('open', () => {
        logger.debug('OsgilClient WebSocket connection established');
        console.log("[OSGIL] SENDING MESSAGE TO SOCKET", message);
        socket.send(JSON.stringify({ type: 'message', content: message }));
      });

      const handleMessage = (data) => {
        console.log("[OSGIL] HANDLE MESSAGE", data);
        try {
          const chunk = JSON.parse(data);
          console.log("[OSGIL] CHUNK", chunk);

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
              console.log("[OSGIL] FINAL CHUNK", chunk);
              console.log("[OSGIL] CITATION LOGS", chunk.citation_logs);
              responseMessage.citations = chunk.citation_logs;
              console.log("[OSGIL] RESPONSE MESSAGE", responseMessage);
              
              // Resolve the responsePromise with a conversation object
              resolve({
                conversation: {
                  title: 'New Chat', // Or generate a title based on the conversation
                  // Add any other relevant conversation properties
                }
              });
              
              resolve(responseMessage);
              console.log("[OSGIL] RESOLVED RESPONSE MESSAGE", responseMessage);
              break;

            case 'tool_start':
              toolUseStartTime = process.hrtime.bigint();
              break;

            case 'tool_end':
              toolUseEndTime = process.hrtime.bigint();
              break;
          }
        } catch (error) {
          logger.error('Error parsing message:', error);
          reject(error);
        }
      };

      socket.on('message', handleMessage);

      abortController.signal.addEventListener('abort', () => {
        console.log("[OSGIL] ABORT CONTROLLER ABORTED");
        socket.close();
        reject(new Error('Request aborted'));
      });

      socket.on('error', (error) => {
        console.log("[OSGIL] SOCKET ERROR", error);
        logger.error('OsgilClient WebSocket error:', error);
        // Don't reject here, just log the error
      });

      socket.on('close', () => {
        console.log("[OSGIL] SOCKET CLOSED");
        logger.debug('OsgilClient WebSocket connection closed');
      });
    });

    return await this.responsePromise;
  }

  async getCompletion(message, options) {
    console.log("[OSGIL] GET COMPLETION", message, options);
    throw new Error('Method not implemented');
  }

  async createChatCompletion(message, options) {
    console.log("[OSGIL] CREATE CHAT COMPLETION", message, options);
    throw new Error('Method not implemented');
  }

  getBuildMessagesOptions() {
    console.log("[OSGIL] GET BUILD MESSAGES OPTIONS");
    throw new Error('Method not implemented');
  }

  getSaveOptions() {
    console.log("[OSGIL] GET SAVE OPTIONS");
    return {
      endpoint: this.options.endpoint,
    };
  }
}

module.exports = OsgilClient;
