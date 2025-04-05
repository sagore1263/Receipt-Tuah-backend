const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Example usage
console.log(process.env.MY_ENV_VAR);