import logging
from django.core.cache import cache, get_cache
from celery.decorators import periodic_task
from celery.task.schedules import crontab
from antenna.rb.models import Group
from antenna.api.util_functions import *

logger = logging.getLogger('rb.standard')

@periodic_task(name='content_rec.refresh', ignore_result=True,
               run_every=(crontab(minute=0))) # Hourly
def refresh_recommended_content():
    groups = Group.objects.filter(id=3714) # Bustle only for now
    for group in groups:
        try:
            group_id = group.id
            logger.info('UPDATE RECOMMENDED CONTENT CACHE: ' + str(group_id))
            if cache.get('LOCKED_recommended_content_' + str(group_id)) is None:
                cache_data = getRecommendedContent(group_id)
                logger.info(cache_data)
                try:
                    cache.set('LOCKED_popular_content_' + str(group_id),'locked',15)
                    cache.set('recommended_content_' + str(group_id), cache_data )
                    cache.delete('LOCKED_recommended_content_' + str(group_id))
                except Exception, ex:
                    logger.info(ex)
                try:
                    get_cache('redundant').set('LOCKED_recommended_content_' + str(group_id),'locked',15)
                    get_cache('redundant').set('recommended_content_' + str(group_id), cache_data )
                    get_cache('redundant').delete('LOCKED_recommended_content_' + str(group_id))
                except Exception, ex:
                    logger.info('REDUNDANT CACHE EXCEPTION')
                    logger.warn(ex)
            else:
                logger.info('LOCKED RECOMMENDED CONTENT CACHE: ' + str(group_id))
        except Exception, ex:
            logger.info('An exception occurred refreshing recommended content for group' + group.short_name)
            logger.warn(ex)