ARRAY="array-1 array-2 array-4 array-5 array-6 array-7 array-8 array-9 array-10 array-11 array-12 array-13 array-14 array-15 array-16 array-17 array-18 array-19 array-20 array-21 array-22 array-23 array-24"
UTIL="utility-1"
DBS="db-proto-1 db-proto-2 db-proto-3"
EVENTS="events2 events3 events4 events5 events6 events7 events8 events9"
CACHES="cache-1 cache-2"

#These do not work without external IP to talk to git
#BASIC='source .profile; ssh-add .ssh/id_rsa_git; cd antenna; git pull origin google;'
#FULL='source .profile; ssh-add .ssh/id_rsa_git; cd antenna; git pull origin google; ./manage.py collectstatic;./manage.py migrate rb; ./manage.py migrate chronos; ./manage.py migrate analytics;'

SUPER='supervisorctl restart antenna; cp /home/broadcaster/antenna/config/antenna_nginx.conf /etc/nginx/conf.d/ ; service nginx restart'
#SUPER='supervisorctl restart antenna; service nginx restart'
NGINX='service nginx restart'
DBRESTART='service mysql restart'

TEST='touch testfile;'

#UTIL can update and push
#PUSHSYNC='rsync -qlor --exclude "logs/*"  --exclude "nohup.out" /home/broadcaster/antenna broadcaster@array-2:/home/broadcaster/'

push_sync() {
    local host
    for host in $1 ; do
        echo -n "$host - ";
        rsync -qlor --exclude ".git/*" --exclude "rb/static/grunt/*" --exclude "logs/*"  --exclude "nohup.out" /home/broadcaster/antenna broadcaster@$host:/home/broadcaster/ &
    done
    wait
}

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
