__author__ = 'michael'
from django.core.management.base import BaseCommand, CommandError
from antenna.analytics.tasks import *
from antenna.rb.models import *

import logging, httplib
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        group_id = int(args[0])
        print group_id

        group  = Group.objects.get(id=group_id)
        print group
        pages = Page.objects.filter(site__group = group)
        print len(pages)
        page_paginator = Paginator(pages, 100)
        for pr in page_paginator.page_range:
            paginated_pages = page_paginator.page(pr)
            for page in paginated_pages:
                update_page_cache.delay(page.id)
                """
                refresh_url = '/api/cache/page/refresh/'+ str(page.id)
                print refresh_url

                try:
                    #hcon = httplib.HTTPConnection(host=settings.OTHER_DATACENTER)
                    hcon = httplib.HTTPConnection(host="gce.antenna.is")
                    hcon.request('GET', refresh_url)
                    resp = hcon.getresponse()
                    lines = resp.read()
                    hcon.close()
                except Exception, e:
                    logger.info("Other datacenter refresh: " + str(e))
                """
            print 'finished page:', pr
