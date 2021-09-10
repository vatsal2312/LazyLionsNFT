import { Button, Card, Table } from 'react-bootstrap'
import { QueryClient, useQuery } from 'react-query'
import { Layout } from '../../components/layout'

import { dehydrate } from 'react-query/hydration'
import { ProfilePicture, TwitterProfilePicture } from '../../components/ProfilePicture'
import { useState } from 'react'

// export async function getStaticProps() {
//     const queryClient = new QueryClient()

//     await queryClient.prefetchQuery('get-users', getProfile)

//     return {
//         props: {
//             dehydratedState: dehydrate(queryClient),
//         },
//     }
// }

async function getUsers({ skip=0, take=25 }) {
    const params = new URLSearchParams({
        skip,
        take
    })
    return fetch(`/api/users?${params}`).then(res =>
            res.json()
        )
}

let usersMock = Array(250).fill(0).map((a, x) => {
    return {
        twitterProfile: {
            profile_image_url: "",
            screen_name: ""
        },
        ethereumAccount: {
            address: x
        }
    }
})
async function getUsersFaux({ skip, take }) {
    const start = Math.min(usersMock.length - 1, skip)
    const end = Math.max(start+take, usersMock.length)
    const data = usersMock.slice(start, end)
    const count = usersMock.length
    return {
        data,
        count
    }
}

const DEFAULT_PAGE_SIZE = 25
export default function ViewUsers() {
    const [ page, setPage ] = useState({
        skip: 0,
        take: DEFAULT_PAGE_SIZE
    })
    const backPage = () => {
        const { skip, take } = page
        setPage({
            skip: Math.max(skip - take, 0),
            take
        })
    }
    const forwardPage = ({ count }) => {
        const { skip, take } = page
        
        setPage({
            skip: Math.min(skip + take, count),
            take
        })
    }


    // const { isLoading, error, data } = useQuery(['get-users', page.skip], () => getUsersFaux(page), { keepPreviousData: true })
    const { isLoading, error, data } = useQuery(`get-users-${page.skip}`, () => getUsers(page), { keepPreviousData: true })
    console.log(isLoading, error, data)

    if (isLoading) return 'Loading...'
    if (error) return 'An error has occurred: ' + error.message

    const users = data.data.filter(user => user.twitterProfile)
    
    const totalPages = Math.floor(data.count / page.take) + 1
    const pageIdx = Math.floor(page.skip / page.take) + 1

    // fetch users from api endpoint
    return <div>
        <h2>Users ({data.count})</h2>

        <div>
            <Button variant="transparent" size="sm" onClick={backPage}>
                ⬅️
            </Button>
            
            <span>
                {' '}Page {pageIdx} of {totalPages}{' '}
            </span>

            <Button variant="transparent" size="sm" onClick={() => forwardPage({ count: data.count })}>
                ➡️
            </Button>
        </div><br />

        <Table bordered hover>
            <thead>
                <tr>
                    <th></th>
                    <th>Twitter</th>
                    <th>Lions</th>
                    {/* <th>Holds lions</th> */}
                </tr>
            </thead>
            <tbody>
                {users.map(user => {
                    return <tr key={user.id}>
                        <td>
                            <TwitterProfilePicture url={user.twitterProfile.profile_image_url} />
                        </td>
                        <td>
                            <a href={`https://twitter.com/${user.twitterProfile.screen_name}`}>@{user.twitterProfile.screen_name}</a>
                        </td>
                        <td>
                            {/* <a href={`https://etherscan.io/address/${user.ethereumAccount.address}`}>{user.ethereumAccount.address}</a> */}
                            Coming soon!
                        </td>
                    </tr>
                })}
            </tbody>
        </Table>
    </div>
}

ViewUsers.getLayout = function getLayout(page) {
    return (
        <Layout>
            {page}
        </Layout>
    )
}
