import { getClient } from '../../../lib'
const _ = require('lodash')
const { getLatestCheck, SORT_OPTIONS, publicUsersFilter } = require('../../../lib/users')


export default async (req, res) => {
    let { skip, take, sortBy } = req.query
    skip = parseInt(skip)
    take = parseInt(take)
    if (!_.includes(Object.keys(SORT_OPTIONS), sortBy)) sortBy = 'newest'

    const prisma = await getClient()

    const count = await prisma.user.count({
        where: publicUsersFilter
    })

    let users = await prisma.user.findMany({
        where: publicUsersFilter,
        skip,
        take,
        orderBy: SORT_OPTIONS[sortBy],
        include: {
            ethereumAccount: false,
            twitterProfile: true,
            discordProfile: true,
            // twitterChecks: true
        }
    })

    // load twitter checks separately
    // const twitterChecks = await prisma.twitterChecks.findMany({
    //     where: {
    //         userId: {
    //             in: users.map(user => user.id)
    //         }
    //     },
    //     take: 1,
    // })
    // await prisma.$queryRaw`SELECT * FROM (SELECT * FROM TwitterChecks WHERE userId IN ${users.map(user => user.id)} ORDER BY checkedAt DESC LIMIT 1) `

    users = await Promise.all(users.map(async user => {
        // Pick subfields
        let { twitterProfile } = user
        twitterProfile = twitterProfile ? _.pick(twitterProfile, ['screen_name', 'description', 'profile_image_url']) : twitterProfile;

        // Ugh, Prisma is a bit inefficient for some things.
        const twitterChecks = await prisma.twitterChecks.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                checkedAt: 'desc'
            },
            take: 1
        })

        // Add "check" info.
        const check = getLatestCheck(twitterChecks)

        return {
            ...user,
            twitterProfile,
            check
        }
    }))

    res.json({
        skip,
        take,
        count,
        data: users
    })
}