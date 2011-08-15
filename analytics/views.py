from itertools import groupby
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
        # All Analytics Handler's have access to these
        data['start'] = params.get('start', None)
        data['end'] = params.get('end', None)
        data['max_count'] = params.get('max_count', None)
        
        # Pass in either tag body or tag id
        data['tag'] = params.get('tag', None)
        data['tag_id'] = params.get('tag_id', None)
        return func(self, request, data, *args, **kwargs)
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
                active_subjects.append({
                    'counts': active_subject,
                    subject: SocialUser.objects.get(user=active_subject['user'])
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
        periods = {}
        for (period, interactions) in groupby(interactions, key=lambda x:x.getCreated()):
            