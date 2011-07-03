from settings import *

DEBUG = False

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
