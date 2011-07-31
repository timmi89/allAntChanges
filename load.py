#!/usr/bin/env python
import sys
import re
from django.utils.encoding import smart_unicode
from rb.models import Group

if len(sys.argv) == 2:
    file_with_newlines = open(sys.argv[1], 'r')
    bad_words = u''
    count = 0
    for line in file_with_newlines:
        stripped_line = line.strip()
        escaped_line = re.escape(stripped_line)
        bad_words += smart_unicode(escaped_line +',')

    group = Group.objects.get(id=2)
    group.word_blacklist = bad_words
    group.save()
