
const moment = require('moment')
const { GraphQLClient, gql } = require('graphql-request')
const contracts = require('../contracts')
const ethers = require('ethers')
const { BigNumber: BN } = ethers
const _ = require('lodash')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const { access, constants } = require('fs')
const path = require('path')
const { formatEther, parseEther } = ethers.utils

path.existsSync = (p) => {
    try {
        const statRes = fs.statSync(p)
        return true
    } catch(err) {
        if (err.code === 'ENOENT') return false
        throw err
    }
}

// Helpers
async function paginateGraphQLQuery(query, client, params) {
    // let skip = 0
    let lastID = ""

    let datas = []

    // Iteratively call graphql endpoint, skipping in batches of 1000,
    // until there are no more results returned.
    do {
        const res = await client.request(query, { ...params, lastID })
        const primaryKey = Object.keys(res)[0]
        const data = res[primaryKey]
        // console.log(data)
        datas = datas.concat(data)
        if (!data.length) break

        lastID = _.last(datas).id
    } while (true);

    return datas
}

const FRESH = !!process.env.FRESH

const NIL = []
function atom(x) {
    if (
        typeof x == 'number' ||
        typeof x == 'string' ||
        typeof x == 'boolean' ||
        x == NIL)
        return true

    if (typeof x == 'object' && x.constructor.name == 'Array') {
        // The empty list is atomic.
        if (x.length === 0) return true
        // Else return an empty list.
        else return []
    }
}

function toCsv(obj, headings) {
    // const headings = Object.keys(obj)
    return [`${headings.join(',')}`]
        .concat(obj.map(item => {
            if (atom(item)) return item
            return Object.values(item).map(v => `${v.toString()}`)
        }))
        .join('\n')
}

async function runStep(fn, file, force=FRESH) {
    const filePath = path.join(dir, file)
    // TODO: Massive ugly hack.
    const csvFilePath = path.join(dir, file.split('.')[0] + '.csv')
    
    let data
    if (path.existsSync(filePath) && !force) {
        data = require(filePath)
    } else {
        data = await fn()
        fs.writeFileSync(filePath, JSON.stringify(data, null, 1))

        if (file == 'payouts.json') {
            fs.writeFileSync(csvFilePath, toCsv(data, ['holder', 'payout']))
        } else if(file == 'holders.json') {
            // convert data first.
            const dataTransformed = Object.entries(data).map(([ holder, tokens ]) => {
                return `${holder},${tokens.map(token => token.tokenId).join(',')}`
            })

            fs.writeFileSync(csvFilePath, toCsv(dataTransformed, ['address', 'tokens']))
        } else if(file == 'scores.json') {
            fs.writeFileSync(csvFilePath, toCsv(data, ["holder", "score", "holding", "pfpOrEmojiiSet"]))
        }
    }
    return data
}

// Directory to store data for this run of the script.
let dir

async function getHolders({ client, LazyLions, periodStart, periodEnd }) {
    // Fetch holders for this period from subgraph.
    // 
    // Each token has an ownership interval:
    // acquired <-------> disposed.
    // We want to find if this interval overlaps with the period.
    //           start                    end
    //            <------------------------>
    //         <------->
    //                     <------->
    // <------->                                <------->
    // 
    // period.start < ownership.end  and  ownership.start < period.end

    const query = gql`
    query getHolders($address: String, $periodStart: Int, $periodEnd: Int, $lastID: String) {
        erc721Tokens(where: { tokenContract: $address, id_gt: $lastID }) {
            id,
            tokenId,
            ownership(where: { end_gte: $periodStart, start_lte: $periodEnd }) {
                start,
                end,
                owner {
                    id
                },
            }
        }
    }
    `

    const res = await paginateGraphQLQuery(query, client, {
        periodStart: periodStart.unix(),
        periodEnd: periodEnd.unix(),
        address: LazyLions.address
    })

    console.log(
        JSON.stringify(res, null, 1)
    )

    let holders = {}

    // Calculate the number of tokens each holder had.
    res.map(token => {
        token.ownership
            .map(ownership => ownership.owner.id)
            .map(owner => {
                holders[owner] = []
            })
    })

    res.map(token => {
        token.ownership
            .map(ownership => {
                const holder = ownership.owner.id
                
                const { tokenId } = token
                const { start, end } = ownership
                const length = end - start
                const MIN_OWNERSHIP_LENGTH_SECONDS = 60 * 60 * 24 // 1 day

                if (length > MIN_OWNERSHIP_LENGTH_SECONDS) {
                    holders[holder].push({
                        tokenId,
                        length
                    })
                }
            })
        })

    console.log(holders)

    return holders
}

// Calculate a score for each user.
//  - 1pt for holding a lion
//  - 1pt for a PFP or emojii set on Twitter
function calculateScores(holders, twitterChecks) {
    //     Calculate time signalling(days) using twitter DP
    //     Reduce twitterchecks
    //     Add to total time signalling for all users during this period
    //     totalSignalledTime = 100000
    const userChecks = _.groupBy(twitterChecks, x => x.userId)
    console.log(userChecks)

    const scores = Object.entries(holders).map(([ holder, tokens ]) => {
        // 1pt for every lion they held
        const holding = tokens.reduce((acc, curr) => {
            return acc + 1
        }, 0)

        // 1pt for PFP or lion emojii
        let pfpOrEmojiiSet = 0

        const getScore = () => holding + pfpOrEmojiiSet
        const data = () => ({
            holder,
            score: getScore(),
            holding,
            pfpOrEmojiiSet
        })

        // Find checks for user. 
        const check = _.find(twitterChecks, x => x.user.ethereumAccount.address.toLowerCase() === holder)
        if(!check) {
            console.log(`No check for user ${holder}`)
            return data()
        }

        const userId = check.userId
        const checks = userChecks[userId]
        console.log(`${checks.length} checks for user ${userId}`)

        // For the first month, the pfpOrEmojii set score will be capped at 1pt.
        // If they have set a PFP at any point during the past three days, they are rewarded.
        pfpOrEmojiiSet = checks.reduce((acc, curr) => {
            const { hasNFTAsPFP, containsEmojii } = curr
            if (hasNFTAsPFP) acc += 1;
            if (containsEmojii) acc += 1;
            return acc
        }, 0)

        pfpOrEmojiiSet = Math.min(pfpOrEmojiiSet, 1)

        return data()
    })

    const info = scores.reduce((acc, score) => {
        acc.totalHolding += score.holding
        acc.totalPfpOrEmojiiSet += score.pfpOrEmojiiSet
        return acc
    }, {
        totalHolding: 0,
        totalPfpOrEmojiiSet: 0
    })
    console.log(info)

    return scores
}

function calculatePayouts(totalRewardsToPayout, scores) {
    // Normalise scores.
    const totalScore = scores.reduce((acc, curr) => acc + curr.score, 0)
    // TODO: get this from contract.

    // Now calculate each user’s payout of the 1 % of royalties based on this.
    const payouts = scores.map(({ holder, score }) => {
        const payout = totalRewardsToPayout.mul(BN.from(score)).div(BN.from(totalScore))
        return {
            holder,
            payout
            // : ethers.utils.formatEther(payout)
        }
    })

    console.log(payouts)
    return payouts
}

async function payout({ provider, totalRewardsToPayout, signer, payoutsInfo }) {
    // Now make payouts using ethers.js.
    console.log(`Total rewards: ${formatEther(totalRewardsToPayout)} ETH`)
    console.log(`${payoutsInfo.length} recipients`)
    const account = await signer.getAddress()
    const balance = await signer.getBalance()
    console.log(`Account: ${account}`)
    console.log(`Balance: ${formatEther(balance)} ETH`)
    console.log()

    const { BatchTransfer } = contracts.getContracts({ network: 'kovan', signerOrProvider: signer })

    const WETHAddress = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
    const WETH = new ethers.Contract(
        WETHAddress,
        ['function allowance(address,address) public view returns (uint)', 'function approve(address,uint)'],
        signer
    )

    const allowance = await WETH.allowance(account, BatchTransfer.address)
    if (allowance.lt(totalRewardsToPayout)) {
        console.log('Approving BatchTransfer to use our WETH...')
        await WETH.approve(BatchTransfer.address, ethers.constants.MaxUint256)
    }

    // Split into batches of 300.
    let batches = _.chunk(payoutsInfo, 300)
    if(process.env.DEV) {
        batches = batches.slice(0, 2)
    }
    let batchLogs = []
    
    let i = 0
    for (let batch of batches) {
        console.log(`Processing batch #${i}`)
        const tx = await BatchTransfer.batch(
            WETH.address,
            batch.map(x => x.holder),
            batch.map(x => x.payout)
        )
        const res = await tx.wait(1)
        console.log(`done - ` + res.transactionHash)
        batchLogs.push({
            holders: batch.map(x => x.holder),
            payouts: batch.map(x => formatEther(x.payout)),
            transactionHash: res.transactionHash
        })
        
        i++
    }

    fs.writeFileSync(
        path.join(dir, 'payout-batches.json'),
        JSON.stringify(batchLogs, null, 1)
    )

    return payoutsInfo.map(({ holder, payout }) => {
        return {
            holder,
            payout: ethers.utils.formatEther(payout)
        }
    })
}

async function main({
    periodStart,
    periodEnd
} = {
    periodStart: moment().startOf('month'),
    periodEnd: moment().endOf('month')
}) {
    const { 
        GRAPH_NODE_URL,
        ETH_PRIVATE_KEY,
        ETH_RPC_URL
    } = process.env

    if (!GRAPH_NODE_URL) throw new Error("GRAPH_NODE_URL not defined")
    if (!ETH_PRIVATE_KEY) throw new Error("ETH_PRIVATE_KEY not defined")
    if (!ETH_RPC_URL) throw new Error("ETH_RPC_URL not defined")

    const provider = new ethers.providers.JsonRpcProvider(ETH_RPC_URL)
    const signer = new ethers.Wallet(ETH_PRIVATE_KEY, provider)
    const { LazyLions } = contracts.getContracts({ signerOrProvider: signer })

    const client = new GraphQLClient(GRAPH_NODE_URL)

    console.log(`Calculating rewards for:`)
    console.log(`\tperiodStart = ${periodStart}`)
    console.log(`\tperiodEnd = ${periodEnd}`)

    dir = path.join(__dirname, 'data/', `${periodStart.format('DD-MM-yyyy')}`)
    if (!path.existsSync(dir)) {
        fs.mkdirSync(dir)
    }

    const holders = await runStep(
        () => getHolders({ client, LazyLions, periodStart, periodEnd }),
        'holders.json'
    )

    // Now for each holder, we get their twitter checks info for this period.
    // - users, include twitter checks
    // - where eth address is in this list
    // - between period start and end
    const twitterChecks = await prisma.twitterChecks.findMany({
        where: {
            'user': {
                'ethereumAccount': {
                    address: {
                        in: holders,
                        mode: 'insensitive',
                    }
                }
            },
            AND: [
                {
                    checkedAt: { gte: periodStart.toDate() }
                },
                {
                    checkedAt: { lte: periodEnd.toDate() }
                }
            ]
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

    console.log(`${twitterChecks.length} twitter checks loaded`)

    console.log(twitterChecks)
    
    const scores = await runStep(() => calculateScores(holders, twitterChecks), 'scores.json', true)
    
    const totalRewardsToPayout = ethers.utils.parseEther('0.01')
    const payoutsInfo = await calculatePayouts(totalRewardsToPayout, scores)

    const payouts = await runStep(
        () => payout({ provider, totalRewardsToPayout, signer, payoutsInfo }),
        'payouts.json',
        true
    )
}

main().catch(ex => { throw ex }).then(x => {
    console.log('Done')
    process.exit(0)
})