require('module-alias/register');
const path = require('node:path');
const dotenv = require('dotenv');

const { dbConnect } = require('@m/init_mongo.js');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect DB
module.exports = async () => await dbConnect();