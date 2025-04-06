require('./init')();

const models = require('@m/mongo_models.js');

// (async () => {
    Object.values(models).forEach(model => {
        model.deleteMany({}).then(() => {
            console.log(`All documents deleted from ${model.modelName} collection.`);
        }).catch(err => {
            console.error(`Error deleting documents from ${model.modelName} collection:`, err);
        });
    });
// })();