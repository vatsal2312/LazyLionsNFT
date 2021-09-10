
import { Address, ethereum } from '@graphprotocol/graph-ts';
import { LazyLions, Transfer } from '../generated/LazyLions/LazyLions'
import { TokenContract, ERC721Token, Holder, ERC721TokenTransfer, Ownership } from '../generated/schema'
    import {
        BigInt
} from "@graphprotocol/graph-ts";
import { log } from '@graphprotocol/graph-ts'

// Helpers
function getIdForEvent(event: ethereum.Event): string {
    return event.transaction.hash.toHexString()
        .concat('-')
        .concat(event.transactionLogIndex.toHexString());
}

export function handleTransfer(event: Transfer): void {
    const tokenContract = getTokenContract(event.address);

    // get the from and to
    const fromAddress = event.params.from
    const toAddress = event.params.to
    const tokenId = event.params.tokenId

    // now find the token
    const token = getToken(event.address, tokenId);
    // get the owner
    const holder = getHolder(toAddress)
    token.owner = holder.id
    token.tokenContract = tokenContract.id
    token.tokenId = tokenId

    // create transfer event
    const transfer = new ERC721TokenTransfer(
        getIdForEvent(event)
    );
    transfer.tokenContract = tokenContract.id;
    transfer.from = fromAddress.toHexString();
    transfer.to = toAddress.toHexString();
    transfer.token = token.id;
    transfer.date = event.block.timestamp;

    // track ownership
    let numOwners = token.numOwners;
    if (token.isSet('currentOwnership')) {
        const currentOwnership = Ownership.load(token.currentOwnership);
        currentOwnership.end = event.block.timestamp;
        currentOwnership.save();
    }
    const ownership = new Ownership(
        token.tokenContract
        .concat('-')
        .concat(token.id)
        .concat('-')
        .concat(numOwners.toString())
    );
    ownership.start = event.block.timestamp;
    ownership.end = BigInt.fromI32(1).leftShift(255);
    ownership.token = token.id;
    ownership.owner = holder.id;
    token.currentOwnership = ownership.id;
    token.numOwners = token.numOwners + 1;
    
    ownership.save();
    transfer.save();
    token.save()
    holder.save()
    tokenContract.save()
}

export function getTokenContract(address: Address): TokenContract {
    let i = TokenContract.load(address.toHexString()) as TokenContract
    if (i == null) {
        i = new TokenContract(address.toHexString())
    }
    return i
}

export function getToken(tokenContract: Address, tokenId: BigInt): ERC721Token {
    const id = tokenContract.toHexString()
        .concat('-')
        .concat(tokenId.toString());
    let i = ERC721Token.load(id) as ERC721Token
    if (i == null) {
        i = new ERC721Token(id);
        i.numOwners = 0;
        
        // RPC error: Error { code: ServerError(-32000), message: "missing trie node 583ed2b20c41c78a39b8b925656291e05674437e45d38a9b5e263c088ba5cefb (path )",
        // const lazyLionsToken = LazyLions.bind(tokenContract);
        // const uri = lazyLionsToken.try_tokenURI(tokenId);
        // if(!uri.reverted) {
        //     i.uri = uri.value;
        // }

        // field `history` is derived and can not be set
        // i.history = [];
    }
    return i
}

export function getHolder(address: Address): Holder {
    let i = Holder.load(address.toHexString()) as Holder
    if (i == null) {
        i = new Holder(address.toHexString())
    }
    return i
}