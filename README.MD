# El Dorado - Hack the Rainbow

## This repo contains:
 - **/near-contract**: 
    - A token implementation put all together from several samples
    - Roughtly-put-together UI to manage said contract. Claim, Mint and send tokens.
 - **/eldoardo-near-client**: 
    - An *npm* client library that El Dorado uses in our backend to communciate to the token contract
    - An very basic (NOT READY FOR PRODUCTION) implementation of a KeyStore that uses AWS DynamoDB as storage

## Dev Environment

If you want to develop on this repo, the only thing you'd need is Docker, VSCode, and [this extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers#review-details)

After opening it in vscode you'll be prompted to re-open it in a Container. Press yes.

All the tooling, SDKs and a local dynamodb image will be ready for you.

## High-level implementation

- [x] All Near tokens funds are backed locked in a common ETH address owned by el dorado
- [ ] As soon as funds are final, we mint them on our contract using the rainbow bridge (Pending)
- [x] A simple contract for tokens in near
- [x] Interface to near token contract to be able to make transfers between el dorado users using the app
- [x] Integrate Near into our backend
- [ ] When users buy crypto with card, send the funds to lockable address