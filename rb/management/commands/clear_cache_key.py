from django.core.management.base import BaseCommand, CommandError
from django.core.cache import cache

import logging
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        cache.delete(args[0])
        