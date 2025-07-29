const redis = require("redis");

/*
 * Redis istemcisi yapılandrması yapılır, session yönetimi ve cache için kullanılır.
 */
class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });

      //Error handling
      this.client.on("error", (err) => {
        console.log(`Redis client error: ${err}`);
      });

      this.client.on("connect", () => {
        console.log(`Redis client connected.`);
      });
      this.client.on("ready", () => {
        console.log(`Redis client is ready.`);
      });

      this.client.on("end", () => {
        console.log(`Redis client is closed.`);
      });

      await this.client.connect();

      return this.client;
    } catch (error) {
      console.log(`Redis connection error: ${error}`);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
module.exports = new RedisClient;
