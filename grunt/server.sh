#! /bin/bash

set -e

if [ $DEBUG == "true" ]; then
  ./grunt/compile.sh
fi

./grunt/website/node_modules/.bin/static-server -p 8081 ./rb/static
