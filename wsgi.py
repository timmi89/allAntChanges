import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'antenna.settings'

from django.core.wsgi import get_wsgi_application
from whitenoise import WhiteNoise

directory = os.path.dirname(os.path.abspath(__file__))

application = WhiteNoise(
    get_wsgi_application(),
    root=os.path.join(directory, 'rb/static'),
    prefix='/static/'
)
