#! /bin/bash

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

docker build -t gcr.io/antenna-array/antenna:$VERSION .
docker tag -f gcr.io/antenna-array/antenna:$VERSION gcr.io/antenna-array/antenna:latest
gcloud docker push gcr.io/antenna-array/antenna:$VERSION
gcloud docker push gcr.io/antenna-array/antenna:latest
