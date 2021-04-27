/* eslint-disable newline-per-chained-call */
/* eslint-disable camelcase */
/* eslint-disable no-shadow */
const ytdl = require("ytdl-core");
const { GraphQLScalarType, Kind } = require("graphql");
const groupBy = require("./utils/groupBy");
const Track = require("./schemas/tracksSchema");
const Game = require("./schemas/gamesSchema");
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
    // TRACK : OK
    async tracks(_, { tag }) {
      const tracks = await Track.find(tag ? { tags: tag } : {}).populate("creator").populate("tags").sort({ updatedAt: "desc" })
        .exec();
      return tracks;
    },
    async track(_, { id }) {
      const track = await Track.findById(id).populate("creator").populate("tags").exec();
      return track;
    },
    // TAG : OK
    async tags() {
      const tags = await Tag.find().populate("creator").populate("tracks").populate("tracks.tags").exec();
      return tags;
    },
    async tag(_, { id }) {
      const tag = await Tag.findById(id).populate("creator").populate("tracks").populate("tracks.tags").exec();
      return tag;
    },
    // USER : OK
    async users() {
      const users = await User.find().sort({ updatedAt: "desc" }).populate("tracks").exec();
      return users;
    },
    async user(_, { id }) {
      const user = await User.findById(id).populate("tracks").exec();
      return user;
    },
    // GAME
    async games() {
      const games = await Game
        .find()
        .populate("users")
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
        .populate("users")
        .populate("tags")
        .populate("history.track")
        .populate("history.rank.player")
        .exec();
      return game;
    },
    // UTILS
    async leaderboard(_, { id }) {
      const game = await Game
        .findById(id)
        .populate("users")
        .populate("tags")
        .populate("history.track")
        .populate("history.ranks")
        .populate("history.ranks.user");

      const allRanks = game.history.map((round) => round.ranks).flat();
      if (allRanks.length <= 0) {
        return [];
      }

      const leaderboard = groupBy(allRanks, (rank) => rank.user.username);

      const lb = game.users.map((user) => {
        if (leaderboard.get(user.username) !== undefined) {
          const points = leaderboard.get(user.username).reduce((acc, val) => val.points + acc, 0);
          return { player: user, points };
        }
        return { player: user, points: 0 };
      });

      return lb;
    },
    async randomTrack(_, { tag }) {
      try {
        const counter = await Track.find({ tags: tag }).count().exec();
        const rSong = await Track.find({ tags: tag }).exec();
        return rSong[getRandomIntInclusive(0, counter - 1)];
      } catch (error) {
        return error;
      }
    },
    async youtubeData(_, { youtubeUrls }) {
      try {
        let promises = [];
        youtubeUrls.forEach((u) => {
          promises = [...promises, ytdl.getInfo(u)];
        });
        const values = await Promise.all(promises);
        const data = await values.map(({
          videoDetails: {
            title, keywords, video_url, thumbnails, lengthSeconds, category, ownerChannelName, videoId,
          },
        }) => ({
          title, keywords, videoUrl: video_url, thumbnails, lengthSeconds, category, ownerChannelName, videoId,
        }));
        return data;
      } catch (error) {
        return error;
      }
    },
  },
  Mutation: {
    // TRACK : OK
    async createTrack(_, { trackInput }) {
      try {
        const newTrack = await Track.create({ ...trackInput });
        // todo : add track in user
        return newTrack.populate("creator").populate("tags").execPopulate();
      } catch (error) {
        return error;
      }
    },
    async createTracks(_, { trackInputs }) {
      try {
        const newTracks = await Track.insertMany(trackInputs);
        // todo : add track in user
        return newTracks;
      } catch (error) {
        return error;
      }
    },
    // OK
    async deleteTrack(_, { id }) {
      try {
        const deletedTrack = await Track.findByIdAndDelete(id);
        // todo : delete track in user
        return deletedTrack;
      } catch (error) {
        return error;
      }
    },
    // TRACK UTILS : OK
    async acceptTrack(_, { id }) {
      try {
        const updatedTrack = await Track.findByIdAndUpdate(id, { isAccepted: true }, { new: true }).exec();
        return updatedTrack;
      } catch (error) {
        return error;
      }
    },
    // TAG : OK
    async createTag(_, { tagInput }) {
      try {
        const newTag = await Tag.create({ ...tagInput });
        // todo : add tag in user
        return newTag.populate("creator").populate("tracks").execPopulate();
      } catch (error) {
        return error;
      }
    },
    // OK
    async deleteTag(_, { id }) {
      try {
        const deleteTag = await Tag.findByIdAndDelete(id);
        // todo : delete track in user
        return deleteTag;
      } catch (error) {
        return error;
      }
    },
    // USER : OK
    async createUser(_, { userInput }) {
      try {
        const newUser = await User.create({ ...userInput });
        return newUser.populate("tracks").execPopulate();
      } catch (error) {
        return error;
      }
    },
    // OK
    async deleteUser(_, { id }) {
      try {
        const deletedUser = await User.findByIdAndDelete(id);
        return deletedUser;
      } catch (error) {
        return error;
      }
    },
    // GAME : OK
    async createGame() {
      try {
        const newGame = await Game.create({});
        return newGame;
      } catch (error) {
        return error;
      }
    },
    // OK
    async deleteGame(_, { id }) {
      try {
        const deletedGame = await Game.findByIdAndDelete(id);
        return deletedGame;
      } catch (error) {
        return error;
      }
    },
    // OK
    async updateGameAddPlayers(_, { id, users }) {
      try {
        const updatedGame = await Game.findByIdAndUpdate(id, { $addToSet: { users } }, { new: true }).exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    // OK
    async updateGameAddTags(_, { id, tags }) {
      try {
        const updatedGame = await Game.findByIdAndUpdate(id, { $addToSet: { tags } }, { new: true }).exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    // OK
    async updateGameAddRound(_, { id, roundInput }) {
      try {
        const updatedGame = await Game.findByIdAndUpdate(id, { $addToSet: { history: { ...roundInput } } }, { new: true }).exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    // OK
    async updateGameAddRank(_, { id, round, rankInput }) {
      try {
        await Game.updateOne({ _id: id, "history.position": round }, { $addToSet: { "history.$.ranks": { ...rankInput } } }, { new: true }).exec();
        const updatedGame = await Game.findById(id).exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    // UTILS
    async updateAndAdd(_, { id, userDiscordData }) {
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
            $addToSet: { users: players },
          }, { new: true })
          .populate("users")
          .populate("tags")
          .populate("history.song")
          .exec();
        return updatedGame;
      } catch (error) {
        return false;
      }
    },
    async createCustomPlaylist(_, { tagInput, trackInputs }) {
      try {
        const newTag = await Tag.create({ ...tagInput });
        const tracks = await Track.insertMany(trackInputs.map((track) => ({ ...track, tags: [newTag._id] })));
        const tracksIds = tracks.reduce((acc, value) => [...acc, value._id], []);
        const updatedTag = await Tag.findByIdAndUpdate(newTag._id, { $addToSet: { tracks: tracksIds } }, { new: true }).exec();
        return updatedTag.populate("tracks").populate("creator").execPopulate();
      } catch (error) {
        return error;
      }
    },
  },
};

module.exports = resolvers;
