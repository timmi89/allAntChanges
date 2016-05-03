#! /bin/bash

set -e

fail () {
  echo $1
  exit 1
}

if [ -z $1 ]; then
  fail 'version must be specified'
else
  VERSION=$1
fi

if ! git diff --quiet HEAD; then
  fail 'uncommitted changes'
fi

git_sha=`git rev-parse --short HEAD`
iso_8601=`date -u +"%Y%m%dT%H%M%SZ"`

echo "$VERSION-$iso_8601-$git_sha" > ./VERSION

docker build -t gcr.io/antenna-array/antenna:$VERSION .
docker tag gcr.io/antenna-array/antenna:$VERSION gcr.io/antenna-array/antenna:latest
gcloud docker push gcr.io/antenna-array/antenna:$VERSION
gcloud docker push gcr.io/antenna-array/antenna:latest

docker build -t gcr.io/antenna-array/antenna-static:$VERSION -f docker/antenna-static/Dockerfile .
docker tag gcr.io/antenna-array/antenna-static:$VERSION gcr.io/antenna-array/antenna-static:latest
gcloud docker push gcr.io/antenna-array/antenna-static:$VERSION
gcloud docker push gcr.io/antenna-array/antenna-static:latest
