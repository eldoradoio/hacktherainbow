// @nearfile
import { context, storage, logging, PersistentMap } from "near-sdk-as";

const balances = new PersistentMap<string, u32>("b:");
const approves = new PersistentMap<string, u32>("a:");

const INITIAL_SUPPLY: u32 = 0;
const TOTAL_SUPPLY_KEY = "TOTAL_SUPPLY"

export function totalSupply(): u32 {
  if (storage.contains(TOTAL_SUPPLY_KEY)) {
    const supply = storage.getSome<u32>(TOTAL_SUPPLY_KEY)
    if (!supply) return 0
    return supply
  } else {
    return 0
  }
}

export function init(): void {

  const owner = context.sender
  storage.set("_bank", owner)

  logging.log("owner: " + owner);
  assert(storage.get<string>("init") == null, "Already initialized token supply");
  balances.set(owner, INITIAL_SUPPLY);
  storage.set(TOTAL_SUPPLY_KEY, INITIAL_SUPPLY);
  storage.set("init", owner);
}

function changeSupply(changeAmount: u32): u32 {
  const owner = assertTrueOwner()

  const total = totalSupply()
  const newSupply: u32 = total + changeAmount
  assert(newSupply >= 0, "Total supply cannot be bellow zero")
  storage.set(TOTAL_SUPPLY_KEY, newSupply);

  const ownerBalance = getBalance(owner)
  const newOwnerBalance: u32 = ownerBalance + changeAmount
  assert(newOwnerBalance >= 0, "Owner supply cannot be bellow zero")
  balances.set(owner, newOwnerBalance);

  return changeAmount
}

export function mint(amount: u32): u32 {
  assertTrueOwner()
  return changeSupply(amount);
}

/**
 * a guard clause to prevent any account but the token contract itself from
 * invoking some methods
 *
 * THIS IS NOT part of the ERC-20 spec
 */
function assertTrueOwner(): string {
  // the contract name must be available
  assert(context.contractName, "Permission denied: ERR001")
  // the sender of this transaction must be the same account

  const owner = storage.getSome<string>("init");
  // if(!owner){
  //   return context.contractName
  // }
  // if (owner != context.contractName) {
  //   assert(owner == context.sender, "Permission denied: ERR002")
  // }
  return owner
}



export function owner(): string | null {
  return storage.get<string>("init")
}

export function balanceOf(tokenOwner: string): u32 {
  logging.log("balanceOf: " + tokenOwner);
  if (!balances.contains(tokenOwner)) {
    return 0;
  }
  const result = balances.getSome(tokenOwner);
  return result;
}

export function allowance(tokenOwner: string, spender: string): u32 {
  const key = tokenOwner + ":" + spender;
  if (!approves.contains(key)) {
    return 0;
  }
  return approves.getSome(key);
}

export function transfer(to: string, tokens: u32): boolean {
  logging.log("transfer from: " + context.sender + " to: " + to + " tokens: " + tokens.toString());
  const fromAmount = getBalance(context.sender);
  assert(fromAmount >= tokens, "not enough tokens on account");
  assert(getBalance(to) <= getBalance(to) + tokens, "overflow at the receiver side");
  balances.set(context.sender, fromAmount - tokens);
  balances.set(to, getBalance(to) + tokens);
  return true;
}

export function approve(spender: string, tokens: u32): boolean {
  logging.log("approve: " + spender + " tokens: " + tokens.toString());
  approves.set(context.sender + ":" + spender, tokens);
  return true;
}

export function transferFrom(from: string, to: string, tokens: u32): boolean {
  const fromAmount = getBalance(from);
  assert(fromAmount >= tokens, "not enough tokens on account");
  const approvedAmount = allowance(from, to);
  assert(tokens <= approvedAmount, "not enough tokens approved to transfer");
  assert(getBalance(to) <= getBalance(to) + tokens, "overflow at the receiver side");
  balances.set(from, fromAmount - tokens);
  balances.set(to, getBalance(to) + tokens);
  return true;
}

function getBalance(owner: string): u32 {
  return balances.contains(owner) ? balances.getSome(owner) : 0;
}