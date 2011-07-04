from settings import *

#DEBUG = False

FACEBOOK_APP_ID = '186217208100982'
FACEBOOK_APP_SECRET = 'f285b17e71770615189e7676c1d7d0f9'

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
