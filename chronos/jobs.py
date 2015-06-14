import settings
import httplib
from django.core.cache import cache
import traceback
import logging
import time
from django.forms.models import model_to_dict
from antenna.rb.models import *
import hashlib
logger = logging.getLogger('rb.standard')

class AbstractAsynchronousNotification(object):
    url = None
    
    def __call__(self, **kwargs):
        self.fire(self.generate_url(**kwargs))
    
    def generate_url(self, **kwargs):
        raise NotImplementedError("generate_url not implemented")
    
    def fire(self, url):
        try:
            time.sleep(1)
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
        if self.method == 'update':
            try:
                cache.set(self.key, self.value)
            except Exception, e:
                logger.warning(traceback.format_exc(50))
        
        elif self.method == 'delete':
            try:
                cache.delete(self.key)
                cache.set(self.key, self.value)
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
        if self.method == 'update' or self.method == 'delete':  
            self.value = getSinglePageDataDict(self.page_id)
        
        
class ContainerSummaryCacheUpdater(CacheUpdater):
    
    def __init__(self, **kwargs):
        self.page_id = kwargs['page_id']
        self.hashes = kwargs.get('hashes',[])
        self.crossPageHashes = kwargs.get('crossPageHashes',[])
        self.method = kwargs['method']
        
    def __call__(self, **kwargs):
        self.hydrate()
        if self.method == 'update':
            try:
                cache.set(self.key, self.value)
            except Exception, e:
                logger.warning(traceback.format_exc(50))
        
        elif self.method == 'delete':
            try:
                cache.delete(self.key)
            except Exception, e:
                logger.warning(traceback.format_exc(50))
                
    def hydrate(self):
        if len(self.hashes) == 1:
            self.key = 'page_containers' + str(self.page_id) + ":" + str(self.hashes)
        else:
            self.key = 'page_containers' + str(self.page_id)
        if self.method == 'update':  
            self.value = getKnownUnknownContainerSummaries(self.page_id, self.hashes, self.crossPageHashes)
        
class GroupSettingsDataCacheUpdater(CacheUpdater):        
    def __init__(self, **kwargs):
        self.group = kwargs['group']
        self.host = kwargs['host']
        self.method = kwargs['method']
        
    def hydrate(self):
        self.key = 'group_settings_' + str(self.host)
        if self.method == 'update' or self.method == 'delete':  
            self.value = getSettingsDict(self.group)
        

class ViewCacheUpdater(CacheUpdater):   
    def __init__(self, **kwargs):
        self.view = kwargs['view']
        self.page = kwargs['page_num']
        self.method = kwargs['method']
        
    def hydrate(self):
        self.key = self.view + ":" + str(self.page)
        if self.method == 'update' or self.method == 'delete':  
            self.value = getSettingsDict(self.group)
         

class GlobalActivityCacheUpdater(CacheUpdater):   
    def __init__(self, **kwargs):
        self.view = 'global_activity'
        self.method = kwargs['method']
        
    def hydrate(self):
        self.key = self.view
        if self.method == 'update':  
            self.value = getGlobalActivity()

def getTagSummary(tag, tags):
    tags = filter(lambda x: x.interaction_node==tag, tags)
    
    data = {}
    data['count'] = len(tags)
    data['body'] = tag.body
    for inter in tags:
        if not inter.parent:
            data['parent_id'] = inter.id
            break
    return data


def getSinglePageDataDict(page_id):
    current_page = Page.objects.get(id=page_id)
    urlhash = hashlib.md5( current_page.url ).hexdigest()
    iop = Interaction.objects.filter(page=current_page, approved=True).exclude(container__item_type='question')
            
    # Retrieve containers
    containers = Container.objects.filter(id__in=iop.values('container'))
    values = iop.order_by('kind').values('kind')
    # Annotate values with count of interactions
    summary = values.annotate(count=Count('id'))

    tags = InteractionNode.objects.filter(
        interaction__kind='tag',
        interaction__page=current_page,
        interaction__approved=True
    ).exclude(
        interaction__container__item_type='question'
    )

    ordered_tags = tags.order_by('body')
    tagcounts = ordered_tags.annotate(tag_count=Count('interaction'))
    toptags = tagcounts.order_by('-tag_count')[:15].values('id','tag_count','body')

    result_dict = dict(
            id=current_page.id,
            summary=summary,
            toptags=toptags,
            urlhash = urlhash,
            containers=containers
        )
    return result_dict
    
    
    
def getKnownUnknownContainerSummaries(page_id, hashes, crossPageHashes):
    page = Page.objects.get(id=page_id)
    #logger.info("KNOWN UNKNOWN PAGE ID: " + str(page_id))
    containers = list(Container.objects.filter(hash__in=hashes).values_list('id','hash','kind'))
    #logger.info("CONTAINERS: " + str(containers))
    ids = [container[0] for container in containers]
    interactions = list(Interaction.objects.filter(
        container__in=ids,
        page=page,
        approved=True
    ).select_related('interaction_node','content','user',('social_user')))
    #logger.info("K/U I: " + str(interactions))
    known = getContainerSummaries(interactions, containers)

    # crossPageHashes
    if len(crossPageHashes) > 0:
        crossPageContainers = list(Container.objects.filter(hash__in=crossPageHashes).values_list('id','hash','kind'))
        crossPageIds = [container[0] for container in crossPageContainers]
        crossPageInteractions = list(Interaction.objects.filter(
            container__in=crossPageIds,
            page__site__group = page.site.group,
            # page__in=group_page_ids,
            approved=True
        ).select_related('interaction_node','content','user',('social_user')))

        crossPageKnown = getContainerSummaries(crossPageInteractions, crossPageContainers, isCrossPage=True)

        
    unknown = list(set(hashes) - set(known.keys()))
    if 'crossPageKnown' in locals():
        cacheable_result = dict(known=known, unknown=unknown, crossPageKnown=crossPageKnown)
    else:
        cacheable_result = dict(known=known, unknown=unknown, crossPageKnown="")
    return cacheable_result

def getSettingsDict(group):
    settings_dict = model_to_dict(
         group,
         exclude=[
             'admins',
             'word_blacklist',
             'blocked_tags',
             'all_tags',
             'approved',
             'requires_approval',
             'share',
             'rate',
             'comment',
             'bookmark',
             'search',
             'logo_url_sm',
             'logo_url_med',
             'logo_url_lg',
             'sharebox_digg',
             'sharebox_facebook',
             'sharebox_fade',
             'sharebox_google',
             'sharebox_reddit',
             'sharebox_selector',
             'sharebox_should_own',
             'sharebox_show',
             'sharebox_stumble',
             'sharebox_twitter']
     )
    
    blessed_tags = InteractionNode.objects.filter(
         groupblessedtag__group=group.id
     ).order_by('groupblessedtag__order')
    
    settings_dict['blessed_tags'] = blessed_tags
    return settings_dict



def getGlobalActivity():
    makeItLean = True
    historyLen = 5 if makeItLean else 30
    maxInteractions = 200 if makeItLean else None

    today = datetime.now()
    tdelta = timedelta(days = -historyLen)
    the_past = today + tdelta
    interactions = Interaction.objects.all()
    interactions = interactions.filter(
        created__gt = the_past, 
        kind = 'tag', 
        approved=True, 
        page__site__group__approved=True
    ).order_by('-created')[:maxInteractions]
    
    users = {}
    pages = {}
    groups = {}
    nodes ={}
    for inter in interactions:
        if not groups.has_key(inter.page.site.group.name):
            groups[inter.page.site.group.name] = {'count': 1, "group":model_to_dict(inter.page.site.group, 
                                                                                    fields=['id', 'short_name'])}
        else:
            groups[inter.page.site.group.name]['count'] +=1
            
        if not pages.has_key(inter.page.url):
            pages[inter.page.url] = {'count': 1, "page":model_to_dict(inter.page, fields=['id', 'title'])}
        else:
            pages[inter.page.url]['count'] +=1
        
        if not inter.user.email.startswith('tempuser'):    
            if not users.has_key(inter.user.id):
                user_dict = model_to_dict(inter.user, exclude=['username','user_permissions', 
                                                               'last_login', 'date_joined', 'email',
                                                                'is_superuser', 'is_staff', 'password', 'groups'])
                user_dict['social_user'] = model_to_dict(inter.user.social_user, exclude=['notification_email_option', 
                                                                                          'gender', 'provider', 
                                                                                          'bio', 'hometown', 'user',
                                                                                          'follow_email_option'])
                users[inter.user.id] = {'count': 1, "user":user_dict}
            else:
                users[inter.user.id]['count'] +=1
            
        if not nodes.has_key(inter.interaction_node.body):
            nodes[inter.interaction_node.body] = {'count': 1}
        else:
            nodes[inter.interaction_node.body]['count'] +=1
        
            
    return {'nodes':nodes, 'users':users, 'groups':groups, 'pages':pages}

def getSummary(interactions, container=None, content=None, page=None, data=None, isCrossPage=False):
    if not data: data = {}
    counts = {}
    if container:
        data['kind'] = container[2]
    if content:
        data['id'] = content[0]
        data['body'] = content[1]
        data['kind'] = content[2]
        data['location'] = content[3]

    if container:
        container = container[0]
        interactions = filter(lambda x: x.container_id==container, interactions)
    elif content:
        content = content[0]
        interactions = filter(lambda x: x.content_id==content, interactions)
    elif page:
        interactions = filter(lambda x: x.page==page, interactions)

    # Filter tag and comment interactions
    tags = filter(lambda x: x.kind=='tag', interactions)
    comments = filter(lambda x: x.kind=='com', interactions)

    counts['tags'] = len(tags)
    counts['coms'] = len(comments)
    counts['interactions'] = len(interactions)
    data['counts'] = counts
    data['id'] = container if container else content
    
    tag_counts = dict((
        (tag.interaction_node.id, getTagSummary(tag.interaction_node, tags)) for tag in tags
    ))
    sorted_counts = sorted(tag_counts.items(), key=lambda x: x[1]['count'], reverse=True)

    tag_limit = 500 if isCrossPage else 10
    top_tags = dict((
        tag for tag in sorted_counts[:tag_limit]
    ))

    top_interactions = {}
    top_interactions['tags'] = top_tags
    top_interactions['coms'] = [dict(id=comment.id, tag_id=comment.parent.interaction_node.id, content_id=comment.content.id, user=comment.user, body=comment.interaction_node.body) for comment in comments]
    for comment in top_interactions['coms']:
        try:
            comment['social_user'] = comment['user'].social_user
        except SocialUser.DoesNotExist:
            comment['social_user'] = {}
        
    data['top_interactions'] = top_interactions

    return data

def getContainerSummaries(interactions, containers, isCrossPage=False):
    data = dict((
        (container[1], getSummary(interactions, container=container, isCrossPage=isCrossPage)) for container in containers    
    ))
    return data

def getContentSummaries(interactions, content, isCrossPage=False):
    data = dict((
        (content_item[0], getSummary(interactions, content=content_item, isCrossPage=isCrossPage)) for content_item in content
    ))
    return data
