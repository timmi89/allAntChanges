# Django settings for readrboard project.

DEBUG = True
TEMPLATE_DEBUG = DEBUG

# Facebook shit
LOGIN_REDIRECT_URL = '/'
FACEBOOK_APP_ID = '163759626987948'
FACEBOOK_APP_SECRET = 'f14061a2ed9d7ae8ed1c3b231a8148c9'

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),    
    ('Tyler Brock', 'tyler@readrboard.com'),
    ('Porter Bayne', 'porter@readrboard.com'),
    ('Eric Chaves', 'eric@readrboard.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.sqlite3',         # 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME':     'readrdb.db',             # Or path to database file if using sqlite3.
        'USER':     '',             # Not used with sqlite3.
        'PASSWORD': '',         # Not used with sqlite3.
        'HOST':     '',             # Set to empty string for localhost. Not used with sqlite3.
        'PORT':     '',             # Set to empty string for default. Not used with sqlite3.
    }
}

FILE_REL_PATH = '/usr/share/'

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

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = 'rb/media'

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/static/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'g^+j%4z)3ddwqu^tt)(w8phq&r6-y8f0!e&w^z68xo3(@jxgc!'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
#     'django.template.loaders.eggs.load_template_source',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    #'debug_toolbar.middleware.DebugToolbarMiddleware',
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
    #'django.contrib.sessions',
    'readrboard.rb',
    'django.contrib.admin',
    'readrboard.api',
    'piston',
    'south',
    'treebeard',
    'debug_toolbar',
    'autofixture',
)

# for get_profile()
AUTH_PROFILE_MODULE = 'rb.SocialUser'

# for sessions
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'

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

# for social auth
#SOCIAL_AUTH_ERROR_KEY = 'social_errors'
#SOCIAL_AUTH_EXPIRATION = 'expires'
#FACEBOOK_EXTENDED_PERMISSIONS = ('email')

#SESSION_COOKIE_DOMAIN = '.readr.local'
