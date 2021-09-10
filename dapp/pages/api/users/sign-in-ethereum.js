
import { getSession } from "next-auth/client"
const ethers = require('ethers')
const { getClient } = require('../../../lib')

export default async (req, res) => {
    const session = await getSession({ req })

    if (!session) {

    }

    // if (session) {
    //     // Signed in
    //     console.log('Session', JSON.stringify(session, null, 2))

    //     // Parse params.
    //     const { message, signature } = JSON.parse(req.body)
    //     const address = await ethers.utils.verifyMessage(message, signature)
    //     console.log(address)

    //     // Now store this.
    //     const prisma = await getClient()
    //     const user = await prisma.user.findUnique({
    //         where: { id: session.user.id },
    //         include: {
    //             'ethereumAccount': true
    //         }
    //     })

    //     console.log(user)
    //     if (user.ethereumAccount) {
    //         throw new Error("Ethereum account already linked")
    //     }

    //     const ethereumAccount = await prisma.ethereumAccount.create({
    //         data: {
    //             address,
    //             message,
    //             signature,
    //             userId: user.id
    //         },
    //     })

    // } else {
    //     // Not Signed in
    //     res.status(401)
    // }

    res.end()
}