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

# switch clusters
echo yes | gcloud components update
gcloud config set compute/zone us-central1-f
gcloud container clusters get-credentials "antenna-$ENVIRONMENT"
echo

# migrate
sed "s/{{VERSION}}/$VERSION/" gke/antenna-migrate.yml | kubectl create -f -

pod_name=`kubectl get pods -a -l job-name=antenna-migrate -o jsonpath='{.items[*].metadata.name}'`
while [ `kubectl get pods $pod_name -o jsonpath='{.status.phase}'` == 'Pending' ]; do
  echo Waiting for POD to start
  sleep 1
done

kubectl logs -f $pod_name;
echo POD finished

while [ `kubectl get pods $pod_name -o jsonpath='{.status.phase}'` == 'Running' ]; do
  echo Waiting for POD to shutdown
  sleep 1
done

kubectl get pod $pod_name -o yaml

exit_code=`kubectl get pods $pod_name -o jsonpath='{.status.containerStatuses[*].state.terminated.exitCode}'`
if [ $exit_code != '0' ]; then
  exit $exit_code
fi

kubectl delete job antenna-migrate

# deploy
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
