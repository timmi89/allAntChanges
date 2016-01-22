from __future__ import print_function
import logging
import requests
import json

from django.core.exceptions import ObjectDoesNotExist

from antenna.rb.models import Content

logger = logging.getLogger('rb.standard')


class GroupReportContext():
    def __init__(self, host, group, start_date, end_date):
        self.host = host
        self.group = group
        self.start_date = start_date
        self.end_date = end_date

    def to_hash(self):
        return {
            "short_name": self.short_name,
            "report_period": self.report_period,
            "reactions_count": self.reactions_count,
            "reaction_views_count": self.reaction_views_count,
            "top_reactions": self.top_reactions,
            "popular_pages": self.popular_pages,
            "popular_content": self.popular_content
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
        return res['reactions']

    @property
    def popular_pages(self):
        res = self._get('/popularPages')
        return res['popularPages']

    @property
    def popular_content(self):
        res = self._get('/popularContent')

        # Populate popularContent with content objects
        for content in res['popularContent']:
            content['content'] = self.content_by_id(content['content_id'])

        return res['popularContent']

    def content_by_id(self, content_id):
        try:
            return Content.objects.get(pk=content_id)
        except ObjectDoesNotExist:
            return {"body": "unknown content id %s" % content_id}

    def _get(self, path):
        res = requests.get(self.host + path, {
            "json": json.dumps({
                "gid": self.group.id,
                "start_date": self.start_date,
                "end_date": self.end_date
            })
        })
        return res.json()
