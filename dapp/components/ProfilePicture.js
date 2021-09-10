export const TwitterProfilePicture = ({ url }) => {
    return <img width={64} src={url.replace('_normal', '')}/>
}

export const DiscordProfilePicture = ({ url }) => {
    return <img width={64} src={url}/>
}