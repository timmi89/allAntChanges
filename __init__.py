from __future__ import absolute_import

try:
    from antenna_celery import app as celery_app
except ImportError:
    from antenna.antenna_celery import app as celery_app
