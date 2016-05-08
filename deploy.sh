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

if [ -z $2 ]; then
  fail 'Version must be specified'
else
  VERSION=$2
fi

if [ -x /usr/bin/codeship_google ]; then
  /usr/bin/codeship_google authenticate
fi

gcloud container clusters get-credentials "antenna-$ENVIRONMENT"

for name in antenna-http antenna-celery antenna-celerybeat; do
  patch="---
spec:
  template:
    spec:
      containers:
        - name: $name
          image: gcr.io/antenna-array/antenna:$VERSION
"

  kubectl patch deployment/$name -p "$patch"
done
