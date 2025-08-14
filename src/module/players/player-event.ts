import axios from 'axios';
import { FinalUserData, RawUserData } from '../../interfaces';
import { Server, Socket } from 'socket.io';
import { getCache, setCache } from '../../utilities/redis-connection';

let playerCount = 0;

function getImageValue(id: string): number {
  let sum = 0;
  for (const char of id) {
    sum += char.charCodeAt(0);
  }
  return (sum % 72) + 1;
}

export const getUserDataFromSource = async (
  token: string,
  game_id: string
): Promise<FinalUserData | false | undefined> => {
  try {
    const response = await axios.get(`${process.env.service_base_url}/service/user/detail`, {
      headers: {
        token: token,
      },
    });

    const userData: RawUserData | undefined = response?.data?.user;

    if (userData) {
      const userId = encodeURIComponent(userData.user_id);
      const { operatorId } = userData;
      const id = `${operatorId}:${userId}`;
      const image = getImageValue(id);
      playerCount++;
      const finalData: FinalUserData = {
        ...userData,
        userId,
        id,
        game_id,
        token,
        image,
      };

      return finalData;
    }

    return;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

export const getPlayerCount = async (): Promise<number> => {
  playerCount = Math.floor(Math.random() * (3000 - 600 + 1)) + 600;
  return playerCount;
};

export const updateAvatar = async (socket: Socket, image: number) => {
  try {
    const cachedPlayerDetails = await getCache(`PL:${socket.id}`);
    if (!cachedPlayerDetails) {
      socket.emit('err', 'Invalid Player Details');
      return;
    }
    const parsedPlayerDetails: FinalUserData = JSON.parse(cachedPlayerDetails);
    if (image < 1 || image > 72) {
      socket.emit('error', 'Invalid avatar range');
      return
    }
    parsedPlayerDetails.image = image;
    await setCache(`PL:${socket.id}`, JSON.stringify(parsedPlayerDetails));
    socket.emit('info', {
      id: parsedPlayerDetails.userId,
      operator_id: parsedPlayerDetails.operatorId,
      balance: parsedPlayerDetails.balance,
      image: parsedPlayerDetails.image
    });
    return;
  } catch (err) {
    socket.emit('err', 'Error in updating avatar');
    return;
  }
};

export const reducePlayerCount = () => playerCount--;

export const initPlayerBase = async (io: Server): Promise<void> => {
  try {
    io.emit("playerCount", `${playerCount}`);
    setTimeout(() => initPlayerBase(io), 1000);
  } catch (err) {
    console.error(err);
  }
};