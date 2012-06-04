import settings
import httplib

class AbstractAsynchronousNotification(object):
    name = None
    url = None
    
    def __call__(self, name, **kwargs):
        self.name = name
        self.url = self.generate_url(kwargs)
        self.fire()
    
    def generate_url(self, **kwargs):
        raise NotImplementedError("generate_url not implemented")
    
    def fire(self):
        hcon = httplib.HTTPConnection(settings.BASE_URL, timeout=3)
        hcon.connect()
        hcon.request('GET', self.url)
        resp = hcon.getresponse(buffering)
        hcon.close()

class AsynchAgreeNotification(AbstractAsynchronousNotification):
    def generate_url(self, **kwargs):
        self.url = '/chronos/agree/' + kwargs['interaction_id']
   

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
        
        
        
        
        
        
        
        
        
         