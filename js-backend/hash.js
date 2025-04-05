const crypto = require('node:crypto');

module.exports = (data) => crypto.createHmac('sha256').update(data).digest('base64');