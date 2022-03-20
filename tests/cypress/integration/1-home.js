describe('home page', () => {
  before(() => {
    // Make sure we have some transactions to display in the Recent transactions list
    cy.task('bitcoind:make_tx_bulk', { num_txs: 6 })
    cy.wait(6000)
    cy.task('bitcoind:mine')
  })

  beforeEach(() => {
    cy.visit('/')
  })

  it('displays the latest blocks', () => {
    cy.get('.blocks-table .blocks-table-link-row')
      .should('have.length', 5)

    // verify the last block height matches bitcoin'd block count
    cy.task('bitcoind', [ 'getblockcount' ]).then(tip_height => {
      cy.get('.blocks-table .blocks-table-link-row [data-label=Height]')
        .first().should('have.text', tip_height)
    })
  })

  it('displays the latest transactions', () => {
    cy.scrollTo('bottom')
    cy.get('.transactions-table .transactions-table-link-row')
      .should('have.length', 5)
  })

  it('can click a block to open it', () => {
    cy.get('.blocks-table .blocks-table-link-row [data-label=Height]').first().then($btn => {
      const block_height = $btn.text()
      $btn.click()

      cy.url().should('include', '/block/')
      cy.get('h1.block-header-title')
        .should('have.text', `Block ${block_height}`)
    })
  })

  it('can click a transaction to open it', () => {
    cy.get('.transactions-table .transactions-table-link-row [data-label=TXID]').first().then($btn => {
      const txid = $btn.text()
      $btn.click()

      cy.url().should('include', `/tx/${txid}`)
      cy.get('.transaction-box .txn')
        .should('have.text', txid)
    })
  })
})
