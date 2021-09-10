import Providers from 'next-auth/providers';
import { getClient } from './index'
const ethers = require('ethers')
const _ = require('lodash')

export function EthereumProvider() {
    return Providers.Credentials({
        id: 'ethereum',
        name: "Ethereum",
        async authorize(credentials, req) {
            console.log(credentials)

            // Parse params.
            const { message, signature } = credentials
            const address = await ethers.utils.verifyMessage(message, signature)
            console.log(address)

            const prisma = await getClient()

            // try find the ethereum account
            let user
            let ethereumAccount = await prisma.ethereumAccount.findFirst({
                where: {
                    address,
                }
            })

            if (!ethereumAccount) {
                // Create a new user and link this eth account.
                user = await prisma.user.create({ data: {} })
                ethereumAccount = await prisma.ethereumAccount.create({
                    data: {
                        address,
                        message,
                        signature,
                        userId: user.id
                    },
                })
            } else {
                user = await prisma.user.findFirst({
                    where: {
                        id: ethereumAccount.userId
                    }
                })
            }
            
            const obj = _.pick(user, ['id'])
            console.log(obj)
            return obj 
        },
        credentials: {
            username: { label: "Message", type: "text " },
            password: { label: "Signature", type: "text" }
        }
    })
}


export function TwitterProvider(options) {
    return {
        id: "twitter",
        name: "Twitter",
        type: "oauth",
        version: "1.0A",
        scope: "",
        accessTokenUrl: "https://api.twitter.com/oauth/access_token",
        requestTokenUrl: "https://api.twitter.com/oauth/request_token",
        authorizationUrl: "https://api.twitter.com/oauth/authorize",
        profileUrl:
            "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true",
        profile(profile, tokens) {
            // ..._.pick(
            //     profile,
            //     'name email screen_name description followers_count friends_count favourites_count statuses_count profile_image_url'.split(' ')
            // ),
            return {
                id: profile.id_str,
                name: profile.name,
                email: profile.email,
                image: profile.profile_image_url_https.replace(/_normal\.(jpg|png|gif)$/, ".$1"),
            }
        },
        ...options,
    }
}

export function DiscordProvider(options) {
    return {
        id: "discord",
        name: "Discord",
        type: "oauth",
        version: "2.0",
        scope: "identify",
        params: { grant_type: "authorization_code" },
        accessTokenUrl: "https://discord.com/api/oauth2/token",
        authorizationUrl: "https://discord.com/api/oauth2/authorize?response_type=code&prompt=none",
        profileUrl: "https://discord.com/api/users/@me",
        profile(profile) {
            if (profile.avatar === null) {
                const defaultAvatarNumber = parseInt(profile.discriminator) % 5
                profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`
            } else {
                const format = profile.avatar.startsWith("a_") ? "gif" : "png"
                profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`
            }
            return {
                id: profile.id,
                name: profile.username,
                image: profile.image_url,
            }
        },
        ...options,
    }
}