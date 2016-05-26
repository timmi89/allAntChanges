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
echo yes | gcloud components update 2> /dev/null
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

curl -X POST --data-urlencode 'payload={"channel": "#build", "username": "webhookbot", "text": "Build '"$VERSION"' deployed to '"$ENVIRONMENT"'. Watch it roll out: http://bit.ly/1Ym6LZH", "icon_emoji": ":docker:"}' https://hooks.slack.com/services/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
echo
