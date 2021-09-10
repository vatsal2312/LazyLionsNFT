const util = require('util');

const { imageHash } = require('image-hash');
const imageHashPromisify = util.promisify(imageHash)

const images = [
  '/Users/liamz/Documents/Projects/flair-mining/twitter/scripts/kRCRiA22.jpg',
  '/Users/liamz/Documents/Projects/flair-mining/twitter/scripts/opensea.jpg',
  '/Users/liamz/Documents/Projects/flair-mining/twitter/scripts/unnamed1.jpg',
  '/Users/liamz/Documents/Projects/flair-mining/twitter/scripts/unnamed2.jpg',
  '/Users/liamz/Documents/Projects/flair-mining/twitter/scripts/unnamed3.jpg',
]


async function run() {
  const hashes = await Promise.all(images.map(async (path) => {
    const data = await imageHashPromisify(path, 32, true);
    console.log(path, data)
    return data
  }))

  const compare = require('hamming-distance');
  const input = hashes[0]
  const targets = [
    hashes[1],
    hashes[2],
    hashes[3],
    hashes[4]
  ]

  console.log(
    targets.map(target => compare(input, target))
  )
}

run().catch(ex => { throw ex })