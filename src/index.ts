/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArgumentParser, Namespace } from 'argparse';

import { HOST, PORT } from './util/consts';
import { request } from './util/request';

/**
 * Default amount of blocks to skip after finding what you are scarping
 */
const DEFAULT_SKIP_SIZE = 0;

/**
 * Returns the last finalized blocks block height
 */
const fetchBlockHeadNumber = async (): Promise<number> => {
    const resBlockHead = await request('/blocks/head', HOST, PORT);
    const blockHead = JSON.parse(resBlockHead);

    return parseInt(blockHead.number)
}

const generateBlockCalls = (min: number, max: number): string[] => {
    const arr = Array.from({length: max - min}, () => '/blocks/').map(((ele, i) => ele += (min + i)));

    return arr
}   

/**
 * 
 */
const main = async (args: Namespace) => {
    const { skip_size, extrinsics } = args;
    const skipSize: number = skip_size ? parseInt(skip_size) : DEFAULT_SKIP_SIZE;
    const heightLimit = await fetchBlockHeadNumber();
    const blocksFound: any[] = [];

    console.log('Extrinsic: ', extrinsics);
    console.log('Skip size: ', skipSize);
    console.log('Block Limit: ', heightLimit);

    const concurrencyLimit = 5;
    const promises = new Array(concurrencyLimit).fill(Promise.resolve());

    const blockStarter = 1607940;

    const calls = generateBlockCalls(blockStarter, heightLimit);
    const callsCopy = ([] as string[]).concat(calls.map((val) => val))



    if (!extrinsics) {
        console.warn('Please use the flag --extrinsics to set the resolver');
        process.exit(1)
    }

    const chainNext = async (p: any) => {
        if (callsCopy.length) {
            const arg = callsCopy.shift();
            return p.then(async () => {
                // Store the result into the array upon Promise completion
                const operationPromise = request((arg as string), HOST, PORT).then((res) => {
                    const parsedBlock = JSON.parse(res);

                    if (res.includes(extrinsics)) {
                        console.log('>>>>-----------------------------------------<<<<');
                        console.log('>>>>------------------WINNER-----------------<<<<');
                        console.log(`Found ${extrinsics} at Block ${parsedBlock['number']}`)
                        console.log('>>>>------------------WINNER-----------------<<<<');
                        console.log('>>>>-----------------------------------------<<<<');
                        blocksFound.push(parsedBlock['number']);
                        callsCopy.splice(0, skipSize);
                    } else {
                        console.log(`Found nothing in Block ${parsedBlock['number']}`)
                    }
                });
                return chainNext(operationPromise);
            });
        }
        return p;
    }

    await Promise.all(promises.map(chainNext));

    return blocksFound;
}

const parser = new ArgumentParser();

parser.add_argument('--extrinsics');
parser.add_argument('--skip-size');

const args = parser.parse_args() as Namespace;

main(args).finally(() => process.exit(0));
