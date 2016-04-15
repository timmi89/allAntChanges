#!/bin/bash
# This is for Green Unicorn
set -e
NUM_WORKERS=8
LOGFILE=/home/tbrock/readrboard/logs/gunicorn.log

# user/group to run as
USER=tbrock
GROUP=tbrock
cd /home/tbrock/readrboard/
exec /usr/local/bin/gunicorn_django -w $NUM_WORKERS --max-requests=2000 --user=$USER --group=$GROUP --log-level=WARN --log-file=$LOGFILE 2>>$LOGFILE