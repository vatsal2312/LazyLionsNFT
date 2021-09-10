import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { getClient } from '../../../lib'
import { EthereumProvider, TwitterProvider, DiscordProvider } from '../../../lib/providers'
const _ = require('lodash')
import { getSession } from "next-auth/client"

const ethers = require('ethers')

export default async (req, res) => {
    const prisma = await getClient()
    return NextAuth({
        adapter: PrismaAdapter(prisma),
        pages: {
            // Hide this so users don't think the EthereumProvider form that shows (which uses the username+password)
            // is actually supposed to work like a "connect with ethereum" button.
            signIn: '/',
        },

        session: {
            jwt: true,
            maxAge: 30 * 24 * 60 * 60, // 30 days
            updateAge: 24 * 60 * 60, // 24 hours
        },

        providers: [
            TwitterProvider({
                clientId: process.env.TWITTER_API_KEY,
                clientSecret: process.env.TWITTER_SECRET_KEY
            }),
            EthereumProvider({}),
            DiscordProvider({
                clientId: process.env.DISCORD_CLIENT_ID,
                clientSecret: process.env.DISCORD_CLIENT_SECRET
            })
        ],

        callbacks: {
            signIn: async function signIn(user, account, profile) {
                console.log('signIn', arguments)
                return true
            },

            jwt: async function jwt(token, user, account, profile, isNewUser) {
                console.log('jwt', arguments)

                // TODO: This feels fragile...
                if(user) {
                    token.userId = user.id
                }

                if (account && account.provider == 'twitter') {
                    console.log('Creating twitter profile')
                    const twitterProfile = await prisma.twitterProfile.findFirst({
                        where: {
                            userId: user.id
                        }
                    })

                    if (!twitterProfile) {
                        await prisma.twitterProfile.create({
                            data: {
                                ..._.pick(
                                    profile,
                                    'id screen_name description followers_count friends_count favourites_count statuses_count profile_image_url'.split(' ')
                                ),
                                userId: user.id
                            }
                        })
                    }
                }

                if (account && account.provider == 'discord') {
                    console.log('Creating discord profile ')
                    const discordProfile = await prisma.discordProfile.findFirst({
                        where: {
                            userId: user.id
                        }
                    })

                    if (!discordProfile) {
                        console.log(profile)
                        await prisma.discordProfile.create({
                            data: {
                                discordId: profile.id,
                                username: profile.username,
                                image_url: profile.image_url,
                                userId: user.id
                            }
                        })
                        console.log("Discord profile created!")
                    }
                }

                return token
            },

            session: async function session(session, userOrToken) {
                // Why the fuck do I have to do this...
                if(!userOrToken) return session

                console.log('session', arguments)

                // Fucking amateur hour round here...
                // See: https://github.com/nextauthjs/next-auth/issues/535
                const user = await prisma.user.findUnique({
                    where: {
                        id: userOrToken.userId
                    },
                    include: {
                        "twitterProfile": true,
                        "ethereumAccount": true,
                        "discordProfile": true
                    }
                })
                session.user = user
                session.user.id = userOrToken.userId
                return session
            }
        }
    })(req, res);
}