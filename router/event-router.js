const { initPlane } = require("../module/plane/plane-event")
const { initPlayerBase } = require("../module/players/player-message")

const eventRouter = async(io)=> {
    initPlane(io)
    initPlayerBase(io)
}

module.exports= { eventRouter}