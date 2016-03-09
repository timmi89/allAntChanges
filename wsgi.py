import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'antenna.settings'

from django.core.wsgi import get_wsgi_application
from dj_static import Cling

application = Cling(get_wsgi_application())
