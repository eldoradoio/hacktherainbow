const bridge = require('rainbow-bridge-lib')
const { TransferETHERC20ToNear } = require('rainbow-bridge-lib/transfer-eth-erc20')
const config = require('./config')

TransferETHERC20ToNear.execute(
    {
        amount: '1',
        ethSenderSk: config.ethSenderSk,
        nearReceiverAccount: 'juan.testnet',
        parent:{
            rawArgs: [
            ]
        }
    })
