/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {ApolloServer, gql} = require('apollo-server');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const {GraphQLScalarType, Kind} = require('graphql');
const ytdl = require('ytdl-core');

const uri = 'mongodb+srv://admin:admin@blind-test.bx9rj.mongodb.net/blind_test?retryWrites=true&w=majority';
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('connected');
});

const tagsSchema = new mongoose.Schema({
  name: String,
  cover: String,
  songs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Song'}],
}, {timestamps: true});
tagsSchema.plugin(mongoosePaginate);

const usersSchema = new mongoose.Schema({
  username: String,
  avatar: String,
  songs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Song'}],
}, {timestamps: true});

const playlistsSchema = new mongoose.Schema({
  name: String,
  thumbnail: String,
  songs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Song'}],
}, {timestamps: true});

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
const User = mongoose.model('User', usersSchema);
const Playlist = mongoose.model('Playlist', playlistsSchema);
const Tag = mongoose.model('Tag', tagsSchema);

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value.getTime();
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  },
});

const typeDefs = gql`
  scalar Date

  type YouTubeData {
    cover: String
    title: String
  }

  type Song {
    _id: ID
    title: String
    url: String
    cover: String
    correctWords: [String]
    user: User
    tags: [Tag]
    isAccepted: Boolean
    createdAt: Date
    updatedAt: Date
  }

  type Tag {
    _id: ID
    name: String
    cover: String
    songs: [Song]
    createdAt: Date
    updatedAt: Date
  }

  type TagConnection {
    docs: [Tag]
    totalDocs: Int
    limit: Int
    totalPages: Int
    page: Int
    pagingCounter: Int
    hasPrevPage: Boolean
    hasNextPage: Boolean
    prevPage: Int,
    nextPage: Int
  }

  

  type User {
    _id: ID
    username: String
    avatar: String
    songs: [Song]
    createdAt: Date
    updatedAt: Date
  }

  type Playlist {
    _id: ID 
    name: String 
    thumbnail: String 
    songs: [Song]  
    createdAt: Date
    updatedAt: Date
  }

  type Query {
    song(id: ID): Song
    songs(tag: ID): [Song]

    playlist(id: ID): Playlist
    playlists: [Playlist]

    user(id: ID): User
    users: [User]

    tag(id: ID): Tag
    
    tags(
      limit: Int,
      page: Int
    ): TagConnection

    getSongData(
      url: String
    ): YouTubeData
  }

  type Mutation {
    acceptSong(
      id: ID
    ): Song

    addSong(
      title: String,
      url: String,
      cover: String,
      user: ID,
      correctWords: [String],
      tags: [ID]
    ): Song

    deleteSong(
      id: ID
    ): Song

    updateSong(
      id: ID, 
      title: String, 
      cover: String, 
      url: String, 
      correctWords: [String],
      user: ID, 
      tags: [ID]
    ): Song

    addTag(
      name: String,
      cover: String
    ): Tag

    deleteTag(
      id: ID
    ): Tag

    updateTag(
      id: ID, 
      name: String, 
      cover: String
    ): Tag

    addPlaylist(
      name: String, 
      thumbnail: String,
      songs: [ID]
    ): Playlist

    deletePlaylist(
      id: ID
    ): Playlist

    updatePlaylist(
      id: ID, 
      name: String, 
      thumbnail: String,
      songs: [ID]
    ): Playlist

    addUser(username: String,
      avatar: String
    ): User

    deleteUser(
      id: ID
    ): User

    updateUser(
      id: ID,
      username: String, 
      avatar: String
    ): User
}
`;

const resolvers = {
  Date: dateScalar,
  Query: {
    async getSongData(_, {url}) {
      const data = await ytdl.getInfo(url);
      const cover = data.player_response.videoDetails.thumbnail.thumbnails.filter((t) => t.height > 720).map((t) => t.url)[0];
      const title = data.player_response.videoDetails.title;
      return {title, cover};
    },
    async songs(_, {tag}) {
      const songs = await Song
          .find()
          .populate('user')
          .populate('tags')
          .sort({updatedAt: 'desc'})
          .exec();
      return songs;
    },
    async song(_, {id}) {
      const song = await Song
          .findById(id)
          .populate('user')
          .populate('tags')
          .exec();
      return song;
    },

    async tags(_, {page, limit}) {
      let options = [];

      if (limit === 0) {
        options = {
          page: 1,
          limit: 0,
        };
      } else if (page && limit) {
        options = {
          page,
          limit,
        };
      } else {
        options = {
          pagination: false,
        };
      }
      // const tags = await Tag
      //     .find()
      //     .exec();
      const tags = await Tag
          .paginate({}, options);
      return tags;
    },
    async tag(_, {id}) {
      const tag = await Tag
          .findById(id)
          .exec();
      return tag;
    },

    async playlists() {
      const playlists = await Playlist
          .find()
          .populate('songs')
          .sort({updatedAt: 'desc'})
          .exec();
      return playlists;
    },
    async playlist(_, {id}) {
      const playlist = await Playlist
          .findById(id)
          .populate('songs')
          .exec();
      return playlist;
    },

    async users() {
      const users = await User
          .find()
          .sort({updatedAt: 'desc'})
          .exec();
      return users;
    },
    async user(_, {id}) {
      const user = await User
          .findById(id)
          .exec();
      return user;
    },
  },
  Mutation: {
    async acceptSong(_, {id}) {
      const updatedSong = await Song
          .findByIdAndUpdate(id, {
            isAccepted: true,
          }, {new: true})
          .populate('user')
          .populate('tags')
          .exec();
      return updatedSong;
    },

    async addSong(_, {title, url, cover, user, correctWords, tags}) {
      const newSong = await Song
          .create({title, url, cover, user, correctWords, tags});
      return await newSong.populate('tags').populate('user').execPopulate();
    },
    async deleteSong(_, {id}) {
      const deletedSong = await Song
          .findByIdAndDelete(id);
      return deletedSong;
    },
    async updateSong(_, {id, title, cover, url, correctWords, user, tags}) {
      const updatedSong = await Song
          .findByIdAndUpdate(id, {
            title, cover, url, correctWords, user, tags,
          }, {new: true})
          .populate('user')
          .populate('tags')
          .exec();
      return updatedSong;
    },

    async addTag(_, {name, cover}) {
      const newTag = await Tag
          .create({name, cover});
      return newTag;
    },
    async deleteTag(_, {id}) {
      const deleteTag = await Tag
          .findByIdAndDelete(id);
      return deleteTag;
    },
    async updateTag(_, {id, name, cover}) {
      const updatedTag = await Tag
          .findByIdAndUpdate(id, {
            id, name, cover,
          }, {new: true})
          .exec();
      return updatedTag;
    },

    async addPlaylist(parent, {name, thumbnail, songs}) {
      const newPlaylist = await Playlist
          .create({name, thumbnail, songs});
      return newPlaylist;
    },
    async deletePlaylist(parent, {id}) {
      const deletedPlaylist = await Playlist
          .findByIdAndDelete(id);
      return deletedPlaylist;
    },
    async updatePlaylist(parent, {id, name, thumbnail, songs}) {
      const updatedPlaylist = await Playlist
          .findByIdAndUpdate(id, {name, thumbnail, songs})
          .populate('songs')
          .exec();
      return updatedPlaylist;
    },

    async addUser(parent, {username, avatar}) {
      const newUser = await User
          .create({username, avatar});
      return newUser;
    },
    async deleteUser(parent, {id}) {
      const deletedUser = await User
          .findByIdAndDelete(id);
      return deletedUser;
    },
    async updateUser(parent, {id, username, avatar}) {
      const updatedUser = await User
          .findByIdAndUpdate(id, {username, avatar});
      return updatedUser;
    },
  },
};

const server = new ApolloServer({typeDefs, resolvers});

server.listen({port: process.env.PORT || 4000}).then(({url}) => {
  console.log(`🚀  Server ready at ${url}`);
});
