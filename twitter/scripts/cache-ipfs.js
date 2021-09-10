const traits = require('../data/traits.json')

const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3 });
const _ = require('lodash')


path.existsSync = (p) => {
    try {
        const statRes = fs.statSync(p)
        return true
    } catch (err) {
        if (err.code === 'ENOENT') return false
        throw err
    }
}
let IPFS_NODE_URL = 'https://roarwards.mypinata.cloud/ipfs/'

async function downloadImage(ipfsHash) {
    // const ipfsHash = trait.imageIPFS;
    const filepath = path.join(__dirname, '/ipfs/', ipfsHash + '.jpg')
    if (path.existsSync(filepath)) {
        console.log(ipfsHash + ' (skipping)')
        return
    }

    const url = `${IPFS_NODE_URL}${ipfsHash}`
    // const res = await fetch(`${IPFS_NODE_URL}${ipfsHash}`)
    // const buf = await res.buffer()
    // console.log(ipfsHash)
    // fs.writeFileSync(filepath, buf)

    const res = await axios({
        method: "get",
        url,
        responseType: "arraybuffer"
    })
    // await res.data.pipe(fs.createWriteStream(filepath));
    console.log(ipfsHash)
    fs.writeFileSync(filepath, res.data)
}

async function main() {
    for (let batch of _.chunk(traits, 300)) {
        await Promise.all(batch.map(trait => trait.imageIPFS).map(ipfsHash => downloadImage(ipfsHash)))
    }
}

main().then(x => console.log('Done')).catch(err => {throw err})