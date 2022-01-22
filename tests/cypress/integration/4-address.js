describe('address page', function() {
  before(() => {
    // Prepare an address for testing
    cy.task('bitcoind:newaddr').as('test_addr').then(test_addr => {
      cy.task('bitcoind:sendto', { addr: test_addr, amount: 0.1 }).as('test_txid1')
      cy.task('bitcoind:sendto', { addr: test_addr, amount: 0.2 }).as('test_txid2')
      cy.task('bitcoind:mine')
      cy.task('bitcoind:sendto', { addr: test_addr, amount: 0.4 }).as('test_txid3')
      cy.wait(6000)
      cy.visit(`/address/${test_addr}`)
    })
  })

  it('displays the address stats', function() {
    cy.get('.stats-table')
      .contains('> div', 'Confirmed received')
      .find('div:eq(1)')
      .should('have.text', '2 outputs (0.3 rBTC)')

    cy.get('.stats-table')
      .contains('> div', 'Unconfirmed received')
      .find('div:eq(1)')
      .should('have.text', '1 output (0.4 rBTC)')

    cy.get('.stats-table')
      .contains('> div', 'Total unspent')
      .find('div:eq(1)')
      .should('have.text', '3 outputs (0.7 rBTC)')
  })

  it('displays the address historical transactions', function(){
    cy.get('.transactions .transaction-box')
      .should('have.length', 3)

    ;[ [this.test_txid1,0.1], [this.test_txid2,0.2], [this.test_txid3,0.4] ].forEach(([txid, amount]) => {
      cy.contains('.transaction-box', txid)
        .should('exist')

        .contains('.vout', this.test_addr)
        .should('have.class', 'active')

        .find('.amount')
        .should('have.text', `${amount} rBTC`)
    })
  })

  after(() => cy.task('bitcoind:mine'))
})