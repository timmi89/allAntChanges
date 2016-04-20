#! /bin/bash

set -e

NPM=`realpath ./grunt/tmp_npm.sh`

pushd grunt/website
if $DEBUG; then
  $NPM install
fi

grunt default

if $DEBUG; then
  grunt watch &
fi
popd

pushd grunt/widget-new
if $DEBUG; then
  $NPM install
fi

grunt default

if $DEBUG; then
  grunt monitor &
fi
popd
