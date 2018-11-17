#!/bin/bash

export SITE_TITLE='Bitcoin Testnet Explorer'
export DEST=${DEST:-dist/bitcoin-testnet}
export NATIVE_ASSET_LABEL=tBTC

export MENU_ACTIVE='Bitcoin Testnet'
export BASE_HREF='/testnet/'
export API_URL="${BASE_HREF}api"
source flavors/common-envs.sh

npm run dist

cp flavors/bitcoin-testnet-logo.svg $DEST/img/icons/menu-logo.svg
cp flavors/search_testnet.svg $DEST/img/icons/search.svg
cp flavors/bitcoin-testnet_block.svg $DEST/img/block.svg
cp flavors/minus_testnet.svg $DEST/img/icons/minus.svg
cp flavors/plus_testnet.svg $DEST/img/icons/plus.svg
cp flavors/transaction_testnet.svg $DEST/img/transaction.svg
cat flavors/bitcoin-testnet.css >> $DEST/style.css
