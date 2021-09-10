require('dotenv').config()
const { GraphQLClient, gql } = require('graphql-request')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const Twitter = require('twitter-v2')
const ethers = require('ethers')
const axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3 });
const util = require('util');
const compare = require('hamming-distance');
const { imageHash } = require('image-hash');
const imageHashPromisify = util.promisify(imageHash)
const _ = require('lodash')
const { writeFileSync } = require('fs')
const os = require('os');
const fs = require('fs');
const path = require('path');
const contracts = require('../../contracts')

const lazylionMetadata = require('../data/traits').reduce((acc, curr) => {
    acc[curr.tokenId] = curr
    return acc
}, {})

// Helpers
async function paginateGraphQLQuery(query, client) {
    // let skip = 0
    let lastID = ""

    let datas = []

    // Iteratively call graphql endpoint, skipping in batches of 1000,
    // until there are no more results returned.
    do {
        const res = await client.request(query, { lastID })
        const primaryKey = Object.keys(res)[0]
        const data = res[primaryKey]
        // console.log(data)
        datas = datas.concat(data)
        if(!data.length) break

        lastID = _.last(datas).id
    } while (true);

    return datas
}

function getLionMetadata(id) {
    return lazylionMetadata[id]
}


function tempFile(name = 'temp_file', data = '', encoding = 'utf8') {
    return new Promise((resolve, reject) => {
        const tempPath = path.join(os.tmpdir(), 'foobar-');
        fs.mkdtemp(tempPath, (err, folder) => {
            if (err)
                return reject(err)

            const file_name = path.join(folder, name);

            fs.writeFile(file_name, data, encoding, error_file => {
                if (error_file)
                    return reject(error_file);

                resolve(file_name)
            })
        })
    })
}

path.existsSync = (p) => {
    try {
        const statRes = fs.statSync(p)
        return true
    } catch (err) {
        if (err.code === 'ENOENT') return false
        throw err
    }
}



async function main() {
    const { 
        GRAPH_NODE_URL,
        TWITTER_API_KEY,
        TWITTER_SECRET_KEY,
        ETH_RPC_URL,
        
    } = process.env
    // let IPFS_NODE_URL = "https://cloudflare-ipfs.com/ipfs/"
    let IPFS_NODE_URL = 'https://roarwards.mypinata.cloud/ipfs/'
    // let IPFS_NODE_URL = 'https://mypinata.cloud/ipfs/'
    // let IPFS_NODE_URL = 'http://swag123.mypinata.cloud/ipfs/'

    if (!GRAPH_NODE_URL) throw new Error("GRAPH_NODE_URL not defined")
    if (!TWITTER_API_KEY) throw new Error("TWITTER_API_KEY not defined")
    if (!TWITTER_SECRET_KEY) throw new Error("TWITTER_SECRET_KEY not defined")

    const { LazyLions } = contracts.getContracts({ signerOrProvider: null })

    // Now load all users from database with a linked twitter login.

    // Load all NFT token holders from the Subgraph.
    const client = new GraphQLClient(GRAPH_NODE_URL)
    const datas = await paginateGraphQLQuery(gql`
        query getHolders($lastID: String) {
            erc721Tokens(where: { tokenContract: "0x8943c7bac1914c9a7aba750bf2b6b09fd21037e0", id_gt: $lastID }) {
                id,
                tokenId,

                owner {
                    id
                }
            }
        }`, 
        client
    )

    require('fs').writeFileSync('tokens.json', JSON.stringify(datas, null, 1))

    const holders = datas.reduce((acc, curr) => {
        return acc
            .concat(curr.owner.id)
    }, [])
    console.log(holders)

    console.log(`Counting ${holders.length} NFT holders`)

    // Get all Twitter data for the holders listed above.
    const twitterProfiles = await prisma.twitterProfile.findMany({
        where: {
            'user': {
                'ethereumAccount': {
                    address: {
                        in: holders,
                        mode: 'insensitive',
                    }
                }
            }
        },
        include: {
            user: {
                include: {
                    ethereumAccount: true,
                    twitterChecks: true
                }
            }
        }
    })

    console.log(twitterProfiles)

    // Select holders that havne't been checked.
    // Filter those that haven't been checked in the past 24h.
    const now = new Date
    const PERIOD = 1000 * 60 * 60 * 24 // 24h
    let needsChecking = twitterProfiles.filter(function needsChecking(profile) {
        return true
        if(!profile.user.twitterChecks.length) return true
        
        for (let check of profile.user.twitterChecks) {
            if (check.checkedAt > (now - PERIOD)) {
                // If a check has occurred in the past 24h, skip this user.
                return false
            }
        }

        return false
    })

    console.log(needsChecking)

    // Now randomly sample 1/24 of the holders that need checking.
    // This prevents attacks where users can predict the checking schedule,
    // and hence frontrun the check script by buying a lion before it runs.
    let sample
    if(process.env.SAMPLE_ALL) {
        sample = needsChecking
    } else {
        sample = _.sampleSize(needsChecking, Math.max(needsChecking.length / 24, 1))
    }

    console.log(sample)

    console.log(`User sample size: ${sample.length}`)

    // Now check each Twitter profile.
    for(const batch of _.chunk(sample, 5)) {
        // for (const twitterProfile of sample) {
        await Promise.all(batch.map(async (twitterProfile) => {
            const userId = twitterProfile.user.id

            // Get their Twitter API key.
            const twitterAccount = await prisma.account.findFirst({
                where: {
                    userId,
                    providerId: "twitter"
                }
            })

            if(!twitterAccount) {
                console.error("Could not find Twitter account for "+twitterProfile.user.id)
                return
            }
            
            console.log(twitterAccount)
            
            const { accessToken, refreshToken } = twitterAccount
            const twitterClient = new Twitter({
                consumer_key: TWITTER_API_KEY,
                consumer_secret: TWITTER_SECRET_KEY,
                access_token_key: accessToken,
                access_token_secret: refreshToken,
            });

            // Load Twitter profile details.
            let profileRes
            try { 
                profileRes = await twitterClient.get(`users/${twitterAccount.providerAccountId}?user.fields=profile_image_url,description`)
            } catch(err) {
                // If there was an error getting their profile, there's not much we can do.
                console.error(`Error fetching profile for user with twitter account ID ${twitterAccount.providerAccountId}`)
                console.error(err)
                return
            }
            
            console.log(profileRes)
            
            // Something like this:
            // data: {
            //     profile_image_url: 'https://pbs.twimg.com/profile_images/1426573496319049732/p0rsGkLX_normal.jpg',
            //         name: 'Ike Lucero, Jr.',
            //             description: '',
            //                 username: 'IkeLucero',
            //                     id: '233786053'
            // }

            // Fetch Twitter profile picture for hashing later.
            // (strip the underscore to get full size image)
            const profilePictureUrl = profileRes.data.profile_image_url.replace('_normal', '')
            console.log(`Profile pic ${profilePictureUrl}`)
            
            let profilePicture
            try {
                profilePicture = await axios.get(profilePictureUrl, {
                        responseType: "arraybuffer"
                    })
                    .then(res => res.data)
                    .then(buf => tempFile(`file.${path.extname(profilePictureUrl)}`, buf))
                    .catch(ex => { throw ex; })
            } catch(err) {
                console.error("Error fetching profile for user")
                throw err
            }
            
            // Load NFT images for matches.
            // We need to load all tokens that this user owns.
            console.log(`Loading tokens for ${twitterProfile.user.ethereumAccount.address}`)
            
            const tokens = datas
                .filter(x => x.owner.id == twitterProfile.user.ethereumAccount.address.toLowerCase())
                .map(x => x.tokenId)
            console.log(tokens)
            
            const metadatas = tokens.map(token => getLionMetadata(token.toString()))
            const uris = metadatas.map(metadata => metadata.imageIPFS).map(ipfsHash => `${IPFS_NODE_URL}${ipfsHash}`)

            console.log(uris)
            
            // Download NFT images in parallel.
            let fetchFromIpfsNode = false
            let nftImages

            if(fetchFromIpfsNode) {
                nftImages = await Promise.all(
                    uris
                        .map(async uri => {
                            const res = await fetch(uri)
                            const buf = await res.buffer()
                            // Write them as JPEG's so image-hash can guess their MIME type.
                            return await tempFile('file.jpeg', buf)
                        })
                )
            } else {
                nftImages = metadatas.map(metadata => metadata.imageIPFS).map(ipfsHash => path.join(__dirname, '/../scripts/ipfs/', `${ipfsHash}.jpg`))
            }
            

            console.log(nftImages)

            // Now perform perceptual hashing to check for matches.
            // input   : the user's profile picture
            // targets : user's NFT's
            const input = await imageHashPromisify(profilePicture, 32, true);
            const targets = await Promise.all(metadatas.map(async (metadata, i) => {
                const ipfsHash = metadata.imageIPFS
                let buf

                const imageHashPath = path.join(__dirname, `/../scripts/imagehash/${ipfsHash}.bin`)
                if (path.existsSync(imageHashPath)) {
                    buf = fs.readFileSync(imageHashPath, { encoding: "binary" })
                } else {
                    const nftJpegPath = nftImages[i]
                    buf = await imageHashPromisify(nftJpegPath, 32, true)
                    fs.writeFileSync(imageHashPath, buf)
                }
                
                return buf
            }))
            // const targets = await Promise.all(nftImages.map(nftJpegPath => imageHashPromisify(nftJpegPath, 32, true)))

            let matchIndex
            targets.forEach((target, i) => {
                const targetNft = tokens[i]
                const distance = compare(input, target)
                console.log(`comparing #${metadatas[i].tokenId} (${uris[i]}), dist=${distance}`)
                if(distance < 100) {
                    matchIndex = i
                }
            })

            let pfpMatch
            let hasNFTAsPFP = matchIndex != null
            if (hasNFTAsPFP) {
                pfpMatch = metadatas[matchIndex].tokenId
                console.log(`user PFP matches NFT ${pfpMatch}`)
            }
            let matchDetail = hasNFTAsPFP ? `NFT #${pfpMatch} (${uris[matchIndex]})` : 'nope'
            console.log(`NFT match - ${matchDetail}`)

            // Now check for lazylions emojii
            const { name, description } = profileRes.data
            let containsEmojii = name.includes('🦁') || description.includes('🦁')
            console.log(`containsEmojii - ${containsEmojii}`)

            // Save the check to the database.
            const check = await prisma.twitterChecks.create({
                data: {
                    profilePictureUrl,
                    description,
                    name,

                    containsEmojii,
                    hasNFTAsPFP,
                    pfpMatch,

                    checkedAt: new Date(),

                    userId
                },
            })
            
            // Update their profile picture.
            try {
                await prisma.twitterProfile.update({
                    where: { id: twitterProfile.id },
                    data: {
                        profile_image_url: profilePictureUrl
                    }
                })
            } catch(err) {
                // This could be a race between them disconnecting their profile on the dapp,
                // in which case, we just log the error for prosperity.
                console.error("Error updating twitter profile -")
                console.error(err)
            }
        }))
    }

    await prisma.$disconnect()
}

main().catch(ex => { throw ex }).then(x => {
    console.log('Done')
    process.exit(0)
})