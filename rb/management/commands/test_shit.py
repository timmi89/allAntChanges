from django.core.management.base import BaseCommand, CommandError
from antenna.api import util_functions, utils
from antenna.rb.models import *
import logging, datetime
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        container_id = 209295
        page_id = 857806
        interactions = list(Interaction.objects.filter(
                    container=container_id,
                    page=page_id,
                    approved=True
                    ))
        for inter in interactions:
            print inter, inter.user, 'Content: ', inter.content,  'Node: ', inter.interaction_node.body
#        print 'by content body'
#        others = Interaction.objects.filter(content__body = 'about anything')
#        for inter in others:
#            print inter, inter.created, 'Page: ', inter.page.site, 'Container: ', inter.container, 'Content: ', inter.content, 'ContentBody: ' , inter.content.body, 'Kind: ' , inter.kind, 'Node: ', inter.interaction_node.body


            
