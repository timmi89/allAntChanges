#!/bin/bash

ps aux | grep celeryd | awk '{print $2}' | xargs kill -9; ps aux | grep celerybeat | awk '{print $2}' | xargs kill -9
echo 'Killed celeryd and celerybeat'
nohup ./manage.py celerybeat --loglevel=info &
echo 'Restarting celerybeat'
nohup ./manage.py celeryd --loglevel=info --concurrency=10 &
#nohup ./manage.py celeryd --loglevel=info &
echo 'Restarting celeryd'