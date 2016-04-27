#! /bin/bash

apt-get update
apt-get install -y mysql-client pv time

date
echo 'doing dump'
mysqldump -S /sql/hosts/antenna-array:us-central1:antenna-production-dba -uroot -proot --add-drop-database --master-data=2 --single-transaction --databases readrboard | pv > db_dump.sql
date
echo 'dump complete, loading'
pv db_dump.sql | mysql -S /sql/hosts/antenna-array:us-central1:antenna-staging -uroot -proot
date
echo 'done'
echo
