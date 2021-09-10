import { QueryClient, useQuery } from 'react-query'
import { signOut, signIn, useSession } from 'next-auth/client'
import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout'
import { TwitterProfilePicture, DiscordProfilePicture } from '../../components/ProfilePicture'
import { dehydrate } from 'react-query/hydration'
import { Button, Card } from 'react-bootstrap'




// export async function getStaticProps() {
//     const queryClient = new QueryClient()

//     await queryClient.prefetchQuery('user-profile', getProfile)

//     return {
//         props: {
//             dehydratedState: dehydrate(queryClient),
//         },
//     }
// }

async function getProfile() {
    return fetch(`/api/users/my-profile`).then(res =>
        res.json()
    )
}


export default function MyProfile() {
    const [session, loading] = useSession()
    const { isLoading, error, data: profile } = useQuery('get-profile', getProfile)
    console.log(isLoading, error, profile)

    if (isLoading || loading) return 'Loading...'
    if (error) return 'An error has occurred: ' + error.message

    if (!session) {
        return <div>
            Connect your wallet to view profile.
        </div>
    }

    console.log(profile)
    
    return <div>
        <h2>My profile</h2>
        <div>
            <Button variant="primary" onClick={() => signOut()}>Sign-out</Button>
        </div>
        <br/>

        <Card>
            <Card.Body>
                <h2>Twitter</h2>
                <TwitterSection profile={profile}/>
            </Card.Body>
        </Card>

        <Card>
            <Card.Body>
                <h2>Ethereum</h2>
                <div>
                    {
                        profile && profile.user.ethereumAccount
                            ? <>
                                Linked to <a href={`https://etherscan.io/address/${profile.user.ethereumAccount.address}`}>{profile.user.ethereumAccount.address}</a>
                            </>
                            : "Uh-oh"
                    }
                </div>
            </Card.Body>
        </Card>

        <Card>
            <Card.Body>
                <h2>Discord</h2>
                {
                    !profile.user.discordProfile 
                        ? <div>
                            <Button variant="primary" onClick={() => signIn('discord')}>Sign in with Discord</Button>
                        </div>
                        : <>
                            <span>
                                <DiscordProfilePicture url={profile.user.discordProfile.image_url} />
                            </span>
                            <span>@{profile.user.discordProfile.username}</span>
                        </>
                }
            </Card.Body>
        </Card>
    </div>
}

const TwitterSection = ({ profile }) => {
    if (!profile.user.twitterProfile) {
        return <div>
            <Button variant="primary" onClick={() => signIn('twitter')}>Sign in with Twitter</Button>
        </div>
    }

    return <div>
        <>
            <div>@{profile.user.twitterProfile.screen_name}</div>
            <div>DP verified: <TwitterProfilePicVerified profile={profile}/></div>
            {/* <div>Roaring in bio? {''}</div> */}
            <div>
                <TwitterProfilePicture url={profile.user.twitterProfile.profile_image_url} />
            </div>
        </>
    </div>
}

const TwitterProfilePicVerified = ({ profile }) => {
    let verifiedStatus = 'unknown'
    let verified
    let latestProfileCheck
    if (profile.user.twitterChecks && profile.user.twitterChecks.length) {
        latestProfileCheck = profile.user.twitterChecks[0]
        verifiedStatus = latestProfileCheck.hasNFTAsPFP ? 'yes' : 'no'
    }

    if (verifiedStatus == 'unknown') {
        verified = "verification in next 24h"
    } else if (verifiedStatus == 'yes') {
        verified = <>
            Yes (<a href={`https://opensea.io/assets/0x8943c7bac1914c9a7aba750bf2b6b09fd21037e0/${latestProfileCheck.pfpMatch}`}>NFT #{latestProfileCheck.pfpMatch}</a>)
        </>
    } else {
        verified = 'no'
    }

    return verified
}
MyProfile.getLayout = function getLayout(page) {
    return (
        <Layout>
            {page}
        </Layout>
    )
}
