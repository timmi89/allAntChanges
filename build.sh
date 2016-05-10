#! /bin/bash

export IMAGE=gcr.io/antenna-array/antenna
export STATIC_IMAGE=gcr.io/antenna-array/antenna-static

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

  if [ $CI_BRANCH != "master" ] && [ $CI_BRANCH != $VERSION ]; then
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

echo Building $IMAGE:$VERSION
docker build -qt $IMAGE:$VERSION .
docker tag $IMAGE:$VERSION $IMAGE:latest
echo Pushing $IMAGE:$VERSION
gcloud docker push $IMAGE:$VERSION | grep digest
gcloud docker push $IMAGE:latest | grep digest

echo Building $STATIC_IMAGE:$VERSION
docker build -qt $STATIC_IMAGE:$VERSION -f docker/antenna-static/Dockerfile .
docker tag $STATIC_IMAGE:$VERSION $STATIC_IMAGE:latest
echo Pushing $STATIC_IMAGE:$VERSION
gcloud docker push $STATIC_IMAGE:$VERSION | grep digest
gcloud docker push $STATIC_IMAGE:latest | grep digest

if [ $CI_BRANCH == "master" ]; then
  export VERSION

  time ./docker/env/build.sh staging $IMAGE $VERSION
  time ./docker/env/build.sh staging $STATIC_IMAGE $VERSION
  time ./docker/env/build.sh production $IMAGE $VERSION
  time ./docker/env/build.sh production $STATIC_IMAGE $VERSION
fi

echo ./deploy.sh staging $VERSION '&&' ./deploy_static.sh staging $VERSION
