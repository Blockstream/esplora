#!/bin/bash

export SITE_TITLE='Bitcoin Explorer'
export DEST=${DEST:-dist/bitcoin-mainnet}

export MENU_ACTIVE='Bitcoin'
export BASE_HREF='/'

source flavors/common-envs.sh

npm run dist
