#! /bin/bash

set -e

NPM=`realpath ./grunt/tmp_npm.sh`

pushd grunt/website
$NPM install
grunt
grunt watch &
popd

pushd grunt/widget-new
$NPM install
grunt
grunt watch &
popd

./grunt/website/node_modules/.bin/static-server -p 8081 ./rb/static
