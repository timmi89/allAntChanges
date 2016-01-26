import datetime
import json

from django.test import TransactionTestCase
from django.core import mail

from httmock import urlmatch, HTTMock

from antenna.rb.factories import SocialUserFactory, GroupFactory, ContentFactory

from . import tasks, models


class GroupWeeklyEmailTest(TransactionTestCase):
    fixtures = ['seed.json']

    def setUp(self):
        self.group = GroupFactory(
            admins=SocialUserFactory.create_batch(3),
            approved=True,
            activated=True
        )

        self.start_date = datetime.datetime(2016, 01, 01, 0, 0)
        self.end_date = datetime.datetime(2016, 01, 30, 0, 0)

        self.group_report = models.GroupReport(
            'http://nodebq.test',
            self.group,
            self.start_date,
            self.end_date,
            'emails/publisher_content_report.html'
        )

        self.content = ContentFactory()

        @urlmatch(netloc=r'nodebq.test')
        def nodebq_mock(url, request):
            nodebq_data = {
                '/reactionCount': {'reactionCount': 5},
                '/reactionViewCount': {'reactionViewCount': 50},
                '/pageViewCount': {'pageViewCount': 300},
                '/topReactions': {'reactions': [{
                    'body': 'Tested',
                    'count': 5,
                }]},
                '/popularPages': {'popularPages': [{
                    'page_id': 1,
                    'page_title': 'Test Page',
                    'pageview_count': 500,
                    'reaction_count': 5,
                    'reaction_view_count': 50,
                    'url': 'http://www.example.com/test_page.html',
                }]},
                '/popularContent': {'popularContent': [{
                    'content_id': self.content.id,
                    'content_kind': "text",
                    'hash': "85cb371d706dff31a02fe2c7c11b0253",
                    'page_title': 'Test Page',
                    'reaction_count': 5,
                    'reaction_view_count': 50,
                    'url': 'http://www.example.com/test_page.html',
                }]},
            }

            return json.dumps(nodebq_data[url.path])

        self.nodebq_mock = nodebq_mock

    def test_email_sent(self):
        with HTTMock(self.nodebq_mock):
            self.assertSendsAnEmail(
                lambda: tasks.group_weekly_email(self.group_report)
            )

    def test_email_sent_to_the_group_admins(self):
        with HTTMock(self.nodebq_mock):
            tasks.group_weekly_email(self.group_report)
            email = mail.outbox[0]

            self.assertEqual(self.group.admin_emails(), email.to)

    def test_email_contains_nodebq_data(self):
        with HTTMock(self.nodebq_mock):
            tasks.group_weekly_email(self.group_report)
            email = mail.outbox[0]

            self.assertIn(
                self.content.body,
                email.alternatives[0][0],
            )

    def assertSendsAnEmail(self, function):
        """
        Assert that the passed function sends an email
        """
        before_inbox_count = len(mail.outbox)
        function()
        after_inbox_count = len(mail.outbox)

        self.assertEqual((before_inbox_count + 1), after_inbox_count, """
                         The supplied function did not send an email
                         """)
