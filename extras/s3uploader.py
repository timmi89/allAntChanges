#! /usr/bin/env python
import os, sys, boto, mimetypes, zipfile, gzip
from io import StringIO, BytesIO
from optparse import OptionParser
from jsmin import *
from cssmin import *
 
# Boto picks up configuration from the env.
os.environ['AWS_ACCESS_KEY_ID'] = 'AKIAINM2FE35X6K77P2A'
os.environ['AWS_SECRET_ACCESS_KEY'] = '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'
 
# The list of content types to gzip, add more if needed
COMPRESSIBLE = [ 'text/plain', 'text/csv', 'application/xml',
                'application/javascript', 'text/css' ]
 
def main():
    parser = OptionParser(usage='usage: %prog [options] src_folder destination_bucket_name prefix')
    parser.add_option('-x', '--expires', action='store_true', help='set far future expiry for all files')
    parser.add_option('-m', '--minify', action='store_true', help='minify javascript files')
    (options, args) = parser.parse_args()
    if len(args) != 3:
        parser.error("incorrect number of arguments")
    src_folder = os.path.normpath(args[0])
    bucket_name = args[1]
    prefix = args[2]
 
    conn = boto.connect_s3()
    bucket = conn.get_bucket(bucket_name)
 
    namelist = []
    for root, dirs, files in os.walk(src_folder):
        if files and not '.svn' in root:
            path = os.path.relpath(root, src_folder)
            namelist += [os.path.normpath(os.path.join(path, f)) for f in files]
 
    print 'Uploading %d files to bucket %s' % (len(namelist), bucket.name)
    for name in namelist:
        content = open(os.path.join(src_folder, name))
        key = bucket.new_key(os.path.join(prefix, name))
        type, encoding = mimetypes.guess_type(name)
        type = type or 'application/octet-stream'
        headers = { 'Content-Type': type, 'x-amz-acl': 'public-read' }
        states = [type]
 
        if options.expires:
            # We only use HTTP 1.1 headers because they are relative to the time of download
            # instead of being hardcoded.
            headers['Cache-Control'] = 'max-age %d' % (3600 * 24 * 365)
 
        if options.minify and type == 'application/javascript':
            outs = StringIO()
            JavascriptMinify().minify(content, outs)
            content.close()
            content = outs.getvalue()
            if len(content) > 0 and content[0] == '\n':
                content = content[1:]
            content = BytesIO(content)
            states.append('minified')
 
        if options.minify and type == 'text/css':
            outs = cssmin(content.read())
            content.close()
            content = outs
            if len(content) > 0 and content[0] == '\n':
                content = content[1:]
            content = BytesIO(content)
            states.append('minified')
 
        if type in COMPRESSIBLE:
            headers['Content-Encoding'] = 'gzip'
            compressed = StringIO()
            gz = gzip.GzipFile(filename=name, fileobj=compressed, mode='w')
            gz.writelines(content)
            gz.close()
            content.close
            content = BytesIO(compressed.getvalue())
            states.append('gzipped')
 
        states = ', '.join(states)
        print '- %s =&gt; %s (%s)' % (name, key.name, states)
        key.set_contents_from_file(content, headers)
        content.close();
 
if __name__ == '__main__':
    main()
