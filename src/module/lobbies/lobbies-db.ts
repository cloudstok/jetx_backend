import { LobbyInsertData } from '../../interfaces';
import { write } from '../../utilities/db-connection';

const SQL_INSERT_LOBBIES = 'INSERT INTO lobbies (lobby_id, start_delay, end_delay, max_mult, client_seeds, server_seed, hash) values(?,?,?,?,?,?,?)';

export const insertLobbies = async (data: LobbyInsertData): Promise<void> => {
    try {
        const { lobbyId, start_delay, end_delay, max_mult, client_seeds, serverSeed, hashedSeed } = data;

        await write(SQL_INSERT_LOBBIES, [
            lobbyId,
            start_delay,
            end_delay,
            max_mult,
            JSON.stringify(client_seeds),
            serverSeed,
            hashedSeed
        ]);
    } catch (err) {
        console.error(err);
    }
};