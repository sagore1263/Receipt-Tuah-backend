require('./init')();

const models = require('@m/mongo_models.js');

let deleted = 0;

// (async () => {
    Object.values(models).forEach(model => {
        model.deleteMany({}).then(() => {
            console.log(`All documents deleted from ${model.modelName} collection.`);
            // After last delete, terminate
            if (++deleted === Object.keys(models).length) process.exit(0);
        }).catch(err => {
            console.error(`Error deleting documents from ${model.modelName} collection:`, err);
        });
    });
// })();