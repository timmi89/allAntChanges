from itertools import groupby
from rb.models import *
from models import *
import tasks
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from datetime import datetime
from django.db.models import Count, Sum
from django.forms.models import model_to_dict
from django.core import serializers
from django.core.cache import cache
from piston.handler import AnonymousBaseHandler
from settings import DEBUG, FACEBOOK_APP_ID
from authentication.decorators import requires_admin, requires_admin_super
from django.template import RequestContext
from authentication.token import checkCookieToken
import logging, json
logger = logging.getLogger('rb.standard')



@requires_admin
def analytics(request, short_name=None, **kwargs):
    context = {}
    context['group'] = Group.objects.get(short_name=short_name)
    context['fb_client_id'] = FACEBOOK_APP_ID
    context['cookie_user'] = kwargs['cookie_user']
    context['hasSubheader'] = True

    return render_to_response(
        "analytics.html",
        context,
        context_instance=RequestContext(request)
    )

def analytics_request(func):
    def wrapper(self, request, *args, **kwargs):
        params = request.GET
        group = Group.objects.get(short_name=kwargs['short_name'])
        data = {}
        # All Analytics Handler's have access to these
        data['start'] = params.get('start', None)
        data['end'] = params.get('end', None)
        data['max_count'] = params.get('max_count', None)
        data['page_id'] = params.get('page_id', None)
        
        # Pass in either tag body or tag id
        data['tag'] = params.get('tag', None)
        data['tag_id'] = params.get('tag_id', None)
        return func(self, request, data, group, *args, **kwargs)
    return wrapper

def maxCap(query_set, data):
    if 'max_count' in data:
        return query_set[:data['max_count']]
    else:
        return query_set[:10]

class InteractionNodeHandler(AnonymousBaseHandler):
    model = InteractionNode
    fields = ('id', 'body', 'kind')
    
class AnalyticsHandler(AnonymousBaseHandler):
    @requires_admin
    @analytics_request
    def read(self, request, data, group, **kwargs):
        interactions = Interaction.objects.all()
        interactions = interactions.filter(page__site__group=group)
        
        # Page specific filters
        if data['page_id']:
            page = Page.objects.get(id=data['page_id'])
            interactions = interactions.filter(page=page)
        
        # Date range filters    
        if data['start']:
            interactions = interactions.filter(
                created__gte=datetime.strptime(data['start'], "%m/%d/%y")
            )
        if data['end']:
            interactions = interactions.filter(
                created__lte=datetime.strptime(data['end'], "%m/%d/%y")
            )

        return self.process(interactions, data, **kwargs)
    
class PopularContentHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        kind_interactions = interactions.filter(kind=kwargs['kind'])
        kind_interactions = kind_interactions.select_related('content')
        content = kind_interactions.order_by('content__body').values('content__id', 'content__body')
        content = content.annotate(count=Count('id')).order_by('-count')
        content = maxCap(content, data)
        
        result = []
        
        for content_item in content:
            content_interactions = interactions.filter(content=content_item['content__id'])
            nodes = content_interactions.order_by('interaction_node').values('interaction_node__body')
            nodes = nodes.annotate(count=Count('id'))
            result.append((content_item, {'related_reactions': nodes}))

        return result    
    
class PopularTagHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        interactions = interactions.filter(kind='tag')
        interactions = interactions.select_related('interaction_node')
        interactions = interactions.order_by('interaction_node__body').values('interaction_node__body')
        interactions = interactions.annotate(count=Count('id')).order_by('-count')
        
        interactions = maxCap(interactions, data)

        return interactions

class ActiveHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        subject = kwargs['subject']
        
        # Database level ordering
        grouped = interactions.order_by(subject)
        grouped_kinds = interactions.order_by(subject,'kind')
        
        # Values creates groupings
        values = grouped.values(subject)
        values_kinds = grouped_kinds.values(subject,'kind')
        
        # Annotate counts
        active_counts = values.annotate(total=Count('id')).order_by('-total')
        kinds_counts = values_kinds.annotate(count=Count('kind')).order_by('-count')
        
        active = maxCap(active_counts, data)
        active_subjects = []
        
        for active_subject in active:
            
            # Generate kind breakdown and add to current subject's dictionary
            kind_breakdown = dict([
                (kind_group['kind'], kind_group['count'])
                for kind_group in kinds_counts
                if kind_group[subject] == active_subject[subject]
            ])
            active_subject.update(kind_breakdown)
            
            # Get relevant subject meta data from respective table
            if subject == 'user':
                try:
                    u = SocialUser.objects.get(user=active_subject['user'])
                except SocialUser.DoesNotExist:
                    continue
                active_subjects.append({
                    'counts': active_subject,
                    subject: u
                })
            elif subject == 'page':
                active_subjects.append({
                    'counts': active_subject, 
                    subject: Page.objects.get(id=active_subject['page'])
                })
            elif subject == 'content':
                active_subjects.append({
                    'counts': active_subject, 
                    subject: Content.objects.get(id=active_subject['content'])
                })
                
        return active_subjects

class RecentHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        page_ids = interactions.order_by('page').values('page')
        pages = Page.objects.filter(id__in=page_ids)
        pages = maxCap(pages, data)
        return pages

class TaggedHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        if data['tag_id']:
            tagged_interactions = interactions.filter(interaction_node__id=data['tag_id'])
        elif data['tag']:
            tagg_interactions = interactions.filter(interaction_node__body=data['tag'])
        page_ids = tagged_interactions.order_by('page').values('page')
        pages = Page.objects.filter(id__in=page_ids)
        pages = maxCap(pages, data)
        return pages

class FrequencyHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        if DEBUG:
            select_data = {"period": """strftime('%%m/%%d/%%Y:%%H:00', created)"""}
        else:
            select_data = {"period": """DATE_FORMAT(created, '%%m/%%d/%%Y:%%H:00')"""}
            
        interaction_sets = interactions.extra(select=select_data).values('period','kind').annotate(count=Count('kind')).order_by()

        periods = {}

        for interaction_set in interaction_sets:
            period = interaction_set['period']
            if period not in periods:
                periods[period] = []
            periods[period].append(
                dict([(interaction_set['kind'],interaction_set['count'])])
            )

        return periods
            

# @requires_admin_super
def analytics_inhouse(request, **kwargs):
    context = {}
    # context['fb_client_id'] = FACEBOOK_APP_ID
    # context['cookie_user'] = kwargs['cookie_user']

    return render_to_response(
        "analytics_inhouse.html",
        context,
        context_instance=RequestContext(request)
    )

def inhouse_analytics_request(func):
    def wrapper(self, request, *args, **kwargs):
        params = request.GET
        data = {}
        # All Analytics Handler's have access to these
        data['start'] = params.get('start', None)
        data['end'] = params.get('end', None)
        data['max_count'] = params.get('max_count', None)
        data['page_id'] = params.get('page_id', None)
        
        # Pass in either tag body or tag id
        data['tag'] = params.get('tag', None)
        data['tag_id'] = params.get('tag_id', None)
        return func(self, request, data, *args, **kwargs)
    return wrapper


# [ec] mostly a quick copy of AnalyticsHandler.  Refactor later.
class InhouseAnalyticsHandler(AnonymousBaseHandler):
    # @requires_admin_super
    @inhouse_analytics_request
    def read(self, request, data, **kwargs):
        interactions = Interaction.objects.all()
        # dont filter byfor this.
        # interactions = interactions.filter(page__site_group)
        
        # Page specific filters
        if data['page_id']:
            page = Page.objects.get(id=data['page_id'])
            interactions = interactions.filter(page=page)
        
        # Date range filters    
        if data['start']:
            interactions = interactions.filter(
                created__gte=datetime.strptime(data['start'], "%m/%d/%y")
            )
        if data['end']:
            interactions = interactions.filter(
                created__lte=datetime.strptime(data['end'], "%m/%d/%y")
            )

        return self.process(interactions, data, **kwargs)

class InhouseAnalyticsJSONHandler(InhouseAnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        
        page_ids = interactions.order_by('page').values('page')
        pages = Page.objects.filter(id__in=page_ids)

        site_ids = pages.order_by('site').values('site')
        sites = Site.objects.filter(id__in=site_ids)

        return sites
    
@requires_admin_super
def global_snapshot(request):
    context = {}
    
    active_groups = tasks.get_approved_active_groups()
    active_approved = []
    for group in active_groups:
        group_info = {}
        group_info['group_id'] = group.id
        group_info['group'] = model_to_dict(group)
        try:
            group_info['ABsld'] = json.loads(JSONGroupReport.objects.filter(group=group, kind='ABsld').order_by('-created')[0].body)
        except:
            group_info['ABsld']  = {}  #not in template, yet
        try:
            group_info['tvhrc'] = json.loads(JSONGroupReport.objects.filter(group=group, kind='tvhrc').order_by('-created')[0].body)
        except Exception, ex:
            group_info['tvhrc'] = []
        try:
            group_info['mrcon'] = json.loads(JSONGroupReport.objects.filter(group=group, kind='mrcon').order_by('-created')[0].body)
        except Exception, ex:
            group_info['mrcon'] = []
        try:
            group_info['guser'] = json.loads(JSONGroupReport.objects.filter(group=group, kind='guser').order_by('-created')[0].body)
        except Exception, ex:
            group_info['guser'] = []
            
        try:
            group_info['A_page_ratio'] = float(group_info['ABsld']['A_script_loads']) / float(group_info['guser']['A_user_count'])
            group_info['B_page_ratio'] = float(group_info['ABsld']['B_script_loads']) / float(group_info['guser']['B_user_count'])
            group_info['engage_ratio'] = float(group_info['guser']['engaged_user_count'])  / float(group_info['guser']['A_user_count'])
            
        except Exception, ex:
            group_info['A_page_ratio'] = 0
            group_info['B_page_ratio'] = 0
            group_info['engage_ratio'] = 0
            
        active_approved.append(group_info)
        
    context['num_active_groups'] = len(active_groups)
    context['active_approved'] = active_approved
    
    return render_to_response(
        "global_snapshot.html",
        context,
        context_instance=RequestContext(request)
    )

class RecirculationModuleHandler(InhouseAnalyticsHandler):
    
    def read(self, request, data, group_id, **kwargs):
        cached_report = cache.get('group_recirc_' + str(group_id))
        if cached_report is None:
            group = Group.objects.get(id=int(group_id))
            cached_report = JSONGroupReport.objects.filter(kind='recrc', group=group).order_by('-created')[0].body
            cache.set('group_recirc_' + str(group_id), cached_report.body)
            
        return cached_report