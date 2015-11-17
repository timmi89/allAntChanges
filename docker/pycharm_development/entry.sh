#! /bin/bash

export -p > /root/.profile
echo "cd /code/antenna" >> /root/.profile

exec "$@"
