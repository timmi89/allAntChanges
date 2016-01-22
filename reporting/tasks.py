from __future__ import print_function
import logging
import calendar
from datetime import datetime, timedelta

from django.template import Context
from django.template.loader import get_template
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from celery.decorators import periodic_task
from celery.task.schedules import crontab

from antenna.rb.models import Group
from antenna.reporting.contexts import GroupReportContext

logger = logging.getLogger('rb.standard')


@periodic_task(name='reporting.weekly.email.report', ignore_result=True,
               run_every=(crontab(hour="5", minute="30", day_of_week="1")))
def weekly_email_report():
    end_date = datetime.combine(
        datetime.utcnow().date(), datetime.min.time())
    start_date = datetime.combine(
        end_date - timedelta(days=7), datetime.min.time())

    groups = Group.objects.all()

    # TODO: batch groups
    for group in groups:
        try:
            group_weekly_email(
                group,
                calendar.timegm(start_date.timetuple()) * 1000,
                calendar.timegm(end_date.timetuple()) * 1000
            )
        except ValueError:
            logger.error('Error running report for group ' + group.short_name)


def group_weekly_email(group, start_date, end_date):
    group_context = GroupReportContext(
        settings.EVENTS_URL,
        group,
        start_date,
        end_date
    )

    if(group_context.page_views_count < 250):
        return

    message = 'Testing django email lib'
    from_email = 'broadcast@antenna.is'

    subject = 'Test Weekly Broadcast'
    recipient_list = ['brian@antenna.is', 'porter@antenna.is']  # group.admin_emails()

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
