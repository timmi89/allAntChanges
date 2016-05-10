#! /bin/bash
set -e

fail () {
  echo $1
  exit 1
}

if [ -z $1 ]; then
  FILE=$FILE
else
  FILE=$1
fi

if [ -z $FILE ]; then
  fail 'file must be specified'
fi

sed -e "s|{{ENVIRONMENT}}|$ENVIRONMENT|" \
    -e "s|{{NAME}}|$NAME|" \
    -e "s|{{COMMAND}}|$COMMAND|" \
    -e "s|{{IMAGE}}|$IMAGE|" \
    -e "s|{{VERSION}}|$VERSION|" \
    $FILE
