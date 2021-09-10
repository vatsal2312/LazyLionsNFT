const traits = require('../data/traits.json')

const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const util = require('util');
let IPFS_NODE_URL = 'https://roarwards.mypinata.cloud/ipfs/'

const { imageHash } = require('image-hash');
const imageHashPromisify = util.promisify(imageHash)

path.existsSync = (p) => {
    try {
        const statRes = fs.statSync(p)
        return true
    } catch (err) {
        if (err.code === 'ENOENT') return false
        throw err
    }
}

async function process({ imagePath, ipfsHash }) {
    const filepath = path.join(__dirname, '/imagehash/', ipfsHash + '.bin')
    if (path.existsSync(filepath)) {
        console.log(ipfsHash + ' (skipping)')
        return
    }

    const hash = await imageHashPromisify(imagePath, 32, true)
    fs.writeFileSync(filepath, hash)
    console.log(ipfsHash)
}

async function main() {
    const dir = path.join(__dirname, '/ipfs')
    const files = fs.readdirSync(dir).map(file => {
        return {
            imagePath: path.join(dir, file),
            ipfsHash: path.basename(file, '.jpg')
        }
    })
    for (let batch of _.chunk(files, 10)) {
        await Promise.all(batch.map(process))
    }
}

main().then(x => console.log('Done')).catch(err => { throw err })