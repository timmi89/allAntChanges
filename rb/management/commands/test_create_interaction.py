from django.core.management.base import BaseCommand, CommandError
from antenna.api import util_functions, utils
from antenna.rb.models import *
import logging, datetime
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        n = datetime.datetime.now()
        page = Page.objects.get(id=1986027)
        container = Container.objects.get(id=51250)
        content = Content.objects.get(id=501)
        user = User.objects.get(id=int(args[0]))
        kind = 'pag'
        interaction_node = InteractionNode.objects.get(id=23140)
        group = Group.objects.get(id=2504)
        print (datetime.datetime.now() - n).total_seconds()
        print utils.createInteraction(page, container, content, user, kind, interaction_node, group=group, parent=None)
        print (datetime.datetime.now() - n).total_seconds()
        n = datetime.datetime.now()
        print 'getSinglePageDataDict\n', util_functions.getSinglePageDataDict(1986027)
        t = datetime.datetime.now()
        td = t - n
        print td.total_seconds()
        
"""
select * from rb_interaction where page_id = 1986027 limit 3;
+--------+---------------------+---------------------+---------+---------+--------------+------------+---------------------+----------+-----------+-----------+------+---------------+------------+
| id     | created             | modified            | user_id | page_id | container_id | content_id | interaction_node_id | approved | anonymous | parent_id | kind | rank          | promotable |
+--------+---------------------+---------------------+---------+---------+--------------+------------+---------------------+----------+-----------+-----------+------+---------------+------------+
| 617978 | 2015-06-12 00:58:36 | 2015-06-12 00:58:36 |  786296 | 1986027 |       179245 |     178773 |               23140 |        1 |         0 |      NULL | tag  | 1434085116109 |          1 |
| 617985 | 2015-06-12 01:01:40 | 2015-06-12 01:01:40 |  786306 | 1986027 |       179248 |     178776 |               23140 |        1 |         0 |      NULL | tag  | 1434085300225 |          1 |
| 617986 | 2015-06-12 01:02:13 | 2015-06-12 01:02:13 |  616155 | 1986027 |       179249 |     178777 |               23140 |        1 |         0 |      NULL | tag  | 1434085333598 |          1 |
+--------+---------------------+---------------------+---------+---------+--------------+------------+---------------------+----------+-----------+-----------+------+---------------+------------+
"""      