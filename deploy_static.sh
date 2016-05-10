#! /bin/bash

set -e

cd "${0%/*}"

fail () {
  echo $1
  exit 1
}

if [ -z $1 ]; then
  fail 'Environment must be specified [production, staging]'
else
  ENVIRONMENT=$1
fi

if [ $2 == "VERSION" ]; then
  VERSION=`cat VERSION`
else
  VERSION=$2
fi

if [ -z $VERSION ]; then
  fail 'Version must be specified'
fi

if [ -x /usr/bin/codeship_google ]; then
  /usr/bin/codeship_google authenticate
fi

echo yes | gcloud components update
gcloud config set compute/zone us-central1-f
gcloud container clusters get-credentials "antenna-$ENVIRONMENT"

docker/env/cmd.sh s3-deploy "['./docker/node/s3-deploy.sh']" gcr.io/antenna-array/antenna-static-$ENVIRONMENT $VERSION
