import settings
import httplib
from django.core.cache import cache
import traceback
from readrboard.api.utils import getSinglePageDataDict, getKnownUnknownContainerSummaries
import logging
logger = logging.getLogger('rb.standard')

class AbstractAsynchronousNotification(object):
    url = None
    
    def __call__(self, **kwargs):
        #self.url = self.generate_url(**kwargs)
        self.fire(self.generate_url(**kwargs))
    
    def generate_url(self, **kwargs):
        raise NotImplementedError("generate_url not implemented")
    
    def fire(self, url):
        logger.info("NO PROTO URL: " + str(settings.URL_NO_PROTO) + " *** " + str(url))
        try:
            #hcon = httplib.HTTPConnection(settings.BASE_URL, timeout=3)
            hcon = httplib.HTTPConnection(settings.URL_NO_PROTO, timeout=3)
            hcon.connect()
            hcon.request('GET', url)
            resp = hcon.getresponse()
            lines = resp.read()
            hcon.close()
        except Exception, e:
            logger.info("BLOW" + str(e))

class AsynchAgreeNotification(AbstractAsynchronousNotification):
    def generate_url(self, **kwargs):
        self.url = '/chronos/agree/' + str(kwargs['interaction_id']) + '/'
        logger.info('agree url ' + str(self.url))
        return self.url
   
class AsynchCommentNotification(AbstractAsynchronousNotification):
    def generate_url(self, **kwargs):
        self.url = '/chronos/comment/' + str(kwargs['interaction_id']) + '/'
        logger.info('comment url ' + str(self.url))
        return self.url
    
class AbstractNotificationRuleImpl(object):
    args = None
    def __init__(self, **kwargs):
        self.args = kwargs
    
    def passes(self, **kwargs):
        raise NotImplementedError("pass not implemented")
    


class ThresholdNotificationRule(AbstractNotificationRuleImpl):

    def passes(self, **kwargs):
        count = kwargs['count']  
        return True if count >= self.args['threshold'] else False
        
        
class CacheUpdater(object):
    key = None
    keys = None
    dick = None
    value = None
    method = None
    
    def __call__(self, **kwargs):
        self.hydrate()
        logger.info("hydrated")
        if self.method == 'update':
            try:
                cache.set(self.key, self.value)
            except Exception, e:
                logger.warning(traceback.format_exc(50))
        elif self.method == 'update_many':
            try:
                cache.set_many(self.dick)
            except Exception, e:
                logger.warning(traceback.format_exc(50))

        
        elif self.method == 'delete':
            try:
                cache.delete(self.key)
            except Exception, e:
                logger.warning(traceback.format_exc(50))
        elif self.method == 'delete_many':
            try:
                cache.delete_many(self.keys)
            except Exception, e:
                logger.warning(traceback.format_exc(50))
    
    def hydrate(self):
        raise NotImplementedError("hydrate not implemented")
    

class PageDataCacheUpdater(CacheUpdater):
    
    def __init__(self, **kwargs):
        self.page_id = kwargs['page_id']
        self.method = kwargs['method']
        
    def hydrate(self):
        self.key = 'page_data' + str(self.page_id)
        if self.method == 'update':  
            self.value = getSinglePageDataDict(self.page_id)
        
        
class ContainerSummaryCacheUpdater(CacheUpdater):
    
    def __init__(self, **kwargs):
        self.page_id = kwargs['page_id']
        self.hashes = kwargs['hashes']
        self.method = kwargs['method']
        
    def hydrate(self):
        self.key = 'page_containers' + str(self.page_id)
        if self.method == 'update':  
            self.value = getKnownUnknownContainerSummaries(self.page_id, self.hashes)
        
        
        
        
         
