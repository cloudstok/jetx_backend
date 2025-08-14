import { Server } from 'socket.io';
import { initPlane } from '../module/lobbies/lobby-event';
import { generatePlayerCount, initPlayerBase } from '../module/players/player-event';

export const eventRouter = async (io: Server): Promise<void> => {
  initPlane(io);
  generatePlayerCount();
  initPlayerBase(io);
};