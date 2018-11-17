#!/bin/bash

export SITE_TITLE='Liquid Explorer'
export HOME_TITLE='Explorer'
export DEST=${DEST:-dist/liquid-mainnet}
export NATIVE_ASSET_LABEL=L-BTC
export NATIVE_ASSET_ID="6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d"


export MENU_ACTIVE='Liquid'
export BASE_HREF='/liquid/'
export API_URL="${BASE_HREF}api"
source flavors/common-envs.sh

npm run dist

cp flavors/liquid-mainnet-logo.svg $DEST/img/icons/menu-logo.svg
cp flavors/search_liquid.svg $DEST/img/icons/search.svg
cp flavors/liquid_block.svg $DEST/img/block.svg
cp flavors/minus_liquid.svg $DEST/img/icons/minus.svg
cp flavors/plus_liquid.svg $DEST/img/icons/plus.svg
cp flavors/transaction_liquid.svg $DEST/img/transaction.svg
cat flavors/liquid-mainnet.css >> $DEST/style.css
