from django.core.management.base import BaseCommand, CommandError
from django.core.paginator import Paginator
from rb.models import *



import logging
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        logger.info('migrate perez mobi interactinos command start')
        
        old_group = Group.objects.get(id = 2504)
        new_group = Group.objects.get(id = 2471)
        pids = Interaction.objects.filter(page__site__group = old_group).values_list('page_id').distinct()
        logger.info('COUNT PIDS: ' + str(pids.count()) )
        remaining = []
        rem_paginator = Paginator(pids, 100)
        for y in rem_paginator.page_range:
            for pid in rem_paginator.page(y).object_list:
                remaining.append(pid[0])
        remaining.sort()
        remaining.reverse()
        logger.info(len(remaining))
        
        old_pages = Page.objects.filter(id__in = remaining, site__group = old_group).order_by('id')
        op_paginator = Paginator(old_pages, 100)
        logger.info('Page Range: ' + str(op_paginator.page_range))
        for x in op_paginator.page_range:
            logger.info('STARTING PAGE: ' + str(x))
            for p in op_paginator.page(x).object_list:
                
                try:
                    new_url = p.canonical_url.replace('http://mobi.','http://')
                    
                    new_page = Page.objects.get(canonical_url = new_url, site__group = new_group)
                    logger.info('Found page to migrate to: ' + str(new_page))
                    interactions = Interaction.objects.filter(page = p, page__site__group = old_group)                    
                    migrated = interactions.update(page = new_page)
                    logger.warn('MIGRATED: ' + str(migrated) + ' ' + str(new_page.id))
                    #logger.info(len(interactions))
                except Page.DoesNotExist, pdne:
                    logger.warn('Unable to migrate: ' + str(p.id) + ' ' + p.canonical_url)
                except Exception, ex:
                    logger.warn(ex)
            logger.info('FINISHED PAGE')
        