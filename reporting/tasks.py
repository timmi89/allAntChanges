import logging
import requests
from antenna.rb.models import Group
from celery.decorators import periodic_task
from django.core.mail import send_mail
from celery.task.schedules import crontab

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
    url = '/group/' + group.short_name + '/analytics_email/'

    send_mail(subject, message + url, from_email, recipient_list)
    logger.info(
        'Sent group email report to group "{}"'.format(group.short_name))
