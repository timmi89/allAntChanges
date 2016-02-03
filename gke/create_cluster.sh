#! /bin/bash

fail () {
  echo $1
  exit 1
}

if [ -z $1 ]; then
  fail 'must specify cluster name'
else
  NAME=$1
fi

# Change to script directory
cd "$( dirname "${BASH_SOURCE[0]}" )"

# Create cluster
gcloud container clusters create $NAME --wait \
  --zone us-central1-f \
  --num-nodes 1 \
  --machine-type n1-standard-4 \
  --scopes sql,taskqueue,bigquery,compute-ro,storage-full,logging-write,monitoring

# Install Kubedash
curl https://raw.githubusercontent.com/kubernetes/kubedash/master/deploy/kube-config.yaml | kubectl create -f -

# Set autoscaller for kubernetes cluster
group_url=`gcloud container clusters describe $NAME --format yaml | grep -A 1 instanceGroupUrls | tail -n 1`
group_name=${group_url##*/}
gcloud compute instance-groups managed set-autoscaling $group_name \
  --max-num-replicas 10 \
  --min-num-replicas 2 \
  --target-cpu-utilization .75

echo
echo 'Connect `kubectl` to' $NAME 'with:'
echo "  gcloud container clusters get-credentials $NAME"
echo

sed -n -e '/^## Create/,/^## /p' README.md | sed '$d'
