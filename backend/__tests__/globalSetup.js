const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  global.__MONGOD__ = await MongoMemoryServer.create();
  process.env.MONGODB_URI = global.__MONGOD__.getUri();
  process.env.JWT_SECRET = 'test-secret-key-for-jest';
};