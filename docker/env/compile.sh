#! /bin/bash

set -e

fail () {
  echo $1
  exit 1
}

if [ -z $1 ]; then
  fail 'Environment must be specified [production, staging]'
else
  ENVIRONMENT=$1
fi

if [ -z $2 ]; then
  fail 'Image must be specified'
else
  IMAGE=$2
fi

if [ $3 == "VERSION" ]; then
  VERSION=`cat VERSION`
else
  VERSION=$3
fi

if [ -z $VERSION ]; then
  fail 'Version must be specified'
fi

echo Compiling static assets for $ENVIRONMENT
. docker/env/${ENVIRONMENT}.env

echo ANTENNA_URL == $ANTENNA_URL
grunt/compile.sh
