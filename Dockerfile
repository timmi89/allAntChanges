FROM python:2.7.11

# Update MySQL libs
ADD docker/apt/mysql.list /etc/apt/sources.list.d/mysql.list
RUN apt-key adv --keyserver pgp.mit.edu --recv-keys 5072E1F5 && \
    apt-get update && apt-get install -y lsb-release && \
    apt-get upgrade -y mysql-client mysql-connector-python-cext && \
    apt-get autoremove -y

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
CMD exec gunicorn --preload -b 0.0.0.0:8000 -w 1 --access-logfile - --log-file - antenna.wsgi
