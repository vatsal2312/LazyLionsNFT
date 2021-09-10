
import { getSession } from "next-auth/client"
const ethers = require('ethers')
const { getClient } = require('../../../lib')
const { getLatestCheck } = require('../../../lib/users')
const { GraphQLClient, gql } = require('graphql-request')
const _ = require('lodash')

const getLions = async function (ethAddress) {
    const client = new GraphQLClient("http://13.54.138.88:8000/subgraphs/name/liamzebedee/lazylions-mainnet")
    const query = gql`
            query getTokens($holderID: String) {
                holders(where: { id: $holderID }) {
                    id,
                    tokens(where: { tokenContract: "0x8943c7bac1914c9a7aba750bf2b6b09fd21037e0" }) {
                        tokenId
                    }
                }
            }`
    const res = await client.request(query, { holderID: ethAddress.toLowerCase() })
    if (!res.holders.length) {
        return []
    }
    return res.holders[0].tokens
}

export default async (req, res) => {
    const session = await getSession({ req })
    console.log('session', session)
    if (!session) {
        return res.json(data)
    }

    const prisma = await getClient()

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            'ethereumAccount': true,
        }
    })

    const lionsData = await getLions(user.ethereumAccount.address)
    if (!lionsData) {
        return res.json([])
    }
    const lions = lionsData.map(({ tokenId }) => {
        const traits = require('../../../data/traits.json')
        const metadata = _.find(traits, { tokenId: parseInt(tokenId) })
        return {
            id: tokenId,
            imageIPFS: metadata.imageIPFS,
        };
    })

    res.json(lions)
}

