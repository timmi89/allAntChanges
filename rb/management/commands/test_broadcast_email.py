from django.core.management.base import BaseCommand, CommandError
from django.core.mail import send_mail
#from antenna.api import util_functions
from antenna.rb.models import *
from antenna.forecast.reporting.tasks import *
import logging, datetime
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        """
        subject = 'Test Antenna Broadcast'
        message = 'Testing django email lib'
        from_email = 'broadcast@antenna.is'
        recipient_list = ['michael@antenna.is']
        fail_silently = False
        auth_user = 'broadcast@antenna.is'
        auth_password = 'br04dc45t'
        html_message = '<html><head></head><body><b>Broadcast Strength</b></body></html>'
        send_mail(subject, message, from_email, recipient_list, fail_silently, auth_user, auth_password)
        """
        fail_silently = False
        auth_user = 'broadcast@antenna.is'
        auth_password = 'br04dc45t'
        message = 'Testing django email lib'
        from_email = 'broadcast@antenna.is'
        
        try:
            if len(args) > 0:
                gids = []
                for arg in args:
                    print arg
                    gids.append(int(arg))
                groups = Group.objects.filter(activated = True, approved = True, id__in = gids)
            else:
                groups = Group.objects.filter(activated = True, approved = True)
                
            for group in groups:
                group_weekly_email(group, fail_silently, auth_user, auth_password, message, from_email)
            
            
        except Exception, ex:
            traceback.print_exc(100)
        
        
        