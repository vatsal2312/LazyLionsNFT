import { getClient } from '../../../lib'

export default async (req, res) => {
    const { discordId, token } = req.query
    if (token !== '6a7b7b25f4748680074fdf379317b04aff60f4e1') {
        return res.status(403).json({
            error: "Denied"
        })
    }

    const prisma = await getClient()
    const discordProfile = await prisma.discordProfile.findUnique({
        where: {
            discordId,
        }
    })
    if (!discordProfile) {
        return res.status(404).json({
            error: "Discord profile not found"
        })
    }

    console.log(discordProfile)
    const user = await prisma.user.findUnique({
        where: {
            discordProfile
        },
        include: {
            'ethereumAccount': true
        }
    })
    if (!user) {
        return res.status(404).json({
            error: "User not found for discord profile"
        })
    }

    res.json({
        address: user.ethereumAccount.address
    })
}