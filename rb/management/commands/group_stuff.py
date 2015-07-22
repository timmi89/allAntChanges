from django.core.management.base import BaseCommand, CommandError
from django.core.cache import cache
from antenna.rb.models import *

import logging
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        group = Group.objects.get(id=int(args[0]))
        for admin in group.admins.all():
            print admin.user.email
            
        