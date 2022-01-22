describe('transaction page', function() {
  before(() => {
    // Prepare a transaction for inspection
    cy.task('bitcoind:make_tx', { confirmed: true }).as('test_tx').then(test_tx => {
      cy.wait(6000)
      cy.visit(`/tx/${test_tx.txid}`)
    })
  })

  it('displays the transaction info', function() {
    cy.get('.stats-table')
      .should('contain.text', 'Status')
      .should('contain.text', 'Included in Block')
      .should('contain.text', 'Transaction fees')
      .should('contain.text', this.test_tx.block_hash)

    cy.get('.transaction-box .footer')
      .should('contain.text', '1 Confirmation')

    cy.get('.vout-header-container a')
      .contains(this.test_tx.addr)
      .should('exist')

    cy.get('.vout-header-container .amount')
      .contains(`${this.test_tx.amount} rBTC`)
      .should('exist')
  })

  it('can toggle advanced details', () => {
    function check (is_visible) {
      let is_not = is_visible ? '' : 'not.'
      cy.get('.vin .vin-body')
        .should(is_not + 'exist')
      cy.get('.vout .vout-body')
        .should(is_not + 'exist')
      cy.get('.transaction-box')
        .should(is_not + 'contain.text', 'Previous output address')
        .should(is_not + 'contain.text', 'scriptPubKey (asm)')
    }

    check(false)
    cy.get('.details-btn').click()
    check(true)
    cy.get('.details-btn').click()
    check(false)
  })
})