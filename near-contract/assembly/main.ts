// @nearfile
import { context, storage, logging, PersistentMap } from "near-sdk-as";

// --- contract code goes below

const balances = new PersistentMap<string, u32>("b:");
const approves = new PersistentMap<string, u32>("a:");

const TOTAL_SUPPLY: u32 = 1000000;
export function init(initialOwner: string): void {
  logging.log("initialOwner: " + initialOwner);
  assert(storage.get<string>("init") == null, "Already initialized token supply");
  balances.set(initialOwner, TOTAL_SUPPLY);
  storage.set("init", initialOwner);
}

export function totalSupply(): string {
  return TOTAL_SUPPLY.toString();
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
  assert(getBalance(to) <= getBalance(to) + tokens,"overflow at the receiver side");
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
  assert(getBalance(to) <= getBalance(to) + tokens,"overflow at the receiver side");
  balances.set(from, fromAmount - tokens);
  balances.set(to, getBalance(to) + tokens);
  return true;
}

function getBalance(owner: string): u32 {
  return balances.contains(owner) ? balances.getSome(owner) : 0;
}