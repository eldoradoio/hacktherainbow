import { Context, u128, VMContext } from "near-sdk-as";
import { init, totalSupply, balanceOf, transfer, approve, transferFrom, mint, allowance } from "../main";

let owner = ''
let alice = 'alice';
let bob = 'bob.near';
let eve = 'eve.near';

describe('Token', function () {
    beforeAll(() => {
        owner = Context.sender
    });


    beforeEach(() => {
        VMContext.setSigner_account_id(owner);
        VMContext.setAccount_balance(u128.fromString("1000000"));
        init();
    });

    it("intially has 0 tokens", () => {
        expect(balanceOf(Context.sender).toString()).toBe('0');
        expect(balanceOf(alice).toString()).toBe('0');
        expect(balanceOf(bob).toString()).toBe('0');
        expect(balanceOf(eve).toString()).toBe('0');
    });

    it('can mint tokens', ()=>{
        const preSupply = totalSupply()
        const preBalance = balanceOf(owner)

        mint(10)

        const postSupply = totalSupply()
        const postBalance = balanceOf(owner)
        expect(postBalance).toBe(preBalance + 10)
        expect(postSupply).toBe(preSupply + 10)

        mint(40)

        const postSupply2 = totalSupply()
        const postBalance2 = balanceOf(owner)
        expect(postBalance2).toBe(postBalance + 40)
        expect(postSupply2).toBe(postSupply + 40)
    })

    it('Alice can transfer to other account', () => {

        VMContext.setSigner_account_id(owner);
        VMContext.setAccount_balance(u128.fromString("1000000"));
        mint(100)

        transfer(alice, 100)
        
        VMContext.setSigner_account_id(alice);
        VMContext.setAccount_balance(u128.fromString("1000000"));

        const aliceStartBalance = balanceOf(alice);
        const bobStartBalance = balanceOf(bob);

        transfer(bob, 100);

        const aliceEndBalance = balanceOf(alice);
        const bobEndBalance = balanceOf(bob);
        expect(aliceEndBalance).toBe(aliceStartBalance - 100);
        expect(bobEndBalance).toBe(bobStartBalance + 100);
    });

    it('can transfer from approved account to another account', () => {

        VMContext.setSigner_account_id(owner);
        VMContext.setAccount_balance(u128.fromString("1000000"));
        mint(200)

        expect(balanceOf(owner)).toBeGreaterThanOrEqual(200)

        transfer(alice, 200)
        

        /**
         * AS ALICE
         */
        VMContext.setSigner_account_id(alice);
        VMContext.setAccount_balance(u128.fromString("1000000"));

        transfer(bob, 100);

        const aliceStartBalance = balanceOf(alice);
        const bobStartBalance = balanceOf(bob);
        const eveStartBalance = balanceOf(eve);

        // AS ALICE ALLOW EVE TO SPEND 100 
        approve(eve, 100);
        
        const aliceMidBalance = balanceOf(alice);
        const bobMidBalance = balanceOf(bob);
        const eveMidBalance = balanceOf(eve);
        expect(aliceMidBalance).toBe(aliceStartBalance);
        expect(bobMidBalance).toBe(bobStartBalance);
        expect(eveMidBalance).toBe(eveStartBalance);
        expect(allowance(alice, eve)).toBe(100)
        
        /**
         * AS EVE FROM ALICE TO BOB
         */
        VMContext.setSigner_account_id(eve);
        VMContext.setAccount_balance(u128.fromString("1000000"));
        transferFrom(alice, bob, 50);

        const aliceEndBalance = balanceOf(alice);
        const bobEndBalance = balanceOf(bob);
        const eveEndBalance = balanceOf(eve);
        expect(aliceEndBalance).toBe(aliceStartBalance - 50);
        expect(bobEndBalance).toBe(bobStartBalance + 50);
        expect(eveEndBalance).toBe(eveStartBalance);
    });

});