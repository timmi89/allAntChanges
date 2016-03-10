#! /bin/bash

set -e

./grunt/compile.sh

./grunt/website/node_modules/.bin/static-server -p 8081 ./rb/static
