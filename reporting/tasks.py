from __future__ import print_function
import logging
from datetime import datetime, timedelta

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from celery.decorators import periodic_task
from celery.task.schedules import crontab

from antenna.rb.models import Group, Interaction
from antenna.reporting.models import GroupReport

logger = logging.getLogger('rb.standard')


@periodic_task(name='reporting.weekly.email.report', ignore_result=True,
               run_every=(crontab(hour="19", minute="30", day_of_week="wednesday")))
def weekly_email_report():
    end_date = datetime.combine(
        datetime.utcnow().date(), datetime.min.time())
    start_date = datetime.combine(
        end_date - timedelta(days=7), datetime.min.time())

    groups = Group.objects.all()

    # TODO: batch groups
    for group in groups:
        try:
            # Skip perezhilton.com groups per porter
            if group.id in [2471, 2504]:
                continue

            group_context = GroupReport(
                settings.EVENTS_URL,
                group,
                start_date,
                end_date,
                'emails/publisher_content_report.html'
            )

            if(
                Interaction.objects.filter(
                    page__site__group=group,
                    created__range=[start_date, end_date],
                    approved=True).count() > 10 and
                group_context.page_views_count > 250
            ):
                group_weekly_email(group_context)
        except:
            logger.exception(
                'Error running report for group ' + group.short_name)


def group_weekly_email(group_context):
    send_mail(
        group_context.subject,
        group_context.text,
        group_context.from_email,
        group_context.recipients,
        html_message=group_context.html)
    logger.debug(
        'Sent group email report to group "{}"'.format(
            group_context.short_name))


def send_mail(subject, text, from_email, to, html_message=None):
    """
    Replace with django.core.mail.send_mail after upgrading django
    """
    msg = EmailMultiAlternatives(subject, text, from_email, to)

    if html_message:
        msg.attach_alternative(html_message, "text/html")

    msg.send()
