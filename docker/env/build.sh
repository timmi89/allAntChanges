#! /bin/bash

set -e

fail () {
  echo $1
  exit 1
}

if [ -z $1 ]; then
  ENVIRONMENT=$ENVIRONMENT
else
  ENVIRONMENT=$1
fi

if [ -z $ENVIRONMENT ]; then
  fail 'environment must be specified'
fi
export ENVIRONMENT

if [ -z $2 ]; then
  IMAGE=$IMAGE
else
  IMAGE=$2
fi
export IMAGE

if [ -z $IMAGE ]; then
  fail 'image must be specified'
fi

if [ -z $3 ]; then
  VERSION=$VERSION
else
  VERSION=$3
fi
export VERSION

if [ -z $VERSION ]; then
  fail 'version must be specified'
fi

echo Building ${IMAGE}-${ENVIRONMENT}:$VERSION
docker/env/template.sh docker/env/Dockerfile.template | \
  docker build -qt ${IMAGE}-${ENVIRONMENT}:$VERSION -
echo Pushing ${IMAGE}-${ENVIRONMENT}:$VERSION
gcloud docker push ${IMAGE}-${ENVIRONMENT}:$VERSION | grep digest
