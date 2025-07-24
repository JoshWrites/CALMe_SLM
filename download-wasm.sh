#!/bin/bash

echo "Downloading ONNX Runtime WebAssembly files..."

cd docs/lib

# Try to detect version from the JS file first
ONNX_VERSION=$(grep -oP 'onnxruntime-web@[0-9.]+' onnxruntime-web.min.js | head -1 | cut -d'@' -f2 || echo "1.16.3")

if [ -z "$ONNX_VERSION" ]; then
    ONNX_VERSION="1.16.3"  # Fallback to latest stable
fi

echo "Detected ONNX Runtime version: ${ONNX_VERSION}"

BASE_URL="https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_VERSION}/dist"

# Download WASM files
echo "Downloading ort-wasm.wasm..."
curl -L "${BASE_URL}/ort-wasm.wasm" -o ort-wasm.wasm

echo "Downloading ort-wasm-simd.wasm..."
curl -L "${BASE_URL}/ort-wasm-simd.wasm" -o ort-wasm-simd.wasm

echo "Downloading ort-wasm-threaded.wasm..."
curl -L "${BASE_URL}/ort-wasm-threaded.wasm" -o ort-wasm-threaded.wasm

echo "Downloading ort-wasm-simd-threaded.wasm..."
curl -L "${BASE_URL}/ort-wasm-simd-threaded.wasm" -o ort-wasm-simd-threaded.wasm

echo "WASM files downloaded successfully!"
ls -la *.wasm