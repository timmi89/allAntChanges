import settings
from celery.task.schedules import crontab
from celery.decorators import periodic_task, task
from analytics.utils import OAuth2EventsUtility
import datetime, json, random
from antenna.rb.models import *
from antenna.api.util_functions import *
from django.forms.models import model_to_dict
from celery.utils.log import get_task_logger
from models import *
from django.db.models import Count
from django.core.cache import cache, get_cache
import traceback
import hashlib
import httplib

logger = get_task_logger(__name__)


@task(name='page.newer.cache.update')
def update_page_newer_cache(page_id):
    logger.info('UPDATE NEWER PAGE CACHE: ' + str(page_id))
    if cache.get('LOCKED_page_data_newer_' + str(page_id)) is None:
        cache_data = getSinglePageDataNewerById(page_id)
        try:
            cache.set('LOCKED_page_data_newer_' + str(page_id),'locked',15)
            cache.set('page_data_newer_' + str(page_id), cache_data )
            cache.delete('LOCKED_page_data_newer_' + str(page_id))
        except Exception, ex:
            logger.info(ex)
        try:
            get_cache('redundant').set('LOCKED_page_data_newer_' + str(page_id),'locked',15)
            get_cache('redundant').set('page_data_newer_' + str(page_id), cache_data )
            get_cache('redundant').delete('LOCKED_page_data_newer_' + str(page_id))
        except Exception, ex:
            logger.info('REDUNDANT CACHE EXCEPTION')
            logger.warn(ex)
        if settings.CACHE_SYNCBACK:
            refresh_url = '/api/cache/page/newer/refresh/'+ str(page_id)

            try:
                hcon = httplib.HTTPConnection(settings.OTHER_DATACENTER, timeout=5)
                hcon.request('GET', refresh_url)
                resp = hcon.getresponse()
                lines = resp.read()
                hcon.close()
            except Exception, e:
                logger.info("Other datacenter refresh: " + str(e))
    else:
        logger.info('LOCKED PAGE CACHE: ' + str(page_id))


@task(name='crosspage.container.cache.update')
def update_crosspage_container_cache(group_id, container_hash):
    logger.info('UPDATE CROSSPAGE CONTAINER CACHE: (group: {0}, container: {1}'.format(group_id, container_hash))
    cache_key = crosspage_container_cache_key(group_id, container_hash)
    lock_key = 'LOCKED_crosspage_container_data_{0}_{1}'.format(group_id, container_hash)
    if cache.get(lock_key) is None:
        cache_data = get_crosspage_container_data_by_hash(group_id, container_hash)
        try:
            cache.set(lock_key, 'locked', 15)
            cache.set(cache_key, cache_data)
            cache.delete(lock_key)
        except Exception, ex:
            logger.info(ex)
        try:
            get_cache('redundant').set(lock_key, 'locked', 15)
            get_cache('redundant').set(cache_key, cache_data )
            get_cache('redundant').delete(lock_key)
        except Exception, ex:
            logger.info('REDUNDANT CACHE EXCEPTION')
            logger.warn(ex)
    else:
        logger.info('LOCKED CROSSPAGE CONTAINER CACHE: (group: {0}, container: {1})'.format(group_id, container_hash))


@task(name='events.register')
def register_event(event):
    logger.info('REGISTERING EVENT: ' + str(event))
    requests.get(settings.EVENTS_URL + '/insert', {
        "json": json.dumps(event)
    })

@task(name='page.cache.update')
def update_page_cache(page_id):
    logger.info('UPDATE PAGE CACHE: ' + str(page_id))
    if cache.get('LOCKED_page_data' + str(page_id)) is None:
        cache_data = getSinglePageDataDict(page_id)
        try:
            cache.set('LOCKED_page_data' + str(page_id),'locked',15)
            cache.set('page_data' + str(page_id), cache_data )
            cache.delete('LOCKED_page_data' + str(page_id))
        except Exception, ex:
            logger.info(ex)
        try:
            get_cache('redundant').set('LOCKED_page_data' + str(page_id),'locked',15)
            get_cache('redundant').set('page_data' + str(page_id), cache_data )
            get_cache('redundant').delete('LOCKED_page_data' + str(page_id))
        except Exception, ex:
            logger.info('REDUNDANT CACHE EXCEPTION')
            logger.warn(ex)
        if settings.CACHE_SYNCBACK:
            refresh_url = '/api/cache/page/refresh/'+ str(page_id)

            try:
                hcon = httplib.HTTPConnection(settings.OTHER_DATACENTER, timeout=5)
                hcon.request('GET', refresh_url)
                resp = hcon.getresponse()
                lines = resp.read()
                hcon.close()
            except Exception, e:
                logger.info("Other datacenter refresh: " + str(e))
    else:
        logger.info('LOCKED PAGE CACHE: ' + str(page_id))
#    logger.info('updating page_data: ' + str(page_id))
#   cache.set('page_data' + str(page_id), getSinglePageDataDict(page_id))


@task(name='page.containers.cache.update')
def update_page_container_hash_cache(page_id, hashes, crossPageHashes):
    if len(hashes) == 1:
        key = 'page_containers' + str(page_id) + ":" + str(hashes)
        #cache.delete('page_containers' + str(page_id))
        update_page_cache(page_id)
        spdd = cache.get('page_data'+str(page_id))
        new_hashes = []
        for container in spdd['containers']:
            if container['hash'] != 'page':
                new_hashes.append(container['hash'])
        if len(new_hashes) != 1: #no infinite recursion, please
            update_page_container_hash_cache(page_id, new_hashes, crossPageHashes)
    else:
        key = 'page_containers' + str(page_id)
    if cache.get('LOCKED_'+key) is None:
        logger.info('updating page container cache ' + str(hashes) + ' ' +  str(crossPageHashes))
        logger.info(key)
        cache_data = getKnownUnknownContainerSummaries(page_id, hashes, crossPageHashes)
        try:
            cache.set('LOCKED_'+key,'locked',15)
            cache.set(key, cache_data )
            cache.delete('LOCKED_'+key)
        except Exception, ex:
            logger.info(ex)
        try:
            get_cache('redundant').set('LOCKED_'+key,'locked',15)
            get_cache('redundant').set(key, cache_data)
            get_cache('redundant').delete('LOCKED_'+key)
        except Exception, ex:
            logger.info(ex)

    else:
        logger.warning('LOCKED CACHE KEY: ' + key)
#    logger.info('updating page container cache ' + str(hashes) + ' ' +  str(crossPageHashes))
#    cache.set(key, getKnownUnknownContainerSummaries(page_id, hashes, crossPageHashes))
    if settings.CACHE_SYNCBACK:
        if len(hashes) == 1:
            refresh_url = '/api/cache/page/refresh/'+ str(page_id) + '/' +str(hashes[0])
        else:
            refresh_url = '/api/cache/page/refresh/'+ str(page_id)

        try:
            hcon = httplib.HTTPConnection( settings.OTHER_DATACENTER, timeout=5)
            hcon.request('GET', refresh_url)
            resp = hcon.getresponse()
            lines = resp.read()
            hcon.close()
        except Exception, e:
            logger.info("Other datacenter refresh: " + str(e))
