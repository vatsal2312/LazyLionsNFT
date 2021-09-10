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




async function main() {
    const profiles = await prisma.twitterProfile.count()
    const checks = await prisma.twitterChecks.findMany({
        where: {
        },
        distinct: ['userId']
    })
    const withPFP = await prisma.twitterChecks.findMany({
        where: {
            OR: [
                {
                    hasNFTAsPFP: true
                },
                {
                    containsEmojii: true
                }
            ]
        },
        distinct: ['userId']
    })
    console.log("Counting 10080 NFT holders")
    console.log(`# of linked twitter accounts: ${profiles}`)
    console.log(`# of profiles checked without error: ${checks.length}`)
    console.log(`# of profiles with PFP or emojii: ${withPFP.length}`)
}



main().then(x => console.log('Done')).catch(err => { throw err })