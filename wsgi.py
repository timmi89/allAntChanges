import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'antenna.settings'

import django.core.handlers.wsgi
from dj_static import Cling

application = Cling(django.core.handlers.wsgi.WSGIHandler())
