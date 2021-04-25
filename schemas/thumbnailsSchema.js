/* eslint-disable max-len */
const mongoose = require("mongoose");

const thumbnailsSchema = new mongoose.Schema({
  url: String,
  width: Number,
  height: Number,
}, { timestamps: true });

const Thumbnail = mongoose.model("Thumbnail", thumbnailsSchema);

module.exports = { Thumbnail, thumbnailsSchema };
