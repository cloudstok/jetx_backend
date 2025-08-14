import { Server } from "socket.io";
import { settleBet, settleCallBacks, setCurrentLobby, getCurrentLobby } from "../bets/bets-session";
import { getPlayerCount } from "../players/player-event";
import { insertLobbies } from "./lobbies-db";
import { createLogger } from "../../utilities/logger";
import { read } from "../../utilities/db-connection";
import { LobbyData, LobbyHistory, OddsData } from "../../types";
import { LobbiesMult } from "../../interfaces";
import { createRoundHashes, generateCrashMult, generateServerSeed } from "../game/game-logic";
export let roundHashes: Record<string, string> = {};
const logger = createLogger('Plane', 'jsonl');
const planeErrorLogger = createLogger('PlaneError', 'plain');
export let roundServerSeed = '';

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
let lobbiesMult: LobbiesMult[] | undefined = [];
let betCount: number = 0;

export function getLobbiesMult() { return lobbiesMult };
export function getBetCount() { return betCount };
function getRandomBetCount() {
    betCount = Math.floor(Math.random() * (3000 - 600 + 1)) + 600;
    return betCount
}

const checkPlaneHealth = (): NodeJS.Timeout => setInterval(() => {
    const { lobbyId, status } = getCurrentLobby() as LobbyData;
    if (isNaN(Number(lobbyId))) {
        planeErrorLogger.error(`Invalid Lobby id got ${lobbyId}. Exiting.. LobbyData is ${JSON.stringify(getCurrentLobby())}`);
        process.exit(1);
    }
    const timeDiff = (Date.now() - Number(lobbyId)) / 1000;
    if (status === 0 && timeDiff > 60) {
        planeErrorLogger.error(`Lobby Timed Out ${lobbyId}. Exiting.. LobbyData is ${JSON.stringify(getCurrentLobby())}`);
        process.exit(1);
    }
    if (timeDiff > 240) {
        planeErrorLogger.error(`Lobby Taking too much time ${lobbyId}. LobbyData is ${JSON.stringify(getCurrentLobby())}`);
    }
    if (timeDiff > 600) {
        planeErrorLogger.error(`Exiting Lobby as it took more than 5 minutes ${lobbyId}. LobbyData is ${JSON.stringify(getCurrentLobby())}`);
        process.exit(1);
    }
}, 1000);

export const initPlane = async (io: Server): Promise<void> => {
    logger.info("lobby started");
    initLobby(io);
    updateServerSeed();
    io.emit('rndSd', roundServerSeed);
    checkPlaneHealth();
    lobbiesMult = await getMaxMultOdds();
};

const updateServerSeed = () => roundServerSeed = generateServerSeed();

let odds: OddsData = {};

const initLobby = async (io: Server): Promise<void> => {
    const lobbyId = Date.now();
    let recurLobbyData: LobbyData = { lobbyId, status: 0, isWebhook: 0 };
    setCurrentLobby(recurLobbyData);

    io.emit('betCount', getRandomBetCount());
    io.emit('maxOdds', lobbiesMult);
    odds.lobbyId = lobbyId;
    odds.start_time = Date.now();

    const start_delay = 7;
    let inc = 1;
    const end_delay = 6;

    odds.total_players = await getPlayerCount();

    for (let x = 0; x < start_delay; x++) {
        io.emit("plane", `${lobbyId}:${inc}:0`);
        inc++;
        await sleep(1000);
    }

    io.emit("plane", `${lobbyId}:PROCESSING:0`);

    recurLobbyData.isWebhook = 1;
    setCurrentLobby(recurLobbyData);

    await settleCallBacks(io);
    await sleep(3000);

    createRoundHashes();
    const { serverSeed, hashedSeed, max_mult } = generateCrashMult();

    updateServerSeed();
    io.emit('rndSd', roundServerSeed);

    recurLobbyData.max_mult = max_mult;
    const hex = hashedSeed.slice(0, 13);

    let init_val = 1;
    recurLobbyData.status = 1;
    setCurrentLobby(recurLobbyData);

    do {
        io.emit("plane", `${lobbyId}:${init_val.toFixed(2)}:1`);
        init_val += 0.01;

        if (init_val < 2) {
            init_val += 0.01;
        } else if (init_val < 10) {
            init_val *= 1.003;
        } else if (init_val < 50) {
            init_val *= 1.004;
        } else {
            init_val *= 1.005;
        }

        recurLobbyData.ongoingMaxMult = init_val.toFixed(2);
        setCurrentLobby(recurLobbyData);
        await sleep(100);
    } while (init_val < max_mult);

    odds.max_mult = max_mult;

    recurLobbyData.status = 2;
    setCurrentLobby(recurLobbyData);

    for (let y = 0; y < end_delay; y++) {
        if (y === 3) {
            await settleBet(io, odds);
        }
        io.emit("plane", `${lobbyId}:${max_mult.toFixed(2)}:2`);
        await sleep(1000);
    }

    odds = {};

    const history: LobbyHistory = {
        time: new Date(),
        lobbyId,
        start_delay,
        end_delay,
        max_mult,
        hashedSeed,
        serverSeed,
        client_seeds: roundHashes
    };

    const clientSeeds: { [key: string]: string } = {};
    for (const seed in roundHashes) {
        clientSeeds[`${seed[0]}***${seed.slice(-1)}`] = roundHashes[seed];
    };

    if (lobbiesMult && lobbiesMult?.length >= 30) lobbiesMult?.pop();
    if (lobbiesMult) lobbiesMult = [{ lobbyId, round_max_mult: history.max_mult.toFixed(2), created_at: history.time.toISOString(), client_seeds: clientSeeds, hashedSeed, serverSeed, hex, decimal: Number(BigInt('0x' + hex)) }, ...lobbiesMult];

    logger.info(JSON.stringify(history));
    await insertLobbies(history);
    roundHashes = {};
    return initLobby(io);

};

export const getMaxMultOdds = async (): Promise<LobbiesMult[] | undefined> => {
    try {
        const odds = await read('SELECT lobby_id, max_mult, created_at, client_seeds, server_seed, hash from lobbies order by created_at desc limit 30');
        const oddsData = odds.map(e => {
            const { hash, max_mult, created_at, client_seeds, server_seed, lobby_id } = e;
            const hex = hash.slice(0, 13);
            const clientSeeds: { [key: string]: string } = {};
            for (const seed in client_seeds) {
                clientSeeds[`${seed[0]}***${seed.slice(-1)}`] = client_seeds[seed];
            }
            return { lobbyId: lobby_id, round_max_mult: max_mult, created_at, client_seeds: clientSeeds, serverSeed: server_seed, hashedSeed: hash, hex, decimal: Number(BigInt('0x' + hex)) }
        });
        return oddsData;
    } catch (err) {
        console.error(err);
    }
};