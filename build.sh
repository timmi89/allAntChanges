#! /bin/bash

set -e

cd "${0%/*}"

fail () {
  echo $1
  exit 1
}

if [ -z $1 ]; then
  VERSION=`git describe --match "v[0-9]*" --abbrev=0 HEAD`

  if [ -z $CI_BRANCH ]; then
    GIT_BRANCH=`git rev-parse --abbrev-ref HEAD`
  else
    GIT_BRANCH=$CI_BRANCH
  fi

  if [ $CI_BRANCH != "master" ]; then
    VERSION=$GIT_BRANCH-$VERSION
  fi
else
  VERSION=$1
fi

if [ -z $VERSION ]; then
  fail 'version must be specified'
fi

if ! git diff --quiet HEAD; then
  fail 'uncommitted changes'
fi

git_sha=`git rev-parse --short HEAD`
iso_8601=`date -u +"%Y%m%dT%H%M%SZ"`

VERSION=$VERSION-$iso_8601-$git_sha

# [branch-]version-date-git_sha
echo $VERSION > ./VERSION

if [ -x /usr/bin/codeship_google ]; then
  /usr/bin/codeship_google authenticate
fi

docker build -qt gcr.io/antenna-array/antenna:$VERSION .
docker tag gcr.io/antenna-array/antenna:$VERSION gcr.io/antenna-array/antenna:latest
gcloud docker push gcr.io/antenna-array/antenna:$VERSION
gcloud docker push gcr.io/antenna-array/antenna:latest

docker build -qt gcr.io/antenna-array/antenna-static:$VERSION -f docker/antenna-static/Dockerfile .
docker tag gcr.io/antenna-array/antenna-static:$VERSION gcr.io/antenna-array/antenna-static:latest
gcloud docker push gcr.io/antenna-array/antenna-static:$VERSION
gcloud docker push gcr.io/antenna-array/antenna-static:latest

echo ./deploy.sh staging $VERSION '&&' ./deploy_static.sh staging $VERSION
