from django.core.management.base import BaseCommand, CommandError
import settings
from celery.task.schedules import crontab
from celery.decorators import periodic_task, task
from analytics.utils import OAuth2EventsUtility
import datetime, json, random
from antenna.rb.models import * 
from django.forms.models import model_to_dict
from celery.utils.log import get_task_logger
from models import *
from django.db.models import Count
from django.core.cache import cache
import traceback
import hashlib
from antenna.analytics.tasks import *

import logging
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        do_all_groups_recirc()
        