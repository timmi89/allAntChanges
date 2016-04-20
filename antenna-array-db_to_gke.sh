#! /bin/bash

apt-get update
apt-get install -y mysql-client pv time

date
echo 'doing dump'
mysqldump -h 10.240.245.89 -uantenna-array -pr34drsl4v3 --add-drop-database --master-data=2 --single-transaction --databases readrboard | pv > db_dump.sql
date
echo 'dump complete, loading'
pv db_dump.sql | mysql -h $DATABASE_HOST_MASTER -uantenna-array -pr34drsl4v3 --ssl --ssl-key $DATABASE_SSL_MASTER_CLIENT_KEY --ssl-cert $DATABASE_SSL_MASTER_CLIENT_CERT --ssl-ca $DATABASE_SSL_MASTER_SERVER_CA
date
echo 'done'
echo
echo 'mysqlbinlog -R -h 10.240.245.89 -uantenna-array -pr34drsl4v3 --start-position=$position --base64-output=never --stop-never $binlog | grep -v "SET @@session.pseudo_thread_id" | pv | mysql -h $DATABASE_HOST_MASTER -uantenna-array -pr34drsl4v3 --ssl --ssl-key $DATABASE_SSL_MASTER_CLIENT_KEY --ssl-cert $DATABASE_SSL_MASTER_CLIENT_CERT --ssl-ca $DATABASE_SSL_MASTER_SERVER_CA'
