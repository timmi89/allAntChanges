FROM node:5.7
RUN mkdir -p /code/antenna

RUN apt-get update &&\
    apt-get install -y rsync s3cmd ruby &&\
    gem install sass &&\
    npm install -g grunt-cli

WORKDIR /code/antenna
