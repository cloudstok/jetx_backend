import { Server, Socket } from 'socket.io';
import { getUserDataFromSource } from './module/players/player-event';
import { eventRouter } from './router/event-router';
import { messageRouter } from './router/message-router';
import { setCache } from './utilities/redis-connection';
import { getBetCount, getLobbiesMult } from './module/lobbies/lobby-event';
import { currentRoundBets } from './module/bets/bets-session';
export const inPlayUser: Set<string> = new Set();

export const initSocket = (io: Server): void => {
  eventRouter(io);

  io.on('connection', async (socket: Socket) => {

    const { token, game_id } = socket.handshake.query as { token?: string; game_id?: string };

    if (!token || !game_id) {
      socket.disconnect(true);
      console.log('Mandatory params missing', token);
      return;
    };


    const userData = await getUserDataFromSource(token, game_id);

    if (!userData) {
      console.log('Invalid token', token);
      socket.disconnect(true);
      return;
    };

    const isUserConnected = inPlayUser.has(userData.id);
    if (isUserConnected) {
      socket.emit('betError', 'User already connected, disconnecting...');
      socket.disconnect(true);
      return;
    }


    socket.emit('info',
      {
        id: userData.userId,
        operator_id: userData.operatorId,
        balance: userData.balance,
        image: userData.image
      },
    );

    await setCache(`PL:${socket.id}`, JSON.stringify({ ...userData, socketId: socket.id }), 3600);
    inPlayUser.add(userData.id);

    messageRouter(io, socket);
    socket.emit('betCount', getBetCount());
    socket.emit('maxOdds', getLobbiesMult());
    currentRoundBets(socket);

    socket.on('error', (error: Error) => {
      console.error(`Socket error: ${socket.id}. Error: ${error.message}`);
    });
  });
};