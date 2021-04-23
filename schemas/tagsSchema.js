const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const tagsSchema = new mongoose.Schema({
  name: String,
  cover: String,
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
}, { timestamps: true });
tagsSchema.plugin(mongoosePaginate);

const Tag = mongoose.model("Tag", tagsSchema);

module.exports = Tag;
