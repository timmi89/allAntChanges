from __future__ import print_function
import logging
import requests
import json
import calendar
from datetime import datetime, timedelta

from django.template import Context
from django.template.loader import get_template
from django.core.mail import EmailMultiAlternatives
from django.core.exceptions import ObjectDoesNotExist
from celery.decorators import periodic_task
from celery.task.schedules import crontab

from antenna.rb.models import Group, Content

logger = logging.getLogger('rb.standard')


@periodic_task(name='reporting.weekly.email.report', ignore_result=True,
               run_every=(crontab(hour="5", minute="30", day_of_week="1")))
def weekly_email_report():
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=7)

    groups = Group.objects.all()

    # TODO: batch groups
    for group in groups:
        group_weekly_email(
            group,
            calendar.timegm(start_date) * 1000,
            calendar.timegm(end_date) * 1000
        )


def group_weekly_email(group, start_date, end_date):
    group_context = GroupReportContext(
        'http://nodebq.docker',
        group,
        start_date,
        end_date
    )

    if(group_context.page_views_count < 250):
        return

    message = 'Testing django email lib'
    from_email = 'broadcast@antenna.is'

    subject = 'Test Weekly Broadcast'
    recipient_list = group.admin_emails()

    template = get_template('emails/publisher_content_report.html')
    body = template.render(Context(group_context.to_hash()))

    send_mail(subject, message, from_email, recipient_list, html_message=body)
    logger.debug(
        'Sent group email report to group "{}"'.format(group.short_name))


def send_mail(subject, text, from_email, to, html_message=None):
    """
    Replace with django.core.mail.send_mail after upgrading django
    """
    msg = EmailMultiAlternatives(subject, text, from_email, to)

    if html_message:
        msg.attach_alternative(html_message, "text/html")

    msg.send()


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
