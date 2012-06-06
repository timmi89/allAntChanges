import settings
import httplib
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
            hcon = httplib.HTTPConnection('local.readrboard.com',8080, timeout=3)
            hcon.connect()
            hcon.request('GET', url)
            resp = hcon.getresponse(True)
            lines = resp.read()
            hcon.close()
        except Exception, e:
            logger.info("BLOW")

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
        
        
        
        
        
        
        
        
        
         