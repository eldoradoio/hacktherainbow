beforeAll(async function () {
  // NOTE: nearlib and nearConfig are made available by near-cli/test_environment
  const near = await nearlib.connect(nearConfig)
  window.accountId = nearConfig.contractName
  window.contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: ['balanceOf'],
    changeMethods: ['transfer'],
    sender: window.accountId
  })
})

test('transfer', async () => {
  const balance = await window.contract.balanceOf({tokenOwner: window.accountId})
  expect(balance).toBe(0)
  // const result = await window.contract.transfer({ to: window.accountId, tokens: 1 })
  // expect(result).toBe(true)
})
