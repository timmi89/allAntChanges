# Google Container Engine

## Setup

See google cloud docs for more details
 - https://cloud.google.com/sdk/#Quick_Start
 - https://cloud.google.com/container-engine/docs/before-you-begin

```sh
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Login to Google and install kubectl
gcloud init
gcloud components update kubectl

# Configure to use the test cluster
gcloud config set project antenna-array
gcloud config set compute/zone us-central1-f
gcloud config set container/cluster antenna-staging
gcloud container clusters get-credentials antenna-staging
```

## Create

### Secrets

Create secrets LastPass Secure Notes

```sh
lpass show --note "Shared-Infrastructure/Staging MySQL SSL Secret" | kubectl create -f -
lpass show --note "Shared-Infrastructure/staging.antenna.is antenna-oauth2-proxy-cfg" | kubectl create -f -
lpass show --note "Shared-Infrastructure/staging.antenna.is mailcatcher-oauth2-proxy-cfg" | kubectl create -f -
```

### Google Container Engine services

```sh
kubectl create -f gke
```

## Update

```sh
VERSION=<the version you are creating>

# Build and push the docker container to container registry
./build.sh $VERSION

# Rolling update to the new image
./deploy.sh staging $VERSION
./deploy_static.sh staging $VERSION
```

## Upgrade Node Pool

Create a new Node Pool for the new version

```sh
NAME=v1-2-4
CLUSTER=antenna-production
gcloud container node-pools create $NAME --cluster $CLUSTER --zone us-central1-f --disk-size 100 --machine-type n1-standard-4 --scopes bigquery,compute-rw,storage-full,logging-write,monitoring,sql-admin,taskqueue

INSTANCE_GROUP=$(gcloud compute instance-groups managed list --regexp ".*$CLUSTER-$NAME.*" | tail -n 1 | cut -f 1 -d' ')
gcloud compute instance-groups managed set-autoscaling $INSTANCE_GROUP --zone us-central1-f --max-num-replicas 25 --min-num-replicas 3 --scale-based-on-cpu --target-cpu-utilization .70
```

Wait a moment for things to stabilize and then delete the old Node Pool

```sh
OLD_NAME=v1-2-3
CLUSTER=antenna-production

for node in $(kubectl get nodes -o name | grep "$CLUSTER-$OLD_NAME"); do
  kubectl drain $node --ignore-daemonsets
done

gcloud container node-pools delete $OLD_NAME --cluster $CLUSTER --zone us-central1-f --wait
```
