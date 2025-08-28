import crypto from 'crypto';
import { roundHashes, roundServerSeed } from '../lobbies/lobby-event';
const randomAlpha = 'abcdefghijklmnopqrstuvwxyz';

export function generateServerSeed() {
    return crypto.randomBytes(16).toString('hex');
}

export function generateClientSeed() {
    return crypto.randomBytes(8).toString('hex');
}

function getCombinedSeed(serverSeed: string, clientSeeds: any[]) {
    return serverSeed + clientSeeds.slice(0, 3).join('');
}

function sha512(input: crypto.BinaryLike) {
    return crypto.createHash('sha512').update(input).digest('hex');
}


function calculateCrashPoint(hash: string): number {
    const h = BigInt('0x' + hash.slice(0, 13));
    if (h % 26n === 0n) return 1.00;
    const e = BigInt(2) ** BigInt(52);
    const result = (BigInt(100) * e) / (h + 1n);
    return Number(result) / 100;
}

export const createRoundHashes = () => {
    let totalUserSeeds = Object.values(roundHashes).length;
    while (totalUserSeeds < 3) {
        const demoUserId = `${randomAlpha[Math.floor(Math.random() * randomAlpha.length)]}***${Math.floor(Math.random() * 10)}`;
        roundHashes[demoUserId] = generateClientSeed();
        totalUserSeeds++;
    }
};

export function generateCrashMult(): {
    serverSeed: string, hashedSeed: string, max_mult: number
} {
    const serverSeed = roundServerSeed;
    const combinedSeed = getCombinedSeed(serverSeed, Object.values(roundHashes));
    const hashedSeed = sha512(combinedSeed);
    const max_mult = calculateCrashPoint(hashedSeed);
    return { serverSeed, hashedSeed, max_mult }
};