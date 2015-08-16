# Django settings for antenna project.
from __future__ import absolute_import
from os import uname

if uname()[1] == "hat" or uname()[1] == 'hat.antenna.is' or uname()[1] == 'blackhat.abastionofsanity' : DEBUG = True
elif uname()[0] == "Linux": DEBUG = False
else: DEBUG = True
# DEBUG=True
if uname()[1].startswith('antenna.array') : ANTENNA_ARRAY = True
else: ANTENNA_ARRAY = False
#if not DEBUG:
#    ANTENNA_ARRAY == uname()[1].startswith('antenna.array')
    
# Server e-mail account
if DEBUG:
    SERVER_EMAIL = "devserver@antenna.is"
else:
    SERVER_EMAIL = "server@antenna.is"

EVENTS_PROJECT_NUMBER = '774436620412'
EVENTS_KEY_FILE = 'ssl/antenna_events.p12'
EVENTS_SERVICE_ACCOUNT_EMAIL = '774436620412-esk3bm6ov5otu9kl49dsjke61b0rpv58@developer.gserviceaccount.com'

# For Amazon web services
AWS_ACCESS_KEY_ID = 'AKIAINM2FE35X6K77P2A'
AWS_SECRET_ACCESS_KEY = '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'

# For S3
AWS_STORAGE_BUCKET_NAME = "readrboard"
AWS_CALLING_FORMAT = ""
AWS_HEADERS = {
    'Expires': 'Thu, 15 Apr 2020 20:00:00 GMT',
    'Cache-Control': 'public, max-age=25200',
}

AWS_DEFAULT_ACL='public-read'
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = True  

# For Facebook
FACEBOOK_APP_ID = '163759626987948'
FACEBOOK_APP_SECRET = '9b7da3d1442f442cec8c25f5bf7ea0d0'

ADMINS = ( 
    ('Porter Bayne', 'porter@readrboard.com'),
    ('Michael Shaw', 'michael@readrboard.com')
)

RB_SOCIAL_ADMINS = [
    'porterbayne@gmail.com',
    'michael@readrboard.com'
]

TEMP_LIMIT_GROUPADMIN_AUTOAPPROVE = 8

STATIC_ROOT = 'rb/static/'

#OTHER_DATACENTER = 'gce.antenna.is'
OTHER_DATACENTER = 'linode.antenna.is'
#OTHER_DATACENTER = 'local.antenna.is:8081'

if DEBUG:
    URL_NO_PROTO = 'local.antenna.is:8081'
    BASE_URL = 'http://local.antenna.is:8081'
    BASE_URL_SECURE = 'https://local.antenna.is:8081'
    # STATIC_URL = '//localhost:8081/static/'
    STATIC_URL = '//local.antenna.is:8081/static/'
    DATABASE_ROUTERS = ['rb.routers.MasterSlaveRouter']
    
    DATABASES = {
        'default': {
          'ENGINE':   'django.db.backends.mysql',
            'NAME':     'readrboard',
            'USER':     'root',
            'PASSWORD': '0bscur31nt3nt',
            'HOST':     'localhost',
            'PORT':     '3306',
            'OPTIONS': {
                "init_command": "SET storage_engine=INNODB",
            }
        },
        'readonly1': {
          'ENGINE':   'django.db.backends.mysql',
            'NAME':     'readrboard',
            'USER':     'root',
            'PASSWORD': '0bscur31nt3nt',
            'HOST':     'localhost',
            'PORT':     '3306',
            'OPTIONS': {
                "init_command": "SET storage_engine=INNODB",
            }
        },
        'readonly2': {
          'ENGINE':   'django.db.backends.mysql',
            'NAME':     'readrboard',
            'USER':     'root',
            'PASSWORD': '0bscur31nt3nt',
            'HOST':     'localhost',
            'PORT':     '3306',
            'OPTIONS': {
                "init_command": "SET storage_engine=INNODB",
            }
        }
    }
    # To use sqlite instead of mysql, uncomment this block and comment the one above.
    # DATABASES = {
    #   'default': {
    #       'ENGINE':   'django.db.backends.sqlite3',
    #       'NAME':     'readrdb.db',
    #       'USER':     '',
    #       'PASSWORD': '',
    #       'HOST':     '',
    #       'PORT':     '',
    #     },
    #   'readonly1': {
    #       'ENGINE':   'django.db.backends.sqlite3',
    #       'NAME':     'readrdb.db',
    #       'USER':     '',
    #       'PASSWORD': '',
    #       'HOST':     '',
    #       'PORT':     '',
    #     },
    #   'readonly2': {
    #       'ENGINE':   'django.db.backends.sqlite3',
    #       'NAME':     'readrdb.db',
    #       'USER':     '',
    #       'PASSWORD': '',
    #       'HOST':     '',
    #       'PORT':     '',
    #     },
    #     'slave1': {
    #       'ENGINE':   'django.db.backends.sqlite3',
    #       'NAME':     'readrdb.db',
    #       'USER':     '',
    #       'PASSWORD': '',
    #       'HOST':     '',
    #       'PORT':     '',
    #     }
    # }
    # CACHES = {
    #      'default': {
    #          'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    #          'LOCATION': 'readr.cache',
    #          'TIMEOUT':60
    #     }
    # }
    CACHES = {
            'default': {
                #'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
                 'BACKEND': 'memcachepool.cache.UMemcacheCache',
                 'LOCATION': '127.0.0.1:11211',
                 'TIMEOUT':86400,
                 'OPTIONS': {
                     'MAX_POOL_SIZE': 100,
                     'BLACKLIST_TIME': 20,
                     'SOCKET_TIMEOUT': 5,
                     'MAX_ITEM_SIZE': 1000*100,
                 }
            },
            'redundant': {
                'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
            },
            'query_cache': {
                'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
                # 'BACKEND': 'johnny.backends.memcached.MemcachedCache',
                # 'LOCATION': ['127.0.0.1:11211'],
                # 'TIMEOUT':86400,
                # 'JOHNNY_CACHE':True,
            }
        }
    BROKER_URL = "amqp://broadcast:51gn4l5@localhost:5672/antenna_broker"

else:
    ALLOWED_HOSTS = ["linode.antenna.is", "gce.antenna.is","www.antenna.is","antenna.is","static.antenna.is","www.readrboard.com","readrboard.com","static.readrboard.com"]
    URL_NO_PROTO = 'www.antenna.is'
    BASE_URL = 'http://www.antenna.is'
    BASE_URL_SECURE = 'https://www.antenna.is'
    STATICFILES_STORAGE = 'storages.backends.s3boto.S3BotoStorage'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto.S3BotoStorage'
    STATIC_URL = '//s3.amazonaws.com/readrboard/'
    DATABASE_ROUTERS = ['rb.routers.MasterSlaveRouter']    
    
        
    DATABASES = {
      'default': {
        'ENGINE':   'django.db.backends.mysql',
        'NAME':     'readrboard',
        'USER':     'antenna-array',
        'PASSWORD': 'r34drsl4v3',
        'HOST':     '10.240.97.167',
        'PORT':     '4040',
        'CONN_MAX_AGE':  60,
        'OPTIONS': {
            "init_command": "SET storage_engine=INNODB",
        }
      },
      'readonly1': {
        'ENGINE':   'django.db.backends.mysql',
        'NAME':     'readrboard',
        'USER':     'antenna-array',
        'PASSWORD': 'r34drsl4v3',
        'HOST':     '10.240.99.122',
        'PORT':     '3306',
        'CONN_MAX_AGE':  60,
        'OPTIONS': {
            "init_command": "SET storage_engine=INNODB",
        }
      },
      'readonly2': {
        'ENGINE':   'django.db.backends.mysql',
        'NAME':     'readrboard',
        'USER':     'antenna-array',
        'PASSWORD': 'r34drsl4v3',
        'HOST':     '10.240.245.89',
        'PORT':     '3306',
        'CONN_MAX_AGE':  60,
        'OPTIONS': {
            "init_command": "SET storage_engine=INNODB",
        }
      }
      
    }
    
    CACHES = {
        'default': {
            'BACKEND': 'memcachepool.cache.UMemcacheCache',
            #'LOCATION': ['192.168.182.48:11211', '192.168.182.177:11211'],
            'LOCATION': ['10.240.9.228:11211'],
            #'LOCATION': ['192.168.182.177:11211'],
            'TIMEOUT':86400,
            'OPTIONS': {
                'MAX_POOL_SIZE': 100,
                'BLACKLIST_TIME': 20,
                'SOCKET_TIMEOUT': 5,
                'MAX_ITEM_SIZE': 1000*100,
            }
        },
        'redundant': {
            'BACKEND': 'memcachepool.cache.UMemcacheCache',
            #'LOCATION': ['192.168.182.48:11211', '192.168.182.177:11211'],
            'LOCATION': ['10.240.232.254:11211'],
            'TIMEOUT':86400,
            'OPTIONS': {
                'MAX_POOL_SIZE': 100,
                'BLACKLIST_TIME': 20,
                'SOCKET_TIMEOUT': 5,
                'MAX_ITEM_SIZE': 1000*100,
            }
        }
    }
    
    #BROKER_URL = "amqp://broadcast:51gn4l5@192.168.133.106:5672/antenna_broker"
    BROKER_URL = "amqp://broadcast:51gn4l5@10.240.97.167:5672/antenna_broker"
      

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_BEAT_SCHEDULER = 'djcelery.schedulers.DatabaseScheduler'
              
#JOHNNY_MIDDLEWARE_KEY_PREFIX='jc_antenna'


# Facebook shit
LOGIN_REDIRECT_URL = '/'

#GeoIP shit
GEOIP_PATH = 'geo_data'

MANAGERS = ADMINS

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/New_York'
TIMEZONE = 'America/New_York'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = False
USE_L10N = False

MEDIA_ROOT = 'media/'
MEDIA_URL = '/media/'
    
#ADMIN_MEDIA_PREFIX = 'admin/'

# Additional locations of static files                                                
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".           
    # Always use forward slashes, even on Windows.                                    
    # Don't forget to use absolute paths, not relative paths.                         
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#   'django.contrib.staticfiles.finders.DefaultStorageFinder',                       
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'g^+j%4z)3ddwqu^tt)(w8phq&r6-y8f0!e&w^z68xo3(@jxgc!'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    #'django.template.loaders.eggs.load_template_source',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.media',
    'django.core.context_processors.static',
    'django.contrib.auth.context_processors.auth',
    'django.contrib.messages.context_processors.messages',
)

MIDDLEWARE_CLASSES = (
    #'django.middleware.cache.UpdateCacheMiddleware',
    #'johnny.middleware.LocalStoreClearMiddleware',
    #'johnny.middleware.QueryCacheMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # 'readrboard.rb.middleware.ProfileMiddleware',  # this will break production
    #'debug_toolbar.middleware.DebugToolbarMiddleware',
    #'django.middleware.cache.FetchFromCacheMiddleware',
)

if not ANTENNA_ARRAY:
    ROOT_URLCONF = 'antenna.urls'
else:
    ROOT_URLCONF = 'antenna.urls'

TEMPLATE_DIRS = (
    "antenna/rb/templates"
)

import os

RB_SITE_ROOT = os.path.dirname(os.path.realpath(__file__))
EMAIL_TEMPLATE_DIR = RB_SITE_ROOT + "/rb/email_templates"

if DEBUG:
    EMAIL_USE_TLS = True
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_HOST_USER = 'hello@antenna.is'
    EMAIL_HOST_PASSWORD = 'br04dc45t'
    EMAIL_PORT = 587
else:
    EMAIL_USE_TLS = True
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_HOST_USER = 'hello@antenna.is'
    EMAIL_HOST_PASSWORD = 'br04dc45t'
    EMAIL_PORT = 587


SEEDERS=[119507,119500,119495,119494,119493,119492,11940,119487,119485,119483]

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'api',
    'rb',
    'chronos',
    'analytics',
    # 'piston',
    'south',
    'storages',
    'gunicorn',
    'djcelery'
    #'treebeard',
    #'debug_toolbar',
    #'autofixture',
    #'devserver'
]

if DEBUG: INSTALLED_APPS.append('devserver')
if DEBUG: INSTALLED_APPS.append('django_extensions')

DEVSERVER_MODULES = (
    #'devserver.modules.sql.SQLRealTimeModule',
    #'devserver.modules.sql.SQLSummaryModule',
    # 'devserver.modules.profile.ProfileSummaryModule',

    # Modules not enabled by default
    #'devserver.modules.ajax.AjaxDumpModule',
    #'devserver.modules.profile.MemoryUseModule',
    #'devserver.modules.cache.CacheSummaryModule',
    #'devserver.modules.profile.LineProfilerModule',
)

DEVSERVER_IGNORED_PREFIXES = ['/media', '/uploads']


AUTHENTICATION_BACKENDS = (
  'django.contrib.auth.backends.ModelBackend',
)

# For django debug toolbar
INTERNAL_IPS = ('127.0.0.1',)

DEBUG_TOOLBAR_PANELS = (
    'debug_toolbar.panels.version.VersionDebugPanel',
    'debug_toolbar.panels.timer.TimerDebugPanel',
    'debug_toolbar.panels.settings_vars.SettingsVarsDebugPanel',
    'debug_toolbar.panels.headers.HeaderDebugPanel',
    'debug_toolbar.panels.request_vars.RequestVarsDebugPanel',
    'debug_toolbar.panels.template.TemplateDebugPanel',
    'debug_toolbar.panels.sql.SQLDebugPanel',
    'debug_toolbar.panels.signals.SignalDebugPanel',
    'debug_toolbar.panels.logger.LoggingPanel',
)

DEBUG_TOOLBAR_CONFIG = {
    "INTERCEPT_REDIRECTS": False
}


LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'filters': {
        
    },
    'handlers': {
        'null': {
            'level':'DEBUG',
            'class':'django.utils.log.NullHandler',
        },
        'console':{
            'level':'DEBUG',
            'class':'logging.StreamHandler',
            'formatter': 'simple'
        },
        'rb_standard':{
            'level':'DEBUG',
            'class':'logging.handlers.RotatingFileHandler',
            'filename': 'logs/rb_standard.log',
            'maxBytes': 1024*1024*10, # 10 MB
            'backupCount': 50,
            'formatter':'verbose',
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': [],
            'class': 'django.utils.log.AdminEmailHandler',
        }
    },
    'loggers': {
        'django': {
            'handlers':['null'],
            'propagate': True,
            'level':'INFO',
        },
        'django.request': {
            'handlers': ['mail_admins', 'rb_standard'],
            'level': 'INFO',
            'propagate': False,
        },
        'rb.standard': {
            'handlers': ['console', 'rb_standard'],
            'level': 'INFO',
        },
        'django.db': {
            'handlers': ['console','rb_standard'],
            'level': 'INFO',
        }
    }
}
