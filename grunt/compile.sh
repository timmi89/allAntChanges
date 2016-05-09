#! /bin/bash

set -e

NPM=`realpath ./grunt/tmp_npm.sh`

pushd grunt/website
$NPM install

grunt default

if [ "$DEBUG" == "true" ]; then
  grunt watch &
fi
popd

pushd grunt/widget-new
$NPM install

grunt default

if [ "$DEBUG" == "true" ]; then
  grunt monitor &
fi
popd
