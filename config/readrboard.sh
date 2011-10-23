#!/bin/bash
# This is for Green Unicorn
set -e
NUM_WORKERS=2
LOGFILE=/home/readrboard/readrboard/logs/gunicorn.log

# user/group to run as
USER=readrboard
GROUP=readrboard
cd /home/readrboard/readrboard/
exec /usr/local/bin/gunicorn_django -w $NUM_WORKERS --user=$USER --group=$GROUP --log-level=debug --log-file=$LOGFILE 2>>$LOGFILE