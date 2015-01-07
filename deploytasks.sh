ARRAY="array1 array2 array3 array4 array5 array6 array7 array8 array9 array10 array11 array12 array13 array14"
UTIL="util1"
DBS="rbprod rbslave1 dbslave2"
EVENTS="events2 events3 events4 events5 events6 events7 events8 events9"

BASIC='source .profile; ssh-add .ssh/id_rsa_git; cd antenna; git pull origin master;'
FULL='source .profile; ssh-add .ssh/id_rsa_git; cd antenna; git pull origin master; ./manage.py collectstatic;./manage.py migrate rb; ./manage.py migrate chronos; ./manage.py migrate analytics;'

SUPER='supervisorctl restart antenna; service nginx restart'
NGINX='service nginx restart'
DBRESTART='service mysql restart'

TEST='touch testfile;'

foreach() {
    local host
    for host in $1 ; do echo -n "$host - ";  eval $3 ; done
}

foreach_exec_root() {
    local host
    for host in $1 ; do echo -n "$host - "; eval "echo \"$3\"" | ssh root@$host /bin/bash ; done
}

foreach_exec_broadcaster() {
    local host
    for host in $1 ; do echo -n "$host - "; eval "echo \"$3\"" | ssh broadcaster@$host /bin/bash ; done
}
