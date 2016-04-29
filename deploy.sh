#! /bin/bash

set -e

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

gcloud container clusters get-credentials "antenna-$ENVIRONMENT"

for name in antenna-http; do # antenna-celery antenna-celerybeat; do
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

if [ $ENVIRONMENT == "production" ]; then
  # stop docker compose
  docker-compose stop -t 10
  docker-compose kill

  docker-compose -f docker-compose.production.yml run static-production
  docker-compose -f docker-compose.production.yml run web-production ./manage.py collectstatic
else
  patch="---
spec:
  template:
    spec:
      containers:
        - name: antenna-static-http
          image: gcr.io/antenna-array/antenna-static:$VERSION
"

  kubectl patch deployment/antenna-static-http -p "$patch"
fi
