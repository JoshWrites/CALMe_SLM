#!/bin/bash

echo "Downloading ONNX Runtime WebAssembly files..."

cd docs/lib

# ONNX Runtime version 1.14.0 WASM files
ONNX_VERSION="1.14.0"
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