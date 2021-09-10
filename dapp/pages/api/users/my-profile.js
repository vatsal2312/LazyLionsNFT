
import { getSession } from "next-auth/client"
const ethers = require('ethers')
const { getClient } = require('../../../lib')
const { getLatestCheck } = require('../../../lib/users')

export default async (req, res) => {
    let data = {
        user: null
    }

    const session = await getSession({ req })
    console.log('session', session)
    if(!session) {
        return res.json(data)
        // return res.status(401)
    }

    const prisma = await getClient()

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            'ethereumAccount': true,
            'twitterProfile': true,
            'discordProfile': true
        }
    })

    const twitterChecks = await prisma.twitterChecks.findMany({
        where: {
            userId: session.user.id
        },
        orderBy: {
            'checkedAt': 'desc'
        },
        take: 1
    })

    data.user = Object.assign(user, { twitterChecks })
    data.user.check = getLatestCheck(twitterChecks)

    res.json(data)
}

