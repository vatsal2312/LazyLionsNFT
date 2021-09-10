const { getClient } = require('../../../lib')

export default async (req, res) => {
    const { diamondPaws } = JSON.parse(req.body);
    const { token, discordId } = req.query
    if (token !== '6a7b7b25f4748680074fdf379317b04aff60f4e1') {
        return res.status(403).json({
            error: "Denied"
        })
    }

    const prisma = await getClient()

    const user = await prisma.user.findFirst({
        where: {
            discordProfile: {
                discordId
            }
        }
    })

    if (!user) {
        return res.status(404).json({
            error: "User not found for discord profile"
        })
    }

    await prisma.discordChecks.create({
        data: {
            diamondPaws: diamondPaws == true,
            userId: user.id,
            checkedAt: new Date()
        }
    })

    return res.json({})
}

