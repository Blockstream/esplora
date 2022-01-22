describe('block page', () => {
  before(() => {
    // Prepare a block for inspection (with enough transactions to enable paging)
    cy.task('bitcoind:make_tx_bulk', { num_txs: 80 })
    cy.task('bitcoind:mine').then(block_hash => {
      cy.wait(1000)
      cy.visit(`/block/${block_hash}`)
    })
  })

  it('displays the block header fields', () => {
    cy.get('.stats-table')
      .should('contain.text', 'Height')
      .should('contain.text', 'Status')
      .should('contain.text', 'Timestamp')
  })

  it('can toggle advanced details', () => {
    cy.get('.stats-table')
      .should('not.contain.text', 'Merkle root')
      .should('not.contain.text', 'Nonce')

    cy.get('.details-btn[data-toggle-block]')
      .click()

    cy.get('.stats-table')
      .should('contain.text', 'Merkle root')
      .should('contain.text', 'Nonce')

    cy.get('.details-btn[data-toggle-block]')
      .click()

    cy.get('.stats-table')
      .should('not.contain.text', 'Merkle root')
      .should('not.contain.text', 'Nonce')
  })

  it('displays the block\'s first 25 transactions', () => {
    cy.get('.transactions .transaction-box')
      .should('have.length', 25)
  })

  it('can load more transactions', () => {
    cy.get('.load-more').click()
    cy.get('.transactions .transaction-box')
      .should('have.length', 50)

    cy.get('.load-more').click()
    cy.get('.transactions .transaction-box')
      .should('have.length', 75)

    cy.get('h3')
      .should('have.text', '75 of 81 Transactions')
  })
})
