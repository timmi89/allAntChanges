#! /bin/bash

set -e

fail () {
  echo $1
  exit 1
}

if [ -z $1 ]; then
  fail 'Name must be specified'
else
  export NAME=$1
fi

if [ -z "$2" ]; then
  fail 'Command must be specified'
else
  export COMMAND=$2
fi

if [ -z $3 ]; then
  IMAGE=$IMAGE
else
  IMAGE=$3
fi

if [ -z $IMAGE ]; then
  fail 'Image must be specified'
fi
export IMAGE

if [ "$4" == "VERSION" ]; then
  VERSION=`cat VERSION`
else if [ -z $4 ]; then
  VERSION=$VERSION
else
  VERSION=$4
fi;fi

if [ -z $VERSION ]; then
  fail 'Version must be specified'
fi
export VERSION

echo Running command $COMMAND with name $NAME on $IMAGE:$VERSION

docker/env/template.sh gke/antenna-cmd.yml.template | kubectl apply -f -

pod_name=`kubectl get pods -a -l job-name=antenna-cmd-$NAME -o jsonpath='{.items[*].metadata.name}'`
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

kubectl delete job antenna-cmd-$NAME
