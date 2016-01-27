import logging
import dateutil.parser

from django.conf import settings
from django.http import HttpResponse

from antenna.authentication.decorators import requires_admin
from antenna.rb.models import Group

from .models import GroupReport

logger = logging.getLogger('rb.standard')


@requires_admin
def weekly_email_report(
    request, short_name, **kwargs
):
    group = Group.objects.get(short_name=short_name)

    start_date_8601 = request.GET['start_date']
    end_date_8601 = request.GET['end_date']

    # Parse ISO 8601 - reverse `datetime.isoformat`
    start_date = dateutil.parser.parse(start_date_8601)
    end_date = dateutil.parser.parse(end_date_8601)

    group_context = GroupReport(
        settings.EVENTS_URL,
        group,
        start_date,
        end_date,
        'emails/publisher_content_report.html'
    )

    return HttpResponse(
        content=group_context.html,
        content_type='text/html',
    )
