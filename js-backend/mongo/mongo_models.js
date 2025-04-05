const mongoose = require('mongoose');
const stringDefault = 'NULL_STRING';
const defaultDate = new Date('1970-01-01T00:00:00Z'); // Default date value
const defaultNumber = 0;
// Account
const accountSchema = new mongoose.Schema({
    email: { type: String, default: null },
    username: { type: String, default: null },
    password: { type: String, default: null },
    auth_token: { type: String, default: null },
    data: {
        type: {
            purchases: { type: [mongoose.Schema.Types.ObjectId], ref: 'Purchase', required: true },
            categories: { type: [mongoose.Schema.Types.ObjectId], ref: 'Category', required: true },
        },
        required: true,
        default: () => ({ purchases: [], categories: [] }),
    },
}, { strict: false });

// Purchase
const purchaseSchema = new mongoose.Schema({
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
    date: { type: Date, default: defaultDate },
    total: { type: Number, default: defaultNumber },
    items: { type: [mongoose.Schema.Types.ObjectId], ref: 'Item', default: defaultArray },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null }, // Buffer for image data
}, { strict: false });

// Receipt
const receiptSchema = new mongoose.Schema({
    data: { type: Buffer, default: null },
});

// Item
const itemSchema = new mongoose.Schema({
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', default: null },
    name: { type: String, default: null },
    quantity: { type: Number, default: defaultNumber },
    price: { type: Number, default: defaultNumber },
}, { strict: false });

// Category
const categorySchema = new mongoose.Schema({
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
    items: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    name: { type: String, default: null },
}, { strict: false });

// Unrestricted schema for misc collection
// const globalSchema = new mongoose.Schema({}, { strict: false });

const Account = mongoose.model('Account', accountSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);
const Item = mongoose.model('Item', itemSchema);
const Category = mongoose.model('Category', categorySchema);
const Receipt = mongoose.model('Receipt', receiptSchema);
// const Global = mongoose.model('Global', globalSchema);

module.exports = {
    accounts: Account,
    purchases: Purchase,
    items: Item,
    categories: Category,
    receipts: Receipt,
    // global: Global,
};