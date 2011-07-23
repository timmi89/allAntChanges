# Django settings for readrboard project.

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),    
    ('Tyler Brock', 'tyler@readrboard.com'),
    ('Porter Bayne', 'porter@readrboard.com'),
    ('Eric Chaves', 'eric@readrboard.com'),
)

if DEBUG:
    FACEBOOK_APP_ID = '186217208100982'
    FACEBOOK_APP_SECRET = 'f285b17e71770615189e7676c1d7d0f9'

    BASE_URL = 'http://readr.local:8080'

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
    FACEBOOK_APP_ID = '163759626987948'
    FACEBOOK_APP_SECRET = 'f14061a2ed9d7ae8ed1c3b231a8148c9'

    BASE_URL = 'http://dev.readrboard.com'

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

    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'readr.cache'
        }
    }

# Facebook shit
LOGIN_REDIRECT_URL = '/'

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
USE_I18N = True
USE_L10N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
# [porter] wtf.
MEDIA_ROOT = 'rb/static'

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/static/'

# URL prefix for admin static files -- CSS, JavaScript and images.                    
# Make sure to use a trailing slash.                                                  
# Examples: "http://foo.com/static/admin/", "/static/admin/".                         
ADMIN_MEDIA_PREFIX = '/static/site/admin/'


# Additional locations of static files                                                
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".           
    # Always use forward slashes, even on Windows.                                    
    # Don't forget to use absolute paths, not relative paths.                         
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',                       
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

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.admin',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'readrboard.api',
    'readrboard.rb',
    'piston',
    'south',
    #'treebeard',
    #'debug_toolbar',
    'autofixture'
    #'django_extensions',
    #'devserver'
)

DEVSERVER_MODULES = (
    'devserver.modules.sql.SQLRealTimeModule',
    'devserver.modules.sql.SQLSummaryModule',
    'devserver.modules.profile.ProfileSummaryModule',

    # Modules not enabled by default
    #'devserver.modules.ajax.AjaxDumpModule',
    #'devserver.modules.profile.MemoryUseModule',
    #'devserver.modules.cache.CacheSummaryModule',
    #'devserver.modules.profile.LineProfilerModule',
)

DEVSERVER_IGNORED_PREFIXES = ['/media', '/uploads']

# for get_profile()
AUTH_PROFILE_MODULE = 'rb.Profile'

# for sessions
#SESSION_ENGINE = 'django.contrib.sessions.backends.cache'

# for lazy signup
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
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler'
    }
    },
    'loggers': {
    'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
    },
    }
}

DEVSERVER_MODULES = (
    'devserver.modules.sql.SQLRealTimeModule',
    'devserver.modules.sql.SQLSummaryModule',
    'devserver.modules.profile.ProfileSummaryModule',

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

#SESSION_COOKIE_DOMAIN = '.readr.local'

STATIC_URL = BASE_URL + '/static/'
