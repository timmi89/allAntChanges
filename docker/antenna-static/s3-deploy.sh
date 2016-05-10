#! /bin/bash
#AWS_ACCESS_KEY_ID
#AWS_SECRET_ACCESS_KEY

set -e

fail () {
  echo $1
  exit 1
}

if [ -z $1 ]; then
  ANTENNA_STATIC_BUCKET=$ANTENNA_STATIC_BUCKET
else
  ANTENNA_STATIC_BUCKET=$1
fi

if [ -z $ANTENNA_STATIC_BUCKET ]; then
  fail 'Bucket must be specified [production, staging]'
fi

# Short term cache
s3cmd sync \
  --acl-public \
  --add-header="Cache-Control:public, max-age=900" \
  --add-header="Expires:Thu, 15 Apr 2020 20:00:00 GMT" \
  --guess-mime-type \
  --exclude="widget-new/lib/*" \
  --exclude="js/cdn/*" \
  rb/static/ s3://$ANTENNA_STATIC_BUCKET/

# Long term cache
s3cmd sync \
  --acl-public \
  --add-header="Cache-Control:public, max-age=31536000" \
  --add-header="Expires:Thu, 15 Apr 2020 20:00:00 GMT" \
  --mime-type="application/javascript" \
  --exclude="*" \
  --include="widget-new/lib/*" \
  --include="js/cdn/*" \
  rb/static/ s3://$ANTENNA_STATIC_BUCKET/
