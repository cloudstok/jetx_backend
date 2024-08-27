const { initBet } = require("../module/bets/bets-message");
const { getMaxMultOdds } = require("../module/plane/plane-event");
const { initPlayer, avatarUpdate } = require("../module/players/player-message");
const createLogger = require('../utilities/logger');
const logger = createLogger('Event');


const messageRouter = async (io, socket) => {
    socket.on('message', (data) => {
        logger.info(data);
        const event = data.split(':')
        switch (event[0]) {
            case 'PL': return initPlayer(io, socket, event.slice(1, event.length));
            case 'BT': return initBet(io, socket, event.slice(1, event.length));
            case 'PLU': return avatarUpdate(io, socket, event.slice(1, event.length));
            case 'MXO' : return getMaxMultOdds(io);
        }
    })
}


module.exports = { messageRouter }