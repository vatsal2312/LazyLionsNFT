
const _ = require('lodash')


const defaultCheck = {
    hasPFP: false,
    hasEmoji: false,
    diamondPaws: false
}

export const SORT_OPTIONS = {
    alphabetical: {
        twitterProfile: {
            screen_name: 'asc'
        }
    },

    // TODO.
    'diamond-paws': {},

    newest: {
        createdAt: 'desc'
    }
}


// Only show users with a connected Twitter profile.
export const publicUsersFilter = {
    twitterProfile: {
        isNot: null
    }
}

export function getLatestCheck(twitterChecks) {
    if(!twitterChecks.length) {
        return defaultCheck
    }

    const { containsEmojii, hasNFTAsPFP } = _.last(twitterChecks)
    return {
        hasEmoji: containsEmojii,
        hasPFP: hasNFTAsPFP,
        // TODO: implement.
        diamondPaws: false
    }
}
