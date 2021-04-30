const mongoose = require('mongoose');

const tracksSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
  videoId: String,
  playCount: { type: Number, default: 0 },
  lengthSeconds: String,
  category: String,
  ownerChannelName: String,
  isAccepted: { type: Boolean, default: true },
  isUnlisted: { type: Boolean, default: false },
  answers: [String],
  keywords: [String],
  thumbnail: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
}, { timestamps: true });

const Track = mongoose.model('Track', tracksSchema);

module.exports = Track;
