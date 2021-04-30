const mongoose = require('mongoose');

const tagsSchema = new mongoose.Schema({
  name: String,
  playCount: { type: Number, default: 0 },
  isCustom: { type: Boolean, default: true },
  isUnlisted: { type: Boolean, default: false },
  thumbnail: String,
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Tag = mongoose.model('Tag', tagsSchema);

module.exports = Tag;
