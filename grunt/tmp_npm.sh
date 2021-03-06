#!/bin/bash
# From https://gist.github.com/kevinastone/8790717

BASE_DIR=${TMPDIR:-/var/tmp}
ORIG_DIR=$PWD
HASH_CMD="md5sum"

DIR_NAME=`echo $PWD | $HASH_CMD | cut -f1 -d " "`

TMP_DIR=$BASE_DIR/$DIR_NAME
mkdir -p $TMP_DIR

pushd $TMP_DIR

mkdir -p $ORIG_DIR/node_modules
rsync --recursive --links --times $ORIG_DIR/node_modules ./
ln -sf $ORIG_DIR/package.json
npm $1

# Can't use archive mode cause of the permissions
rsync --recursive --links node_modules $ORIG_DIR

popd
