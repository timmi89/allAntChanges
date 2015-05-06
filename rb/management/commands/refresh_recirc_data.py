from django.core.management.base import BaseCommand, CommandError
from antenna.analytics.tasks import *

import logging
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        do_all_groups_recirc()
        