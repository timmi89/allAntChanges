from __future__ import print_function
import logging
import requests
import json

from django.template import Context
from django.template.loader import get_template
from django.core.mail import EmailMultiAlternatives
from celery.decorators import periodic_task
from celery.task.schedules import crontab

from antenna.rb.models import Group

logger = logging.getLogger('rb.standard')


@periodic_task(name='reporting.weekly.email.report', ignore_result=True,
               run_every=(crontab(hour="5", minute="30", day_of_week="1")))
def weekly_email_report():
    # Process groups and send email reports
    groups = Group.objects.filter(approved=True, activated=True)

    for group in groups:
        group_weekly_email(group)


def group_weekly_email(group):
    message = 'Testing django email lib'
    from_email = 'broadcast@antenna.is'

    subject = 'Test Weekly Broadcast'
    recipient_list = ['brian@antenna.is']

    template = get_template('emails/publisher_content_report.html')
    body = template.render(Context(
        GroupReportContext('http://nodebq.docker', group).to_hash()
    ))

    send_mail(subject, message, from_email, recipient_list, html_message=body)
    logger.info(
        'Sent group email report to group "{}"'.format(group.short_name))


def send_mail(subject, text, from_email, to, html_message=None):
    """
    Replace with django.core.mail.send_mail after upgrading django
    """
    msg = EmailMultiAlternatives(subject, text, from_email, to)

    if html_message:
        out = open('mail.out.html', 'w')
        print(html_message, file=out)
        out.close()
        msg.attach_alternative(html_message, "text/html")

    msg.send()


class GroupReportContext():
    def __init__(self, host, group):
        self.host = host
        self.group = group

    def to_hash(self):
        return {
            "short_name": self.short_name,
            "report_period": self.report_period,
            "reactions_count": self.reactions_count,
            "reaction_views_count": self.reaction_views_count,
        }

    @property
    def short_name(self):
        return self.group.short_name

    @property
    def report_period(self):
        return "weekly"

    @property
    def reactions_count(self):
        res = requests.get(self.host + '/reactionCount', {
            "json": json.dumps({
                "gid": 2, "start_date": '01/01/2016', "end_date": '01/30/2016'
            })
        })
        print(res.text)
        return 0

    @property
    def reaction_views_count(self):
        return 0
