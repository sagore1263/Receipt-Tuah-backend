const mongoose = require('mongoose');
const defaultNumber = 0;
// Account
const accountSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    // username: { type: String, default: null },
    password: { type: String, required: true },
    // auth_token: { type: String, default: null },
    settings: mongoose.Schema.Types.Mixed,
    data: {
        type: {
            purchases: { type: [mongoose.Schema.Types.ObjectId], ref: 'Purchase', required: true },
            categories: { type: [mongoose.Schema.Types.ObjectId], ref: 'Category', required: true },
        },
        required: true,
        default: () => ({ purchases: [], categories: [] }),
        _id: false
    },
}, { strict: false });

// Purchase
const purchaseSchema = new mongoose.Schema({
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    merchant: { type: String, default: null },
    location: { type: String, default: null },
    tax: { type: Number, default: defaultNumber },
    date: { type: Date, default: null },
    total: { type: Number, default: defaultNumber },
    items: { type: [mongoose.Schema.Types.ObjectId], ref: 'Item', required: true },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', required: true },
}, { strict: false });

// Receipt
const receiptSchema = new mongoose.Schema({
    data: { type: Buffer, required: true }, // Buffer for image data
    size: { type: [Number], min: [2, 'Receipt image size must be 2D'], max: [2, 'Receipt image size must be 2D'], required: true },
    mode: { type: String, required: true },
});

// Item
const itemSchema = new mongoose.Schema({
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
    price: { type: Number, required: true },
}, { strict: false });

// Category
const categorySchema = new mongoose.Schema({
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    items: { type: [mongoose.Schema.Types.ObjectId], ref: 'Item', default: () => [], required: true },
    subcategories: { type: [mongoose.Schema.Types.ObjectId], ref: 'Subcategory', default: () => [], required: true },
    name: { type: String, required: true },
}, { strict: false });

// Subcategory
const subcategorySchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    items: { type: [mongoose.Schema.Types.ObjectId], ref: 'Item', default: () => [], required: true },
    name: { type: String, required: true },
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