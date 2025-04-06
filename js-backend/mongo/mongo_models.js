const mongoose = require('mongoose');
const defaultNumber = 0;
// Account
const accountSchema = new mongoose.Schema({
    email: { type: String, default: null },
    // username: { type: String, default: null },
    password: { type: String, default: null },
    // auth_token: { type: String, default: null },
    settings: mongoose.Schema.Types.Mixed,
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
    merchant: { type: String, default: null },
    location: { type: String, default: null },
    tax: { type: Number, default: defaultNumber },
    date: { type: Date, default: null },
    total: { type: Number, default: defaultNumber },
    items: { type: [mongoose.Schema.Types.ObjectId], ref: 'Item', default: () => [] },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null }, // Buffer for image data
}, { strict: false });

// Receipt
const receiptSchema = new mongoose.Schema({
    data: { type: Buffer, default: null },
    size: { type: [Number], min: [2, 'Receipt image size must be 2D'], max: [2, 'Receipt image size must be 2D'], default: () => [0, 0] },
    mode: { type: String, default: null },
});

// Item
const itemSchema = new mongoose.Schema({
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', default: null },
    name: { type: String, default: null },
    quantity: { type: Number, default: defaultNumber },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    price: { type: Number, default: defaultNumber },
}, { strict: false });

// Category
const categorySchema = new mongoose.Schema({
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
    items: { type: [mongoose.Schema.Types.ObjectId], ref: 'Item', default: () => [] },
    subcategories: { type: [mongoose.Schema.Types.ObjectId], ref: 'Subcategory', default: () => [] },
    name: { type: String, default: null },
}, { strict: false });

const subcategorySchema = new mongoose.Schema({
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
    items: { type: [mongoose.Schema.Types.ObjectId], ref: 'Item', default: () => [] },
    name: { type: String, default: null },
}, { strict: false });

// Unrestricted schema for misc collection
// const globalSchema = new mongoose.Schema({}, { strict: false });

const Account = mongoose.model('Account', accountSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);
const Item = mongoose.model('Item', itemSchema);
const Category = mongoose.model('Category', categorySchema);
const Receipt = mongoose.model('Receipt', receiptSchema);
const Subcategory = mongoose.model('Subcategory', subcategorySchema);
// const Global = mongoose.model('Global', globalSchema);

module.exports = {
    accounts: Account,
    purchases: Purchase,
    items: Item,
    categories: Category,
    subcategories: Subcategory,
    receipts: Receipt,
    // global: Global,
};