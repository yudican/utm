#!/bin/bash
V=$(cat .version)

echo $V " BUILD"
yarn
if [ "$V" == "PRODUCTION" ]; then
    yarn build:prod;
else
    yarn build:dev;
fi

echo "cleaning node_modules universe"
rm -rf node_modules/


