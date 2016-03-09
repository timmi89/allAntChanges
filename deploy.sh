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

kubectl rolling-update antenna-http --image=gcr.io/antenna-array/antenna:$VERSION --update-period=1s
kubectl rolling-update antenna-static-http --image=gcr.io/antenna-array/antenna-static:$VERSION --update-period=1s
