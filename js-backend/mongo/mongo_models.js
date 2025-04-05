const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    email: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    discordId: { type: String, required: true },
}, { strict: false });

// Unrestricted schema for misc collection
// const globalSchema = new mongoose.Schema({}, { strict: false });

const Account = mongoose.model('Account', accountSchema);
// const Global = mongoose.model('Global', globalSchema);

module.exports = {
    accounts: Account,
    // global: Global,
};