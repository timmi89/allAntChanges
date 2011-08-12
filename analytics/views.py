from rb.models import *
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from datetime import datetime
from django.db.models import Count, Sum
from django.core import serializers
from piston.handler import AnonymousBaseHandler

def analytics(request, short_name=None):
    group = Group.objects.get(short_name=short_name)
    context = {}
    context['group'] = group
    return render_to_response("analytics.html", context)

def analytics_request(func):
    def wrapper(self, request, *args, **kwargs):
        params = request.GET
        data = {}
        data['start'] = params.get('start', None)
        data['end'] = params.get('end', None)
        data['max_count'] = params.get('max_count', None)
        data['tag'] = params.get('tag', None)
        return func(self, request, data, *args, **kwargs)
    return wrapper
    
class InteractionNodeHandler(AnonymousBaseHandler):
    model = InteractionNode
    fields = ('id', 'body', 'kind')
    
class AnalyticsHandler(AnonymousBaseHandler):
    @analytics_request
    def read(self, request, data, short_name, **kwargs):
        interactions = Interaction.objects.all()
        group = Group.objects.get(short_name=short_name)
        interactions = interactions.filter(page__site__group=group)
    
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
        content = content[:max_count] if data['max_count'] else content[:10]
        
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
        
        interactions = interactions[:max_count] if data['max_count'] else interactions[:10]

        return interactions
        
class ActiveHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        subject = kwargs['subject']
        grouped = interactions.order_by(subject).values(subject)
        active = grouped.annotate(count=Count('id')).order_by('-count')
        active = active[:max_count] if data['max_count'] else active[:10]
        
        active_subjects = []
        
        for active_subject in active:
            if subject == 'user':
                active_subjects.append(
                    (active_subject, SocialUser.objects.get(user=active_subject['user']))
                )
            elif subject == 'page':
                active_subjects.append(
                    (active_subject, Page.objects.get(id=active_subject['page']))
                )
            elif subject == 'content':
                active_subjects.append(
                    (active_subject, Content.objects.get(id=active_subject['content']))
                )
                
        return active_subjects

class RecentHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        page_ids = interactions.order_by('page').values('page')
        pages = Page.objects.filter(id__in=page_ids)
        pages = pages[:max_count] if data['max_count'] else pages[:10]
        return pages

class TaggedHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        tagged_interactions = interactions.filter(interaction_node__id=data['tag'])
        page_ids = tagged_interactions.order_by('page').values('page')
        pages = Page.objects.filter(id__in=page_ids)
        pages = pages[:max_count] if data['max_count'] else pages[:10]
        return pages

class FrequencyHandler(AnalyticsHandler):
    def process(self, interactions, data, **kwargs):
        select_data = {"period": """strftime('%%m/%%d/%%Y:%%H', created)"""}
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