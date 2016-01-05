FROM python:2.7.11

ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE antenna.settings

RUN mkdir -p /code/antenna
WORKDIR /code/antenna

ADD requirements.txt /code/antenna/requirements.txt
RUN pip install -r requirements.txt
ADD . /code/antenna

EXPOSE 8000
CMD gunicorn --preload -b 0.0.0.0:8000 -w 1 antenna.wsgi
