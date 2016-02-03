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

### MySQL SSL Secrets

Create mysql-ssl-secret from LastPass Secure Note `Shared-Infrastructure/Staging MySQL SSL Secret`

```sh
lpass show --note "Shared-Infrastructure/Staging MySQL SSL Secret" | kubectl create -f -
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
./deploy.sh $VERSION
```
