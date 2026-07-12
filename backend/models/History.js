const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  companyName: { type: String, required: true },
  data: { type: Object, required: true },
  date: { type: Date, default: Date.now },
});

historySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('History', historySchema);
