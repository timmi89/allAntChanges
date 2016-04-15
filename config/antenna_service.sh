#!/bin/bash
# This is for Green Unicorn
set -e
NUM_WORKERS=8
LOGFILE=/home/broadcaster/antenna/logs/gunicorn.log

# user/group to run as
USER=broadcaster
GROUP=broadcaster
cd /home/broadcaster/antenna/
exec /usr/local/bin/gunicorn_django -w $NUM_WORKERS --worker-class eventlet --max-requests=2500 --user=$USER --group=$GROUP --log-level=WARN --log-file=$LOGFILE 2>>$LOGFILE