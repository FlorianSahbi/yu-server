/* eslint-disable no-shadow */
/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
const ytdl = require("ytdl-core");
const { GraphQLScalarType, Kind } = require("graphql");
const groupBy = require("./utils/groupBy");
const Song = require("./schemas/songsSchema");
const Game = require("./schemas/gamesSchema");
const Playlist = require("./schemas/playlistsSchema");
const Tag = require("./schemas/tagsSchema");
const User = require("./schemas/usersSchema");
const getRandomIntInclusive = require("./utils/getRandomIntInclusive");

const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
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

const resolvers = {
  Date: dateScalar,
  Query: {
    async getLeaderboard(_, { gameId }) {
      const game = await Game
        .findById(gameId)
        .populate("players")
        .populate("tags")
        .populate("history.song")
        .populate("history.rank.player");

      const allRanks = game.history.map((round) => round.rank).flat();

      if (allRanks.length <= 0) {
        return [];
      }

      const leaderboard = groupBy(allRanks, (rank) => rank.player.username);

      const lb = game.players.map((user) => {
        if (leaderboard.get(user.username) !== undefined) {
          const points = leaderboard.get(user.username).reduce((acc, val) => val.points + acc, 0);
          return { player: user, points };
        }
        return { player: user, points: 0 };
      });

      return lb;
    },
    async getSongData(_, { url }) {
      const data = await ytdl.getInfo(url);
      const cover = data.player_response.videoDetails.thumbnail.thumbnails.filter((t) => t.height > 720).map((t) => t.url)[0];
      const { title } = data.player_response.videoDetails;
      return { title, cover };
    },
    async songs(_, { tag }) {
      const songs = await Song
        .find(tag ? { tags: tag } : {})
        .populate("user")
        .populate("tags")
        .sort({ updatedAt: "desc" })
        .exec();
      return songs;
    },
    async randomSong(_, { tag }) {
      try {
        const counter = await Song.find({ tags: tag }).count().exec();
        const rSong = await Song.find({ tags: tag }).exec();
        return rSong[getRandomIntInclusive(0, counter - 1)];
      } catch (error) {
        return error;
      }
    },
    async song(_, { id }) {
      const song = await Song
        .findById(id)
        .populate("user")
        .populate("tags")
        .exec();
      return song;
    },
    async games() {
      const games = await Game
        .find()
        .populate("players")
        .populate("tags")
        .populate("history.song")
        .populate("history.rank.player")
        .sort("-createdAt")
        .exec();
      return games;
    },
    async game(_, { id }) {
      const game = await Game
        .findById(id)
        .populate("players")
        .populate("tags")
        .populate("history.song")
        .populate("history.rank.player")
        .exec();
      return game;
    },
    async tags(_, { page, limit }) {
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

      const tags = await Tag
        .paginate({}, options);
      return tags;
    },
    async tag(_, { id }) {
      const tag = await Tag
        .findById(id)
        .exec();
      return tag;
    },
    async playlists() {
      const playlists = await Playlist
        .find()
        .populate("songs")
        .sort({ updatedAt: "desc" })
        .exec();
      return playlists;
    },
    async playlist(_, { id }) {
      const playlist = await Playlist
        .findById(id)
        .populate("songs")
        .exec();
      return playlist;
    },
    async users() {
      const users = await User
        .find()
        .sort({ updatedAt: "desc" })
        .exec();
      return users;
    },
    async user(_, { id }) {
      const user = await User
        .findById(id)
        .exec();
      return user;
    },
  },
  Mutation: {
    async acceptSong(_, { id }) {
      const updatedSong = await Song
        .findByIdAndUpdate(id, {
          isAccepted: true,
        }, { new: true })
        .populate("user")
        .populate("tags")
        .exec();
      return updatedSong;
    },
    async addSong(_, {
      title, url, cover, user, correctWords, tags,
    }) {
      const newSong = await Song
        .create({
          title, url, cover, user, correctWords, tags,
        });
      return newSong.populate("tags").populate("user").execPopulate();
    },
    async deleteSong(_, { id }) {
      const deletedSong = await Song
        .findByIdAndDelete(id);
      return deletedSong;
    },
    async updateSong(_, {
      id, title, cover, url, correctWords, user, tags,
    }) {
      const updatedSong = await Song
        .findByIdAndUpdate(id, {
          title, cover, url, correctWords, user, tags,
        }, { new: true })
        .populate("user")
        .populate("tags")
        .exec();
      return updatedSong;
    },
    async addGame() {
      const newGame = await Game.create({});
      return newGame;
    },
    async updateAndAdd(_, { userDiscordData, id }) {
      try {
        const ids = userDiscordData.map((data) => data.id);
        const u = await User.find({ discordId: { $in: ids } });
        const dbUsersDiscordIds = u.map((user) => user.discordId);
        const missingOnes = ids.filter((id) => !dbUsersDiscordIds.includes(id));
        const newUsers = userDiscordData.filter((u) => missingOnes.includes(u.id));
        await User.insertMany(newUsers.map(({ id, avatar, username }) => ({ discordId: id, avatar, username })));
        await User.updateMany(
          { discordId: { $in: userDiscordData.map((u) => u.id) } },
          { $inc: { gamesCpt: 999 } },
        );
        const usersInGame = await User.find({ discordId: { $in: ids } });
        const players = usersInGame.map((u) => u._id);
        const updatedGame = await Game
          .findByIdAndUpdate(id, {
            $addToSet: { players },
          }, { new: true })
          .populate("players")
          .populate("tags")
          .populate("history.song")
          .exec();
        return updatedGame;
      } catch (error) {
        return false;
      }
    },
    async updateGameAddPlayers(_, { id, players }) {
      try {
        const updatedGame = await Game
          .findByIdAndUpdate(id, {
            $addToSet: { players },
          }, { new: true })
          .populate("players")
          .populate("tags")
          .populate("history.song")
          .exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    async updateGameAddTags(_, { id, tags }) {
      try {
        const updatedGame = await Game
          .findByIdAndUpdate(id, {
            $addToSet: { tags },
          }, { new: true })
          .populate("players")
          .populate("tags")
          .populate("history.song")
          .exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    async updateGameAddRound(_, { id, position, song }) {
      try {
        const round = { song, position, rank: [] };
        const updatedGame = await Game
          .findByIdAndUpdate(id, {
            $addToSet: { history: round },
          }, { new: true })
          .populate("players")
          .populate("tags")
          .populate("history.song")
          .exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    async updateGameAddRank(_, {
      id, round, position, player, points,
    }) {
      try {
        const res = await Game.findById(id).exec();
        const rank = {
          position, round, player, points,
        };
        res.history[round - 1].rank.addToSet(rank);
        const result = await res.save();
        return result;
      } catch (error) {
        return error;
      }
    },
    async deleteGame(_, { id }) {
      const deletedGame = await Game
        .findByIdAndDelete(id);
      return deletedGame;
    },
    async addTag(_, { name, cover }) {
      const newTag = await Tag
        .create({ name, cover });
      return newTag;
    },
    async deleteTag(_, { id }) {
      const deleteTag = await Tag
        .findByIdAndDelete(id);
      return deleteTag;
    },
    async updateTag(_, { id, name, cover }) {
      const updatedTag = await Tag
        .findByIdAndUpdate(id, {
          id, name, cover,
        }, { new: true })
        .exec();
      return updatedTag;
    },
    async addPlaylist(_, { name, thumbnail, songs }) {
      const newPlaylist = await Playlist
        .create({ name, thumbnail, songs });
      return newPlaylist;
    },
    async deletePlaylist(_, { id }) {
      const deletedPlaylist = await Playlist
        .findByIdAndDelete(id);
      return deletedPlaylist;
    },
    async updatePlaylist(_, {
      id, name, thumbnail, songs,
    }) {
      const updatedPlaylist = await Playlist
        .findByIdAndUpdate(id, { name, thumbnail, songs })
        .populate("songs")
        .exec();
      return updatedPlaylist;
    },
    async addUser(_, { username, avatar }) {
      const newUser = await User
        .create({ username, avatar });
      return newUser;
    },
    async deleteUser(_, { id }) {
      const deletedUser = await User
        .findByIdAndDelete(id);
      return deletedUser;
    },
    async updateUser(_, { id, username, avatar }) {
      const updatedUser = await User
        .findByIdAndUpdate(id, { username, avatar });
      return updatedUser;
    },
  },
};

module.exports = resolvers;
