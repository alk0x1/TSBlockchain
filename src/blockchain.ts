import { hash, validatedHash } from "./helpers";

export interface Block {
  header: {
    nonce: number;
    blockHash: string;
  }
  payload: {
    sequence: number;
    timestamp: number;
    data: any;
    previousHash: string;
  }
}

export class Blockchain {
  #chain: Block[] = [];
  private powPrefix = '0';

  constructor(private readonly difficulty: number) {
    this.#chain.push(this.createGenesisBlock())
  }

  private createGenesisBlock() {
    const payload = {
      sequence: 0,
      timestamp: +new Date(),
      data: 'Genesis Block',
      previousHash: ''
    }
    return {
      header: {
        nonce: 0,
        blockHash: hash(JSON.stringify(payload))
      },
      payload
    }
  }

  get chain () : Block[] {
    return this.#chain;
  }

  private get lastBlock (): Block {
    return this.#chain.at(-1) as Block;
  }

  private lastBlockHash (): string {
    return this.lastBlock.header.blockHash;
  }

  createBlock (data: any): Block['payload'] {
    const newBlock: Block['payload'] = {
      sequence: this.lastBlock.payload.sequence + 1,
      timestamp: +new Date(),
      data: data,
      previousHash: this.lastBlockHash()
    }
    console.log(`Block #${newBlock.sequence} created: ${JSON.stringify(newBlock)}`);
    return newBlock;
  }

  blockVerify (block: Block): boolean {
    if (block.payload.previousHash !== this.lastBlockHash()) {
      console.error(`Invalid block #${block.payload.sequence}: the previous hash is ${this.lastBlockHash().slice(0, 12)} and not ${block.payload.previousHash.slice(0, 12)}`);
      return false;
    }
    const testHash: string = hash(hash(JSON.stringify(block.payload)) + block.header.nonce);

    if (!validatedHash({ hash: testHash, difficulty: this.difficulty, prefix: this.powPrefix })) {
      console.error(`Invalid block #${block.payload.sequence}: invalid nonce ${block.header.nonce}, can't verify`)
      return false;
    }
    return true;
  }

  mineBlock (block: Block['payload']) {
    let nonce : number = 0;
    const start : number = +new Date();

    while (true) {
      const blockHash : string = hash(JSON.stringify(block));
      const powHash: string = hash(blockHash + nonce);

      if (validatedHash({hash: powHash, difficulty: this.difficulty, prefix: this.powPrefix})) {
        const end: number = +new Date()
        const reducedHash: string = blockHash.slice(0, 12);
        const minerationTime: number = (end - start) / 1000;

        console.log(`Block #${block.sequence} mined in ${minerationTime} seconds. Hash ${reducedHash} (${nonce} attempts)`);

        return {
          minedBlock: { payload: {...block}, header: { nonce, blockHash }}
        }
      }
      nonce++;
    }
  }

  sendBlock (block: Block): Block[] {
    if (this.blockVerify(block)) {
      this.#chain.push(block);
      console.log(`Block #${block.payload.sequence} was add in blockchain: ${JSON.stringify(block, null, 2)}`);
    }
    return this.#chain;
  }
}
