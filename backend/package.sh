#!/usr/bin/env bash
set -euo pipefail

# Move to the script's directory (backend/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "=========================================="
echo " Packaging AWS Lambda Function"
echo "=========================================="

# 1. Run unit test suite before packaging
echo "--> Running unit tests..."
python3 test_lambda.py

# 2. Clean previous build artifact
PACKAGE_ZIP="lambda_function.zip"
if [ -f "${PACKAGE_ZIP}" ]; then
    echo "--> Removing existing ${PACKAGE_ZIP}..."
    rm -f "${PACKAGE_ZIP}"
fi

# 3. Create zip archive containing lambda_function.py
echo "--> Creating ${PACKAGE_ZIP}..."
zip -q "${PACKAGE_ZIP}" lambda_function.py

# 4. Verify package contents
echo "--> Package created successfully:"
ls -lh "${PACKAGE_ZIP}"
unzip -l "${PACKAGE_ZIP}"

echo "=========================================="
echo " Lambda package ready at: ${SCRIPT_DIR}/${PACKAGE_ZIP}"
echo "=========================================="

