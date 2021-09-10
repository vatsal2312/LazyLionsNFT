// import { PrismaClient, Prisma } from '@prisma/client'

// let prisma

// async function getClient() {
//     if (!prisma) {
//         prisma = new PrismaClient()
//     }
//     return prisma
// }


import { PrismaClient } from "@prisma/client"

let prisma

if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient()
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient()
    }

    prisma = global.prisma
}

// export default prisma


// https://github.com/prisma/prisma/issues/1983#issuecomment-620621213
module.exports = {
    getClient: () => prisma
}