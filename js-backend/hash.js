const crypto = require('node:crypto');

module.exports = (data) => crypto.createHmac('sha256', process.env.HASH_KEY).update(data).digest('base64');