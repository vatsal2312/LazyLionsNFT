

const ethers = require('ethers')
const { utils } = ethers
const { BigNumber: BN } = ethers

async function main() {
    const numTxs = 10000
    const gas = 21000
    const gasPriceGwei = "12."
    const gasPrice = utils.parseUnits(gasPriceGwei, 'gwei')
    const cost = gasPrice.mul(BN.from(gas * numTxs))

    console.log(`cost: ${utils.formatEther(cost)}`)
}

main().then(x => console.log('Done')).catch(err => { throw err; })

