# Django settings for antenna project.
from __future__ import absolute_import
from cassandra import ConsistencyLevel
import os

if os.uname()[0] == 'Linux':
    DEBUG = os.getenv('DEBUG', 'false') == 'true'
else:
    DEBUG = True

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

AWS_DEFAULT_ACL = 'public-read'
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = True
AWS_PRELOAD_METADATA = True

# For Facebook
FACEBOOK_APP_ID = '163759626987948'
FACEBOOK_APP_SECRET = '9b7da3d1442f442cec8c25f5bf7ea0d0'

ADMINS = (
    ('Porter Bayne', 'porter@readrboard.com'),
    ('Jared Burns', 'jared@readrboard.com'),
    ('Brian Finney', 'brian@readrboard.com')
)

RB_SOCIAL_ADMINS = [
    'porterbayne@gmail.com',
    'porter@antenna.is',
    'jared@antenna.is',
    'brian@antenna.is',
    'chris@antenna.is'
]

TEMP_LIMIT_GROUPADMIN_AUTOAPPROVE = 8

STATIC_ROOT = 'rb/static/'

OTHER_DATACENTER = 'gce.antenna.is'
CACHE_SYNCBACK = False

if DEBUG:
    URL_NO_PROTO = 'local.antenna.is:8081'
    BASE_URL = 'http://local.antenna.is:8081'
    BASE_URL_SECURE = 'https://local.antenna.is:8081'
    STATIC_URL = '//local.antenna.is:8081/static/'
    DATABASE_ROUTERS = ['routers.DevMasterSlaveRouter']

    DATABASES = {
        'default': {
            'ENGINE':   'django.db.backends.mysql',
            'NAME':     'readrboard',
            'USER':     'root',
            'PASSWORD': '0bscur31nt3nt',
            'HOST':      os.getenv('DATABASE_HOST', 'localhost'),
            'PORT':      os.getenv('DATABASE_PORT', '3306')
        },
        'readonly1': {
            'ENGINE':   'django.db.backends.mysql',
            'NAME':     'readrboard',
            'USER':     'root',
            'PASSWORD': '0bscur31nt3nt',
            'HOST':      os.getenv('DATABASE_HOST', 'localhost'),
            'PORT':      os.getenv('DATABASE_PORT', '3306')
        },
        'readonly2': {
            'ENGINE':   'django.db.backends.mysql',
            'NAME':     'readrboard',
            'USER':     'root',
            'PASSWORD': '0bscur31nt3nt',
            'HOST':      os.getenv('DATABASE_HOST', 'localhost'),
            'PORT':      os.getenv('DATABASE_PORT', '3306')
        },
        'cassandra': {
            'ENGINE': 'django_cassandra_engine',
            'NAME': 'event_reports',
            'USER': 'root',  # TODO
            'PASSWORD': '',  # TODO
            'TEST_NAME': 'test_event_reports',
            'HOST': os.getenv('CASSANDRA_HOST', '127.0.0.1'),
            'OPTIONS': {
                'replication': {
                    'strategy_class': 'SimpleStrategy',
                    'replication_factor': 1
                },
                'connection': {
                    'consistency': ConsistencyLevel.ONE,
                    'retry_connect': True,
                    'lazy_connect': True,
                },
                'session': {
                    'default_timeout': 10,
                    'default_fetch_size': 10000,
                }
            }
        }
    }

    CACHES = {
        'default': {
            # 'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
            'BACKEND': 'memcachepool.cache.UMemcacheCache',
            'LOCATION': os.getenv(
                'MEMCACHED_HOST',
                'localhost') + ':11211',
            'TIMEOUT': 86400,
            'OPTIONS': {
                'MAX_POOL_SIZE': 100,
                'BLACKLIST_TIME': 20,
                'SOCKET_TIMEOUT': 5,
                'MAX_ITEM_SIZE': 1000*100,
            }
        },
        'redundant': {
            'BACKEND': 'memcachepool.cache.UMemcacheCache',
            'LOCATION': os.getenv(
                'MEMCACHED_HOST',
                'localhost') + ':11211',
            'TIMEOUT': 86400,
            'OPTIONS': {
                'MAX_POOL_SIZE': 100,
                'BLACKLIST_TIME': 20,
                'SOCKET_TIMEOUT': 5,
                'MAX_ITEM_SIZE': 1000*100,
            }
        },
    }

    BROKER_URL = "librabbitmq://broadcast:51gn4l5@{host}:5672/antenna_broker"
    BROKER_URL = BROKER_URL.format(
        host=os.getenv('RABBITMQ_HOST', 'localhost')
    )
else:
    ALLOWED_HOSTS = [
        "linode.antenna.is",
        "gce.antenna.is",
        "www.antenna.is",
        "antenna.is",
        "static.antenna.is",
        "www.readrboard.com",
        "readrboard.com",
        "static.readrboard.com"
    ]
    URL_NO_PROTO = 'www.antenna.is'
    BASE_URL = 'http://www.antenna.is'
    BASE_URL_SECURE = 'https://www.antenna.is'
    STATICFILES_STORAGE = 'storages.backends.s3boto.S3BotoStorage'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto.S3BotoStorage'
    STATIC_URL = '//s3.amazonaws.com/readrboard/'
    DATABASE_ROUTERS = ['routers.CassandraRouter', 'routers.MasterSlaveRouter']

    DATABASES = {
        'default': {
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
        'readonly1': {
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
        },
        'readonly2': {
            'ENGINE':   'django.db.backends.mysql',
            'NAME':     'readrboard',
            'USER':     'antenna-array',
            'PASSWORD': 'r34drsl4v3',
            'HOST':     '10.240.4.119',
            'PORT':     '3306',
            'CONN_MAX_AGE':  60,
            'OPTIONS': {
                "init_command": "SET storage_engine=INNODB",
            }
        },
        'cassandra': {
            'ENGINE': 'django_cassandra_engine',
            'NAME': 'event_reports',
            'USER': 'root',  # TODO
            'PASSWORD': '',  # TODO
            'TEST_NAME': 'test_event_reports',
            'HOST': '10.240.0.3,10.240.0.4,10.240.0.5',
            'OPTIONS': {
                'replication': {
                    'strategy_class': 'SimpleStrategy',
                    'replication_factor': 2
                },
                'connection': {
                    'consistency': ConsistencyLevel.ONE,
                    'retry_connect': True
                    # + All connection options for cassandra.cluster.Cluster()
                },
                'session': {
                    'default_timeout': 10,
                    'default_fetch_size': 10000
                    # + All options for cassandra.cluster.Session()
                }
            }
        }
    }

    CACHES = {
        'default': {
            'BACKEND': 'memcachepool.cache.UMemcacheCache',
            'LOCATION': ['10.240.9.228:11211'],
            'TIMEOUT': 86400,
            'OPTIONS': {
                'MAX_POOL_SIZE': 100,
                'BLACKLIST_TIME': 20,
                'SOCKET_TIMEOUT': 5,
                'MAX_ITEM_SIZE': 1000*100,
            }
        },
        'redundant': {
            'BACKEND': 'memcachepool.cache.UMemcacheCache',
            'LOCATION': ['10.240.232.254:11211'],
            'TIMEOUT': 86400,
            'OPTIONS': {
                'MAX_POOL_SIZE': 100,
                'BLACKLIST_TIME': 20,
                'SOCKET_TIMEOUT': 5,
                'MAX_ITEM_SIZE': 1000*100,
            }
        }
    }

    BROKER_URL = "amqp://broadcast:51gn4l5@10.240.97.167:5672/antenna_broker"


CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_BEAT_SCHEDULER = 'djcelery.schedulers.DatabaseScheduler'

# JOHNNY_MIDDLEWARE_KEY_PREFIX='jc_antenna'


# Facebook shit
LOGIN_REDIRECT_URL = '/'

# GeoIP shit
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

# ADMIN_MEDIA_PREFIX = 'admin/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'g^+j%4z)3ddwqu^tt)(w8phq&r6-y8f0!e&w^z68xo3(@jxgc!'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages"
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)


ROOT_URLCONF = 'antenna.urls'

TEMPLATE_DIRS = (
    "rb/templates"
)

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


SEEDERS = [
    119507,
    119500,
    119495,
    119494,
    119493,
    119492,
    11940,
    119487,
    119485,
    119483
]

INSTALLED_APPS = [
    'django_cassandra_engine',
    'django.contrib.auth',
    'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'south',
    'api',
    'rb',
    'chronos',
    'analytics',
    'forecast.cassandra',
    'forecast.reporting',
    'storages',
    'gunicorn',
    'djcelery'
]

if DEBUG:
    INSTALLED_APPS.append('devserver')
if DEBUG:
    INSTALLED_APPS.append('django_extensions')

DEVSERVER_MODULES = (
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
            'level': 'INFO',
            'class': 'django.utils.log.NullHandler',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'rb_standard': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/rb_standard.log',
            'maxBytes': 1024*1024*10,  # 10 MB
            'backupCount': 50,
            'formatter': 'verbose',
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': [],
            'class': 'django.utils.log.AdminEmailHandler',
        }
    },
    'loggers': {
        'django': {
            'handlers': ['null'],
            'propagate': True,
            'level': 'INFO',
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
            'handlers': ['console', 'rb_standard'],
            'level': 'INFO',
        }
    }
}
