import os
import sys

path = '/home/tbrock/', '/home/tbrock/readrboard'

sys.path.extend(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'readrboard.prod-settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
