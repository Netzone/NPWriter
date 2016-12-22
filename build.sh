#!/usr/bin/env bash

OLD_DIR=`pwd`

rm -rf dist
rm -rf node_modules

echo Installing dependencies
npm install

echo Running tests
npm run build-substance
npm run test


if [[ $? -ne 0 ]]; then
  echo "Tests failed"
  exit 1
fi

echo Running build for production
npm run build


if [[ $? -ne 0 ]]; then
  echo "Build failed"
  exit 1
fi

echo Copying docker files

cp -f ./docker/* dist

echo Creating versions file

echo "{\"Writer\": \"#$(git rev-parse --short HEAD)\"}" > dist/versions.json

