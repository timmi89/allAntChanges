import settings
import httplib
from django.core.cache import cache
import traceback
from antenna.api.utils import getSinglePageDataDict, getKnownUnknownContainerSummaries, getSettingsDict, getGlobalActivity
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
            hcon = httplib.HTTPConnection(settings.URL_NO_PROTO, timeout=30)
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

class AsynchPageNotification(AbstractAsynchronousNotification):
    def generate_url(self, **kwargs):
        self.url = '/chronos/page/' + str(kwargs['interaction_id']) + '/'
        logger.info('page url ' + str(self.url))
        return self.url
 

class AsynchNewGroupNodeNotification(AbstractAsynchronousNotification):
    def generate_url(self, **kwargs):
        self.url = '/chronos/group_node/' + str(kwargs['interaction_id']) + '/' + str(kwargs['group_id']) + '/'
        logger.info('page url ' + str(self.url))
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
        if kwargs.has_key('exact'):
            return True if count == self.args['threshold'] else False
        return True if count >= self.args['threshold'] else False
        
        
class CacheUpdater(object):
    key = None
    keys = None
    dick = None
    value = None
    method = None
    
    def __call__(self, **kwargs):
        self.hydrate()
        #logger.info("hydrated")
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
        self.hashes = kwargs.get('hashes',[])
        self.crossPageHashes = kwargs.get('crossPageHashes',[])
        self.method = kwargs['method']
        
    def hydrate(self):
        
        if len(self.hashes) == 1:
            self.key = 'page_containers' + str(self.page_id) + ":" + str(self.hashes)
        else:
            self.key = 'page_containers' + str(self.page_id)
           
        #self.key = 'page_containers' + str(self.page_id)
        #logger.info('hydrating using key: ' + self.key)
        if self.method == 'update':  
            self.value = getKnownUnknownContainerSummaries(self.page_id, self.hashes, self.crossPageHashes)
        
class GroupSettingsDataCacheUpdater(CacheUpdater):        
    def __init__(self, **kwargs):
        self.group = kwargs['group']
        self.method = kwargs['method']
        
    def hydrate(self):
        self.key = 'group_settings' + str(self.group.id)
        if self.method == 'update':  
            self.value = getSettingsDict(self.group)
        

class ViewCacheUpdater(CacheUpdater):   
    def __init__(self, **kwargs):
        self.view = kwargs['view']
        self.page = kwargs['page_num']
        
        self.method = kwargs['method']
        
    def hydrate(self):
        self.key = self.view + ":" + str(self.page)
        if self.method == 'update':  
            self.value = getSettingsDict(self.group)
         

class GlobalActivityCacheUpdater(CacheUpdater):   
    def __init__(self, **kwargs):
        self.view = 'global_activity'
        self.method = kwargs['method']
        
    def hydrate(self):
        self.key = self.view
        if self.method == 'update':  
            self.value = getGlobalActivity()
         
