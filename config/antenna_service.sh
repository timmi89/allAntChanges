#!/bin/bash
# This is for Green Unicorn
set -e
NUM_WORKERS=8
LOGFILE=/home/broadcaster/antenna/logs/gunicorn.log

# user/group to run as
USER=broadcaster
GROUP=broadcaster
cd /home/broadcaster/antenna/
exec /usr/local/bin/gunicorn_django -w $NUM_WORKERS --max-requests=200 --user=$USER --group=$GROUP --log-level=WARN --log-file=$LOGFILE 2>>$LOGFILE