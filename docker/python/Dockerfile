FROM python:2.7.11
ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE antenna.settings
RUN mkdir -p /code/antenna

RUN apt-get update &&\
    apt-get install -y mysql-client

WORKDIR /code/antenna
