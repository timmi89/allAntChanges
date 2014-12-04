ARRAY="array1 array2 array3 array4 array5 array6 array7 array8"
UTIL="util1"

BASIC='source .profile; ssh-add .ssh/id_rsa_git; cd antenna; git pull origin master;'
FULL='source .profile; ssh-add .ssh/id_rsa_git; cd antenna; git pull origin master; ./manage.py collectstatic;./manage.py migrate rb; ./manage.py migrate chronos; ./manage.py migrate analytics;'

SUPER='supervisorctl restart antenna'
NGINX='service nginx restart'


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
