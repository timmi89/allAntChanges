import os
import sys

path = '/home/readrboard', '/home/readrboard/readrboard'

sys.path.extend(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'readrboard.settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
