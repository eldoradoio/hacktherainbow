# El Dorado - Hack the Rainbow

TODO: Replace with our video:
[![ElDoradoSubmission(https://img.youtube.com/vi/C0DPdy98e4c/0.jpg)](https://www.youtube.com/watch?v=C0DPdy98e4c)

## This repo contains:
 - **/near-contract**: 
    - A token implementation put together from several examples
    - Roughtly-put-together UI to manage said contract. Manage the contract, Mint and send tokens. (NOTE: this is not intented to be used by users)
 - **/eldoardo-near-client**: 
    - An *npm* client library that El Dorado uses in our backend to communciate to the token contract
    - An very basic (NOT READY FOR PRODUCTION) implementation of a KeyStore that uses AWS DynamoDB as storage.

## Dev Environment

If you want to develop on this repo, the only thing you'd need is Docker, VSCode, and [this extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers#review-details)

After opening it in vscode you'll be prompted to re-open it in a Container. Press `Reopen in container`.
if not prompted, can also press `Ctrl+Shift+p` and type `Reopen in container` and select that item from the command bar.

All the tooling, SDKs, and a local dynamodb image will be ready for you!!

## High-level implementation and Status

- [x] All Near tokens funds are backed locked in a common ETH address owned by el dorado
- [ ] As soon as funds are final, we mint them on our contract using the rainbow bridge (Pending)
- [x] A simple contract for tokens in near
- [x] Interface to near token contract to be able to make transfers between el dorado users using the app
- [x] Integrate Near into our backend
- [ ] When users buy crypto with card, send the funds to lockable address
   - [x] Because of the bridge not being ready we send the near tokens to the user after purchasing crypto without any "proof"
   

## How to test the submission 
### NOTE: This might not work on a MAC due to docker networking

### Environment
First follow the *Dev Environment* guide above to get everything ready, without this the library will not work without additional setup and configuration.

### Run the contract
```bash
cd near-contract
yarn dev
```
### Contract ownership
Browse to the site and clock on CLAIM to get ownership of the contract if you haven't done so

### Contract and accountId
Copy the ContractId and accountId for later
Make sure the dev credentials from the *near-contract* deployment are stored in `/home/gitpod/.near-credentials`

### The Npm library have an integration test that works with the contract, your account details 
To run the library run the following command:
```bash
CONTRACT_NAME=<ContractName> MASTER_ACCOUNT=<AccountName> yarn test
```
The test will get those credentials `CONTRACT_NAME` && `MASTER_ACCOUNT` and save them to DynamoDb
