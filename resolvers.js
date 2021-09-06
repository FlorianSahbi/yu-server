/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable newline-per-chained-call */
/* eslint-disable camelcase */
/* eslint-disable no-shadow */
const DiscordOauth2 = require('discord-oauth2');

const oauth = new DiscordOauth2();
const ytdl = require('ytdl-core');
const { GraphQLScalarType, Kind } = require('graphql');
const groupBy = require('./utils/groupBy');
const Track = require('./schemas/tracksSchema');
const Guild = require('./schemas/guildsSchema');
const Game = require('./schemas/gamesSchema');
const Tag = require('./schemas/tagsSchema');
const User = require('./schemas/usersSchema');
const getRandomIntInclusive = require('./utils/getRandomIntInclusive');

function shuffle(array) {
  let currentIndex = array.length; let temporaryValue; let
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

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

const resolvers = {
  Date: dateScalar,
  Query: {
    async auth(_, { code }) {
      if (code) {
        const token = await oauth.tokenRequest({
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          code,
          scope: 'identify',
          grantType: 'authorization_code',

          redirectUri: process.env.AUTH_CALLBACK,
        });

        const discordUser = await oauth.getUser(token.access_token);

        const user = await User.findOneAndUpdate({ 'discordData.id': discordUser.id }, { $setOnInsert: { ...discordUser, discordData: { ...discordUser } } }, { new: true, upsert: true });

        return { token, user };
      } return {};
    },
    async signIn(_, { token }) {
      const { id } = await oauth.getUser(token.access_token);
      const user = await User.findOne({ 'discordData.id': id }).populate('tracks').exec();
      return user;
    },
    async guilds() {
      const guilds = await Guild.find({}).populate('users').populate('games').sort({ updatedAt: 'desc' })
        .exec();
      return guilds;
    },
    async guild(_, { id }) {
      const guild = await Guild.findById(id).populate('users').populate('games').exec();
      return guild;
    },
    async guildByGuildId(_, { id }) {
      const guild = await Guild.findOne({ id }).populate('users').populate('games').exec();
      return guild;
    },
    async guildByDiscordId(_, { id }) {
      const guild = await Guild.findOne({ id }).populate('users').populate('games').exec();
      return guild;
    },
    async tracks(_, { tag, title, limit }) {
      function filter() {
        if (tag) {
          return { tags: tag };
        }
        if (title) {
          return { title: { $regex: title, $options: 'i' } };
        }
        return {};
      }

      function size() {
        if (limit) {
          return limit;
        }
        return 0;
      }

      const tracks = await Track.find(filter()).populate('creator').populate('tags').sort({ updatedAt: 'desc' }).limit(size()).exec();
      return tracks;
    },
    async lastTracks() {
      const tracks = await Track.find({}).sort({ updatedAt: 'desc' }).limit(12).populate('creator').populate('tags').sort({ updatedAt: 'desc' }).exec();
      return tracks;
    },
    async track(_, { id }) {
      const track = await Track.findById(id).populate('creator').populate('tags').exec();
      return track;
    },
    async tags() {
      const tags = await Tag.find().populate('creator').populate('tracks').populate('tracks.tags').exec();
      return tags;
    },
    async tagsByUser(_, { discordId }) {
      let tags = [];
      const user = await User.findOne({ 'discordData.id': discordId }).populate('games').populate('tracks').populate('tags').populate('guilds').exec();

      if (user.roles.includes('ADMINISTRATOR')) {
        tags = await Tag.find({}).sort({ name: 'ASC' }).populate('creator').populate('tracks').populate('tracks.tags').exec();
      } else if (user.roles.includes('PREMIUM')) {
        const genericTags = await Tag.find({ isCustom: false }).sort({ name: 'ASC' }).populate('creator').populate('tracks').populate('tracks.tags').exec();
        const customTags = await Tag.find({ isCustom: true, creator: user._id }).sort({ name: 'ASC' }).populate('creator').populate('tracks').populate('tracks.tags').exec();
        tags = [...genericTags, ...customTags];
      } else {
        tags = await Tag.find({ isCustom: false }).sort({ name: 'ASC' }).populate('creator').populate('tracks').populate('tracks.tags').exec();
      }
      return tags;
    },
    async tag(_, { id }) {
      const tag = await Tag.findById(id).populate('creator').populate('tracks').populate('tracks.tags').exec();
      return tag;
    },
    async users() {
      const users = await User
        .find()
        .sort({ updatedAt: 'desc' })
        .populate('games')
        .populate('tracks')
        .populate('tags')
        .populate('guilds')
        .exec();
      return users;
    },
    async lastUsers() {
      const users = await User
        .find({})
        .sort({ updatedAt: 'desc' })
        .limit(12)
        .populate('games')
        .populate('tracks')
        .populate('tags')
        .populate('guilds')
        .sort({ createdAt: 'desc' })
        .exec();
      return users;
    },
    async user(_, { id }) {
      const user = await User.findById(id).populate('games').populate('tracks').populate('tags').populate('guilds').exec();
      return user;
    },
    async userByDiscordId(_, { id }) {
      const user = await User.findOne({ 'discordData.id': id }).populate('games').populate('tracks').populate('tags').populate('guilds').exec();
      return user;
    },
    async games() {
      const games = await Game
        .find()
        .populate('users')
        .populate('tags')
        .populate('history.track')
        .populate('history.ranks.user')
        .sort('-createdAt')
        .exec();
      return games;
    },
    async game(_, { id }) {
      const game = await Game
        .findById(id)
        .populate('users')
        .populate('tags')
        .populate('history.track')
        .populate('history.ranks.user')
        .exec();
      return game;
    },
    async lastGames() {
      const games = await Game
        .find({})
        .sort({ updatedAt: 'desc' })
        .limit(12).populate('creator')
        .populate('users')
        .populate('tags')
        .populate('history.track')
        .populate('history.ranks.user')
        .sort({ updatedAt: 'desc' })
        .exec();
      return games;
    },
    async leaderboard(_, { id }) {
      const game = await Game
        .findById(id)
        .populate('users')
        .populate('tags')
        .populate('history.track')
        .populate('history.ranks')
        .populate('history.ranks.user');

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
    async playlistTracks(_, { tag }) {
      try {
        const tracks = await Track.find({ tags: tag }).exec();
        return shuffle(tracks);
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
    async youtubeTrack(_, { youtubeUrl }) {
      console.log('Proc Youtube URL');
      console.log(youtubeUrl);
      const existingTrack = await Track.findOne({ videoUrl: youtubeUrl });

      if (existingTrack) {
        return null;
      }
      try {
        const value = await ytdl.getInfo(youtubeUrl);
        const {
          title, keywords, video_url, thumbnails, lengthSeconds, category, ownerChannelName, videoId,
        } = value.videoDetails;

        const data = {
          title, keywords, videoUrl: video_url, thumbnails, lengthSeconds, category, ownerChannelName, videoId,
        };
        return data;
      } catch (error) {
        return error;
      }
    },
  },
  Mutation: {
    async createGuild(_, { guildInput }) {
      try {
        const newGuild = await Guild.findOneAndUpdate({ id: guildInput.id }, { $setOnInsert: { ...guildInput } }, { new: true, upsert: true });
        return newGuild.populate('users').populate('games').execPopulate();
      } catch (error) {
        return error;
      }
    },
    async updateGuildIsPlaying(_, { id, isPlaying }) {
      try {
        const updatedGuild = await Guild.findOneAndUpdate({ id }, { isPlaying }, { new: true }).exec();
        return updatedGuild;
      } catch (error) {
        return error;
      }
    },
    async updateGuildAddUsers(_, { id, users }) {
      try {
        const updatedGuild = await Guild.findByIdAndUpdate(id, { $addToSet: { users } }, { new: true });
        return updatedGuild.populate('users').populate('games').execPopulate();
      } catch (error) {
        return error;
      }
    },
    async updateGuildAddGame(_, { id, gameId }) {
      try {
        const updatedGuild = await Guild.findByIdAndUpdate(id, { $addToSet: { games: gameId } });
        return updatedGuild.populate('users').populate('games').execPopulate();
      } catch (error) {
        return error;
      }
    },
    async createTrack(_, { trackInput }) {
      try {
        const newTrack = await Track.create({ ...trackInput });
        // todo : add track in user
        return newTrack.populate('creator').populate('tags').execPopulate();
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
    async updateTrack(_, { id, trackInput }) {
      try {
        const updatedTrack = await Track.findByIdAndUpdate(id, trackInput, { new: true });
        return updatedTrack.populate('tag').execPopulate();
      } catch (error) {
        return error;
      }
    },
    async deleteTrack(_, { id }) {
      try {
        const deletedTrack = await Track.findByIdAndDelete(id);
        // todo : delete track in user
        return deletedTrack;
      } catch (error) {
        return error;
      }
    },
    async acceptTrack(_, { id }) {
      try {
        const updatedTrack = await Track.findByIdAndUpdate(id, { isAccepted: true }, { new: true }).exec();
        return updatedTrack;
      } catch (error) {
        return error;
      }
    },
    async updateTrackIsUnlisted(_, { id, isUnlisted }) {
      try {
        const updatedTrack = await Track.findByIdAndUpdate(id, { isUnlisted }, { new: true }).exec();
        return updatedTrack;
      } catch (error) {
        return error;
      }
    },
    async createTag(_, { tagInput }) {
      try {
        const newTag = await Tag.create({ ...tagInput });
        return newTag.populate('creator').populate('tracks').execPopulate();
      } catch (error) {
        return error;
      }
    },
    async updateTag(_, { id, tagInput }) {
      try {
        const updatedTag = await Tag.findByIdAndUpdate(id, tagInput, { new: true });
        return updatedTag.populate('creator').populate('tracks').execPopulate();
      } catch (error) {
        return error;
      }
    },
    async deleteTag(_, { id }) {
      try {
        const tracks = await Track.find({ tags: { $in: id } });
        if (tracks.length > 0 && tracks[0].creator) {
          const TrackToDeleteIds = tracks.reduce((acc, value) => [...acc, value._id], []);
          await User.findById(tracks[0].creator);
          await User.findByIdAndUpdate(tracks[0].creator, { $pull: { tags: id, tracks: { $in: TrackToDeleteIds } } }, { new: true });
          await Track.deleteMany({ _id: TrackToDeleteIds });
        }
        const deleteTag = await Tag.findByIdAndDelete(id);
        return deleteTag;
      } catch (error) {
        return error;
      }
    },
    async createUser(_, { userInput }) {
      try {
        const newUser = await User.create({ ...userInput });
        return newUser.populate('tracks').execPopulate();
      } catch (error) {
        return error;
      }
    },
    async deleteUser(_, { id }) {
      try {
        const deletedUser = await User.findByIdAndDelete(id);
        return deletedUser;
      } catch (error) {
        return error;
      }
    },
    async updateUserAddGame(_, { id, gameId }) {
      try {
        const updatedUser = await User.findByIdAndUpdate(id, { $addToSet: { games: gameId } });
        return updatedUser.populate('games').populate('tracks').populate('tags').populate('guilds').execPopulate();
      } catch (error) {
        return error;
      }
    },
    async updateUserAddTrack(_, { id, trackId }) {
      try {
        const updatedUser = await User.findByIdAndUpdate(id, { $addToSet: { tracks: trackId } });
        return updatedUser.populate('games').populate('tracks').populate('tags').populate('guilds').execPopulate();
      } catch (error) {
        return (error);
      }
    },
    async updateUserAddTags(_, { id, tagId }) {
      try {
        const updatedUser = await User.findByIdAndUpdate(id, { $addToSet: { tags: tagId } });
        return updatedUser;
      } catch (error) {
        return (error);
      }
    },
    async updateUserAddGuild(_, { id, guildId }) {
      try {
        const updatedUser = await User.findByIdAndUpdate(id, { $addToSet: { guilds: guildId } });
        return updatedUser;
      } catch (error) {
        return (error);
      }
    },
    async createGame() {
      try {
        const newGame = await Game.create({});
        return newGame;
      } catch (error) {
        return error;
      }
    },
    async deleteGame(_, { id }) {
      try {
        const deletedGame = await Game.findByIdAndDelete(id);
        return deletedGame;
      } catch (error) {
        return error;
      }
    },
    async updateGameAddPlayers(_, { id, users }) {
      try {
        const updatedGame = await Game.findByIdAndUpdate(id, { $addToSet: { users } }, { new: true }).exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    async updateGameAddMod(_, { id, mod }) {
      try {
        const updatedGame = await Game.findByIdAndUpdate(id, { mod }, { new: true }).exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    async updateGameAddTags(_, { id, tags }) {
      try {
        const updatedGame = await Game.findByIdAndUpdate(id, { $addToSet: { tags } }, { new: true }).exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    async updateGameAddRound(_, { id, roundInput }) {
      try {
        const updatedGame = await Game.findByIdAndUpdate(id, { $addToSet: { history: { ...roundInput } } }, { new: true }).exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    async updateGameAddRank(_, { id, round, rankInput }) {
      try {
        await Game.updateOne({ _id: id, 'history.position': round }, { $addToSet: { 'history.$.ranks': { ...rankInput } } }, { new: true }).exec();
        const updatedGame = await Game.findById(id).exec();
        return updatedGame;
      } catch (error) {
        return error;
      }
    },
    async updateAndAdd(_, { id, userDiscordData }) {
      try {
        // Get discord id of user in game
        const discordIds = userDiscordData.map((userInGame) => userInGame.id);

        // Get all the existing user
        const existingUsers = await User.find({ 'discordData.id': { $in: discordIds } });

        const existingUsersDiscordIds = existingUsers.map((userDb) => userDb.discordData.id);

        // Diff existing users and missing ones
        const missingOnes = userDiscordData.filter(({ id }) => !existingUsersDiscordIds.includes(id));

        // Insert misssings
        const updateValues = missingOnes.map((missingOne) => ({ ...missingOne, discordData: { ...missingOne } }));
        await User.insertMany(updateValues);

        // Get all users
        const users = await User.find({ 'discordData.id': { $in: discordIds } });

        // Bind user in game
        const updatedGame = await Game.findByIdAndUpdate(id, { $addToSet: { users } }, { new: true }).populate('users').populate('tags').populate('history.track').exec();

        return updatedGame;
      } catch (error) {
        return false;
      }
    },
    async createCustomPlaylist(_, { tagInput, trackInputs }) {
      let tracksIds = [];
      const existingTracks = trackInputs.filter((track) => track.isNew === false);
      try {
        const newTag = await Tag.create({ ...tagInput });
        await User.findByIdAndUpdate(tagInput.creator, { $addToSet: { tags: newTag._id } });
        const newTracks = await Track.insertMany(trackInputs.filter((track) => track.isNew === true).map((track) => ({ ...track, tags: [newTag._id] })));
        tracksIds = [...existingTracks.reduce((acc, value) => [...acc, value._id], []), ...newTracks.reduce((acc, value) => [...acc, value._id], [])];
        await User.findByIdAndUpdate(tagInput.creator, { $addToSet: { tracks: tracksIds } });
        const updatedTag = await Tag.findByIdAndUpdate(newTag._id, { $addToSet: { tracks: tracksIds } }, { new: true }).exec();
        return updatedTag.populate('tracks').populate('creator').execPopulate();
      } catch (error) {
        return error;
      }
    },
    async addTracksToTags(_, { id, trackInputs }) {
      try {
        await await User.findById(trackInputs[0].creator);
        const tracks = await Track.insertMany(trackInputs.map((track) => ({ ...track, tags: [id] })));
        const tracksIds = tracks.reduce((acc, value) => [...acc, value._id], []);
        await User.findByIdAndUpdate(trackInputs[0].creator, { $addToSet: { tracks: tracksIds } });
        const updatedTag = await Tag.findByIdAndUpdate(id, { $addToSet: { tracks: tracksIds } }, { new: true }).exec();
        return updatedTag.populate('tracks').populate('creator').execPopulate();
      } catch (error) {
        return error;
      }
    },
  },
};

module.exports = resolvers;
