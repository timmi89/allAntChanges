from __future__ import print_function
import json
import logging
import requests
import calendar
import settings

from functools import partial

from django.template import Context
from django.template.loader import get_template
from django.core.exceptions import ObjectDoesNotExist

from antenna.rb.models import Content
from .utils import engagement_score, unique_content_filter

logger = logging.getLogger('rb.standard')


class GroupReport():
    def __init__(self, host, group, start_date, end_date, template):
        self.host = host
        self.group = group
        self.start_date = start_date
        self.end_date = end_date
        self.template = template

    @property
    def subject(self):
        return 'Antenna %s Report for %s' % (
            self.report_period, self.short_name)

    @property
    def from_email(self):
        return 'broadcast@antenna.is'

    @property
    def recipients(self):
        return ['brian@antenna.is', 'porter@antenna.is']  # self.group.admin_emails()

    @property
    def text(self):
        return self.subject

    @property
    def html(self):
        template = get_template(self.template)
        return template.render(Context(self.to_context()))

    def to_context(self):
        return {
            "short_name": self.short_name,
            "report_period": self.report_period,
            "reactions_count": self.reactions_count,
            "reaction_views_count": self.reaction_views_count,
            "top_reactions": self.top_reactions,
            "popular_pages": self.popular_pages,
            "popular_content": self.popular_content,
            "base_url": self.base_url,
        }

    @property
    def short_name(self):
        return self.group.short_name

    @property
    def report_period(self):
        return "weekly"

    @property
    def reactions_count(self):
        res = self._get('/reactionCount')
        return int(res['reactionCount'])

    @property
    def reaction_views_count(self):
        res = self._get('/reactionViewCount')
        return int(res['reactionViewCount'])

    @property
    def page_views_count(self):
        res = self._get('/pageViewCount')
        return int(res['pageViewCount'])

    @property
    def top_reactions(self):
        res = self._get('/topReactions')
        reactions = [
            reaction
            for reaction in res['reactions']
            if self.group.blocked_tags.filter(
                body=reaction['body']
            ).count() == 0
        ]
        return reactions

    @property
    def popular_pages(self):
        res = self._get('/popularPages')

        popular_pages = sorted(
            res['popularPages'],
            key=engagement_score,
            reverse=True
        )

        return popular_pages

    @property
    def popular_content(self):
        res = self._get('/popularContent')

        popular_content = sorted(
            res['popularContent'],
            key=engagement_score,
            reverse=True
        )

        # Populate popularContent with content objects
        for content in popular_content:
            content['content'] = self.content_by_id(content['content_id'])

        # Filter out unknown content
        popular_content = filter(
            lambda c: c['content'] != None,
            popular_content
        )

        # Ensure unique content
        popular_content = filter(
            partial(unique_content_filter, set()),
            popular_content
        )

        # Only include text and image content
        popular_content = filter(
            lambda c: c['content_kind'] in ('text', 'img'),
            popular_content
        )

        return popular_content

    @property
    def base_url(self):
        return settings.BASE_URL_SECURE

    def content_by_id(self, content_id):
        try:
            return Content.objects.get(pk=content_id)
        except ObjectDoesNotExist:
            return None

    def _get(self, path):
        start_date = calendar.timegm(self.start_date.timetuple()) * 1000
        end_date = calendar.timegm(self.end_date.timetuple()) * 1000

        res = requests.get(self.host + path, {
            "json": json.dumps({
                "gid": self.group.id,
                "start_date": start_date,
                "end_date": end_date
            })
        })
        return res.json()
