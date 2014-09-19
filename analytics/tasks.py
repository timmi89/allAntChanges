import settings
from celery.task.schedules import crontab
from celery.decorators import periodic_task
from antenna.analytics.utils import OAuth2EventsUtility
import datetime, json
from antenna.rb.models import * 
from django.forms.models import model_to_dict
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

# A periodic task that will run every minute (the symbol "*" means every)
@periodic_task(run_every=(crontab(hour="*", minute="*/3", day_of_week="*")))
def group_event_stats():
    logger.info("Start group events task")
    event_util = OAuth2EventsUtility(kwargs={'projectNumber':settings.EVENTS_PROJECT_NUMBER, 
                                      'keyFile':settings.EVENTS_KEY_FILE,
                                      'serviceEmail' : settings.EVENTS_SERVICE_ACCOUNT_EMAIL})
    now = datetime.datetime.now()
    groups = Group.objects.filter(id__in=[2352,1441,1660]) #dlisted, fastcolabs, okayplayer
    group_data_sets = {}
    for group in groups:
        group_data = {}
        hash_tuples = event_util.get_top_reaction_view_hash_counts(group, now.month, now.year, 3)
        for hash_tuple in hash_tuples:
            interactions = Interaction.objects.filter(container__hash=hash_tuple[0])
            logger.info("Interactions for: " + hash_tuple[0] + " " + str(len(interactions)))
            node_counts = {}
            for interaction in interactions:
                if node_counts.has_key(interaction.content.body):
                    node_counts[interaction.content.body] = node_counts[interaction.content.body] + 1
                else:
                    node_counts[interaction.content.body] = 1
                node_counts['page'] = model_to_dict(interaction.page)
                node_counts['content'] = model_to_dict(interaction.content)
                node_counts['container'] = model_to_dict(interaction.container)
                node_counts['reaction_count'] = node_counts[interaction.content.body]
            node_counts['reaction_views'] = hash_tuple[1]
            group_data[hash_tuple[0]] = node_counts
            
        group_data_sets[group.id] = group_data
        logger.info(json.dumps(group_data, sort_keys=True,indent=4, separators=(',', ': ')))
    logger.info("Task GROUP EVENTS finished")
    
    