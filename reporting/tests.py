from django.test import TransactionTestCase
from django.core import mail

from antenna.rb.factories import SocialUserFactory, GroupFactory

from . import tasks


class GroupWeeklyEmailTest(TransactionTestCase):
    fixtures = ['seed.json']

    def setUp(self):
        self.group = GroupFactory(
            admins=SocialUserFactory.create_batch(3),
            approved=True,
            activated=True
        )

    def test_email_sent(self):
        self.assertSendsAnEmail(
            lambda: tasks.group_weekly_email(self.group)
        )

    def test_email_sent_to_the_group_admins(self):
        tasks.group_weekly_email(self.group)
        email = mail.outbox[0]

        self.assertIn(self.group.admin_emails(), email.to)

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
