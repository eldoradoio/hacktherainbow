# El Dorado - Hack the Rainbow 🌈
## Objective
Integrate El Dorado with Near so the users enjoy a fast, reliable, and accessible blockchain stable-coin account.

[![ElDoradoSubmission](https://img.youtube.com/vi/GmqKIX5VXrw/0.jpg)](https://www.youtube.com/watch?v=GmqKIX5VXrw)

## Relevant Links
- El Dorado App to which we integrated near: https://eldorado-dev.codemagic.app/#/ 
- Deployed contract: https://explorer.testnet.near.org/accounts/juan.testnet
- Deployed contract's management site: https://eldoradoio.github.io/hacktherainbow/

## This repo contains:
 - **/near-contract**: 
    - A token implementation put together from several examples
    - Roughtly-put-together UI to manage said contract. Manage the contract, Mint and send tokens. (NOTE: this is not intented to be used by users)
 - **/eldoardo-near-client**: 
    - An *npm* client library that El Dorado uses in our backend to communciate to the token contract
    - A very basic (NOT READY FOR PRODUCTION) implementation of a KeyStore that uses AWS DynamoDB as storage.

## Dev Environment

If you want to develop on this repo, the only thing you'd need is Docker, VSCode, and [this extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers#review-details).

After opening it in vscode you'll be prompted to re-open it in a Container. Press `Reopen in container`.
if not prompted, can also press `Ctrl+Shift+p` and type `Reopen in container` and select that item from the command bar.

All the tooling, SDKs, and a local dynamodb image will be ready for you!!

## High-level implementation and Status

- [x] All Near tokens funds are backed in a common ETH address owned by El Dorado
- [ ] As soon as funds are final, we mint them on our contract using the rainbow bridge (Pending) (LOCK FUNDS)
- [x] A simple contract for tokens in near
- [x] Interface to near token contract to be able to make transfers between El Dorado users using the app
- [x] Integrate Near into our backend
- [ ] When users buy crypto with card, send the funds to lockable address
   - [x] Because of the bridge not being ready we send the near tokens to the user after purchasing crypto without any "proof"
   

## How to test the submission 
### NOTE: This might not work on a MAC due to docker networking

### Environment
First follow the *Dev Environment* guide above to get everything ready, without this the library will not work without additional setup and configuration.

### Run the contract
NOTE: The first time yarn installs the node modules, it might fail, just do it again and you'll be fine.
```bash
cd near-contract
yarn
yarn dev
```
The command will fail at the end because it cannot open the browser (you are in a container), but worry not, just click the url shown in the terminal and it will open it for you. This tunels the port from the container to your host, so you can connect to it.

It will show you that you've got 0 tokens, and there are 0 tokens in supply.

### Contract ownership and supply
*NOTE*: If you want the account of the contract and the owner to be different (we call it merchant account) then you need to `near login` with the same account you claim the token.

Once you get to the site click on CLAIM to get ownership of the contract if you haven't done so. 
Because our bridge PoC did not work, (our team worked in parallel) we can use the Mint button to get some tokens to the owner (merchant account).

### Contract and Account Id
Copy down the Contract Id and Account Id for later.

Make sure the dev credentials from the *near-contract* deployment are stored in `/home/gitpod/.near-credentials`.

### The Npm library have an integration test that works with the contract
To run the library run the following command:
```bash
yarn
CONTRACT_NAME=<ContractName> MASTER_ACCOUNT=<AccountName> yarn test
```
Those credentials `CONTRACT_NAME` & `MASTER_ACCOUNT` will be saved to your local DynamoDb to be used by the test later on.

There are two integration tests:
- Wallet: It creates a user and makes sure that the keypair is stored in dynamo and can be retrieved.
- Transfer: 
  - Two users are created.
  - Fund user *A* with 5 tokens.
  - Use the `transferFrom` function to send 1 token from A to B using the merchat account (with allowance).
