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

export IMAGE=gcr.io/antenna-array/antenna-$ENVIRONMENT

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

# switch clusters
echo yes | gcloud components update
gcloud config set compute/zone us-central1-f
gcloud container clusters get-credentials "antenna-$ENVIRONMENT"
echo

# migrate
docker/env/cmd.sh migrate "['./manage.py', 'migrate']" $IMAGE $VERSION

# deploy
echo Deploying $IMAGE:$VERSION
for name in antenna-http antenna-celery antenna-celerybeat; do
  patch="---
spec:
  template:
    spec:
      containers:
        - name: $name
          image: $IMAGE:$VERSION
"

  kubectl patch deployment/$name -p "$patch"
done
