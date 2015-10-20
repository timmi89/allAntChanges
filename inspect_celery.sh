#!/bin/bash
DATE=`date +%Y%m%d%H%M%S`
cd /home/broadcaster/antenna/
echo 'STATS'
./manage.py celery inspect stats > celery.stats.log.$DATE
echo 'RESERVED'
./manage.py celery inspect reserved > celery.reserved.log.$DATE
echo 'ACTIVE'
./manage.py celery inspect active > celery.active.log.$DATE
echo 'CONF'
./manage.py celery inspect conf > celery.conf.log.$DATE
echo 'STATUS'
./manage.py celery status >> celery.conf.log.$DATE

