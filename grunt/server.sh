#! /bin/bash

set -e

NPM=`realpath ./grunt/tmp_npm.sh`

pushd grunt/website
if $DEBUG; then
  $NPM install
fi

grunt

if $DEBUG; then
  grunt watch &
fi
popd

pushd grunt/widget-new
if $DEBUG; then
  $NPM install
fi

grunt

if $DEBUG; then
  grunt watch &
fi
popd

./grunt/website/node_modules/.bin/static-server -p 8081 ./rb/static
