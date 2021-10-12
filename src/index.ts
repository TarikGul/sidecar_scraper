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

/**
 * 
 */
const main = async (args: Namespace) => {
    const { skip_size, extrinsics } = args;
    const skipSize: number = skip_size ? parseInt(skip_size) : DEFAULT_SKIP_SIZE;
    const heightLimit = await fetchBlockHeadNumber();
    const blocksFound = [];

    console.log('Extrinsic: ', extrinsics);
    console.log('Skip size: ', skipSize);
    console.log('Block Limit: ', heightLimit);

    let blockCounter = 10253;

    if (!extrinsics) {
        console.warn('Please use the flag --extrinsics to set the resolver');
        process.exit(1)
    }
    
    
    while (blockCounter < heightLimit) {
        const resBlock = await request(`/blocks/${blockCounter}`, HOST, PORT);
        const parsedBlock = JSON.parse(resBlock);

        if (resBlock.includes(extrinsics)) {
            console.log(`Found ${extrinsics} at Block ${parsedBlock['number']}`)
            blocksFound.push(parsedBlock['number']);

            blockCounter += skipSize;
        } else {
            console.log(`Found nothing in Block ${parsedBlock['number']}`)
            blockCounter += 1;
        }
    }
    console.log(blockCounter, ' ', heightLimit)
    console.log(blocksFound);
}

const parser = new ArgumentParser();

parser.add_argument('--extrinsics');
parser.add_argument('--skip-size');

const args = parser.parse_args() as Namespace;

main(args).finally(() => process.exit(0));
