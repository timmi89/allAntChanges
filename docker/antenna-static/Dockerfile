FROM node:5.7

RUN apt-get update &&\
    apt-get install -y rsync ruby &&\
    gem install sass &&\
    npm install -g grunt-cli

RUN mkdir -p /code/antenna
ADD ./ /code/antenna
WORKDIR /code/antenna

RUN cd /code/antenna/grunt/website &&\
    npm install
RUN cd /code/antenna/grunt/widget-new &&\
    npm install

ADD VERSION /VERSION

EXPOSE 8081
CMD ./grunt/server.sh
