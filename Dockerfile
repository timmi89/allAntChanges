FROM python:2.7.11

ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE antenna.settings

RUN mkdir -p /code/antenna
WORKDIR /code/antenna
ENV PYTHONPATH=/code

ADD requirements.txt /code/antenna/requirements.txt
RUN pip install http://effbot.org/downloads/Imaging-1.1.7.tar.gz
RUN pip install -r requirements.txt
ADD . /code/antenna
ADD VERSION /VERSION

EXPOSE 8000
CMD gunicorn --preload -b 0.0.0.0:8000 -w 1 antenna.wsgi
