
import { getSession } from "next-auth/client"
const ethers = require('ethers')
const { getClient } = require('../../../lib')
const { getLatestCheck } = require('../../../lib/users')
const _ = require('lodash')

const disconnectableProviders = ['twitter', 'discord']

export default async (req, res) => {
    const { providerId } = JSON.parse(req.body);

    if(!_.includes(disconnectableProviders, providerId)) {
        throw new Error(`provider ${providerId} cannot be disconnected. Supported providers: ${disconnectableProviders.join(', ')}`)
    }

    const session = await getSession({ req })
    console.log('session', session)
    if (!session) {
        return res.status(401)
    }

    const prisma = await getClient()

    const userId = session.user.id

    const account = await prisma.account.findFirst({
        where: {
            userId,
            providerId
        }
    })

    if(account) {
        await prisma.account.delete({
            where: {
                id: account.id
            }
        })
    }


    // Holy shit this is the ugliest boilerplate.
    // But at least it's better 
    
    if(providerId == 'twitter') {
        const profile = await prisma.twitterProfile.findFirst({
            where: {
                userId
            }
        })

        if (profile) {
            await prisma.twitterProfile.delete({
                where: {
                    id: profile.id
                }
            })
        }
    }

    if (providerId == 'discord') {
        const profile = await prisma.discordProfile.findFirst({
            where: {
                userId
            }
        })

        if (profile) {
            await prisma.discordProfile.delete({
                where: {
                    id: profile.id
                }
            })
        }
    }

    return res.json({})
}

