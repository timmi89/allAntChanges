from settings import *

DEBUG = False

FACEBOOK_APP_ID = '163759626987948'
FACEBOOK_APP_SECRET = 'f14061a2ed9d7ae8ed1c3b231a8148c9'

DATABASES = {
  'default': {
    'ENGINE':   'django.db.backends.mysql',
    'NAME':     'readrboard',
    'USER':     'root',
    'PASSWORD': '',
    'HOST':     'localhost',
    'PORT':     '3306',
    }
}

BASE_URL = 'http://dev.readrboard.com'
STATIC_URL = BASE_URL + '/static/'