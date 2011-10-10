# Django settings for readrboard project.
from os import uname

if uname()[0] == "Linux": DEBUG = False
else: DEBUG = True

# Server e-mail account
SERVER_EMAIL = "server@readrboard.com"

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

# For Facebook
FACEBOOK_APP_ID = '163759626987948'
FACEBOOK_APP_SECRET = 'f14061a2ed9d7ae8ed1c3b231a8148c9'

ADMINS = ( 
    ('Tyler Brock', 'tyler@readrboard.com'),
    ('Porter Bayne', 'porter@readrboard.com'),
    ('Eric Chaves', 'eric@readrboard.com'),
)

if DEBUG:
    
    BASE_URL = 'http://local.readrboard.com:8080'
    STATIC_URL = 'http://local.readrboard.com:8080/static/'
    STATIC_ROOT = 'rb/static/'

    DATABASES = {
      'default': {
          'ENGINE':   'django.db.backends.sqlite3',
          'NAME':     'readrdb.db',
          'USER':     '',
          'PASSWORD': '',
          'HOST':     '', 
          'PORT':     '',
        }
    }

else:

    BASE_URL = 'http://www.readrboard.com'
    STATICFILES_STORAGE = 'storages.backends.s3boto.S3BotoStorage'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto.S3BotoStorage'
    STATIC_URL = 'http://s3.amazonaws.com/readrboard/'
    
    DATABASES = {
      'default': {
        'ENGINE':   'django.db.backends.mysql',
        'NAME':     'readrboard',
        'USER':     'readrboard',
        'PASSWORD': 'gubnah',
        'HOST':     '10.215.10.164',
        'PORT':     '3306',
        'OPTIONS': {
            "init_command": "SET storage_engine=INNODB",
        }
      }
    }

    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'readr.cache'
        }
    }

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
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    #'debug_toolbar.middleware.DebugToolbarMiddleware',
    #'django.middleware.cache.FetchFromCacheMiddleware',
)

ROOT_URLCONF = 'readrboard.urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    #todo: make this an absolute path as recommended. Using rel paths for now
    # so it's compatible on all our local machines
    "readrboard/rb/templates"
)
"""
SERIALIZATION_MODULES = {
    'json': 'wadofstuff.django.serializers.json'
}
"""
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'api',
    'rb',
    'piston',
    'south',
    'storages'
    #'treebeard',
    #'debug_toolbar',
    #'autofixture',
    #'devserver'
]

if DEBUG: INSTALLED_APPS.append('devserver')
if DEBUG: INSTALLED_APPS.append('django_extensions')

DEVSERVER_MODULES = (
    'devserver.modules.sql.SQLRealTimeModule',
    'devserver.modules.sql.SQLSummaryModule',
    'devserver.modules.profile.ProfileSummaryModule',

    # Modules not enabled by default
    'devserver.modules.ajax.AjaxDumpModule',
    'devserver.modules.profile.MemoryUseModule',
    'devserver.modules.cache.CacheSummaryModule',
    'devserver.modules.profile.LineProfilerModule',
)

DEVSERVER_IGNORED_PREFIXES = ['/media', '/uploads']

# for get_profile()
#AUTH_PROFILE_MODULE = 'rb.Profile'

# for sessions
#SESSION_ENGINE = 'django.contrib.sessions.backends.cache'

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
    'disable_existing_loggers': False,
    'handlers': {
    'mail_admins': {
            #'level': 'ERROR',
            'level': 'CRITICAL',
            'class': 'django.utils.log.AdminEmailHandler'
    }
    },
    'loggers': {
    'django.request': {
            #'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
    },
    }
}

DEVSERVER_MODULES = (
    'devserver.modules.sql.SQLRealTimeModule',
    'devserver.modules.sql.SQLSummaryModule',
    #'devserver.modules.profile.ProfileSummaryModule',

    # Modules not enabled by default
    #'devserver.modules.ajax.AjaxDumpModule',
    #'devserver.modules.profile.MemoryUseModule',
    #'devserver.modules.cache.CacheSummaryModule',
    #'devserver.modules.profile.LineProfilerModule',
)

DEVSERVER_IGNORED_PREFIXES = ['/media', '/uploads']

# for social auth
#SOCIAL_AUTH_ERROR_KEY = 'social_errors'
#SOCIAL_AUTH_EXPIRATION = 'expires'
#FACEBOOK_EXTENDED_PERMISSIONS = ('email')

#SESSION_COOKIE_DOMAIN = '.local.readrboard.com'
