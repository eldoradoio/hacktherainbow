import 'regenerator-runtime/runtime'

import { initContract, login, logout } from './utils'

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')

// global variable used throughout
let currentBalance

const submitButton = document.querySelector('form button')

document.querySelector('form').onsubmit = async (event) => {
  event.preventDefault()

  // get elements from the form using their id attribute
  const { fieldset, address } = event.target.elements
  // disable the form while the value gets updated on-chain
  fieldset.disabled = true


  try {
    // make an update call to the smart contract
    //console.log(amount.value)
    await window.contract.transfer({ to: address.value, tokens: parseInt(parseInt(amount.value).toFixed(0)) })
  } catch (e) {
    alert(
      'Something went wrong! ' +
      'Maybe you need to sign out and back in? ' +
      'Check your browser console for more info.'
    )
    throw e
  } finally {
    // re-enable the form, whether the call succeeded or failed
    fieldset.disabled = false
  }

  // disable the save button, since it now matches the persisted value
  submitButton.disabled = true

  // update the greeting in the UI
  await fetchBalance()

  // show notification
  document.querySelector('[data-behavior=notification]').style.display = 'block'

  // remove notification again after css animation completes
  // this allows it to be shown again next time the form is submitted
  setTimeout(() => {
    document.querySelector('[data-behavior=notification]').style.display = 'none'
  }, 11000)
}

document.querySelector('input#amount').oninput = (event) => {
  if (event.target.value !== currentBalance) {
    submitButton.disabled = false
  } else {
    submitButton.disabled = true
  }
}

document.querySelector('#claim').onclick = async (event) => {
  const button = event.target
  button.disabled = true;
  await contract.init({ initialOwner: window.accountId })
  button.disabled = false;
}

document.querySelector('#mint').onclick = async (event) => {
  const button = event.target
  button.disabled = true;
  await contract.mint({ amount: 10000 })
  button.disabled = false;
  fetchBalance();
}

document.querySelector('#sign-in-button').onclick = login
document.querySelector('#sign-out-button').onclick = logout

// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('#signed-out-flow').style.display = 'block'
}

// Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
  document.querySelector('#signed-in-flow').style.display = 'block'

  document.querySelectorAll('[data-behavior=account-id]').forEach(el => {
    el.innerText = window.accountId
  })

  // populate links in the notification box
  const accountLink = document.querySelector('[data-behavior=notification] a:nth-of-type(1)')
  accountLink.href = accountLink.href + window.accountId
  accountLink.innerText = '@' + window.accountId
  const contractLink = document.querySelector('[data-behavior=notification] a:nth-of-type(2)')
  contractLink.href = contractLink.href + window.contract.contractId
  contractLink.innerText = '@' + window.contract.contractId

  // update with selected networkId
  accountLink.href = accountLink.href.replace('testnet', networkId)
  contractLink.href = contractLink.href.replace('testnet', networkId)

  fetchBalance()
}

// update global currentBalance variable; update DOM with it
async function fetchBalance() {
  currentBalance = await contract.balanceOf({ tokenOwner: window.accountId })
  document.querySelectorAll('[data-behavior=balance]').forEach(el => {
    el.innerText = currentBalance
    el.value = currentBalance
  })

  const totalSupply = await contract.totalSupply()  
  document.querySelectorAll('[data-behavior=supply]').forEach(el => {
    el.innerText = totalSupply
  })

  const owner = await contract.owner()  
  document.querySelectorAll('[data-behavior=owner]').forEach(el => {
    el.innerText = owner
  })
  if(!owner){
    document.querySelectorAll('[data-behavior=claim]').forEach(el => {
      el.style= ""
    })
  }else{
    document.querySelectorAll('[data-behavior=mint]').forEach(el => {
      el.style= ""
    })
  }
}

// `nearInitPromise` gets called on page load
window.nearInitPromise = initContract()
  .then(() => {
    if (window.walletConnection.isSignedIn()) signedInFlow()
    else signedOutFlow()
  })
  .catch(console.error)
