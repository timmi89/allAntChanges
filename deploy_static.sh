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

echo yes | gcloud components update 2> /dev/null
gcloud config set compute/zone us-central1-f
gcloud container clusters get-credentials "antenna-$ENVIRONMENT"

docker/env/cmd.sh s3-deploy "['./docker/antenna-static/s3-deploy.sh']" gcr.io/antenna-array/antenna-static-$ENVIRONMENT $VERSION

curl -X POST --data-urlencode 'payload={"channel": "#build", "username": "webhookbot", "text": "Build '"$VERSION"' static files deployed to '"$ENVIRONMENT"'.", "icon_emoji": ":docker:"}' https://hooks.slack.com/services/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
echo
