#! /bin/bash

apt-get update
apt-get install -y mysql-client

mysqldump -h 10.240.245.89 -uantenna-array -pr34drsl4v3 --add-drop-database --master-data=2 --single-transaction --databases readrboard > db_dump.sql
mysql -h $DATABASE_HOST_MASTER -uantenna-array -pr34drsl4v3 --ssl --ssl-key $DATABASE_SSL_MASTER_CLIENT_KEY --ssl-cert $DATABASE_SSL_MASTER_CLIENT_CERT --ssl-ca $DATABASE_SSL_MASTER_SERVER_CA < db_dump.sql
