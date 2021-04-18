const mongoose = require('mongoose');

const songsSchema = new mongoose.Schema({
  title: String,
  url: String,
  cover: String,
  isAccepted: {type: Boolean, default: false},
  correctWords: [String],
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
}, {timestamps: true});

const Song = mongoose.model('Song', songsSchema);

module.exports = Song;
