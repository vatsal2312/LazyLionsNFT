
import { getSession } from "next-auth/client"
const ethers = require('ethers')
const { getClient } = require('../../../lib')
const { GraphQLClient, gql } = require('graphql-request')
const _ = require('lodash')


export default async (req, res) => {
    const { willDonate } = JSON.parse(req.body);

    const session = await getSession({ req })
    
    console.log('session', session)
    if (!session) {
        return res.json(data)
    }

    const prisma = await getClient()

    await prisma.user.update({
        where: {
            id: session.user.id
        },
        data: {
            willDonate: willDonate === true
        }
    })


    res.json({})
}

