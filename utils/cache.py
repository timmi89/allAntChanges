from antenna.chronos.jobs import *
from antenna.rb.models import *
from antenna.api.utils import *

from threading import Thread
logger = logging.getLogger('rb.standard')

def clear_interaction_caches(page, container):
    try:
        cache_updater = PageDataCacheUpdater(method="delete", page_id=page.id)
        t = Thread(target=cache_updater, kwargs={})
        t.start()

        cache_updater = PageDataNewerCacheUpdater(method="delete", page_id=page.id)
        t = Thread(target=cache_updater, kwargs={})
        t.start()
        
        container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=page.id)
        t = Thread(target=container_cache_updater, kwargs={})
        t.start()
        
        page_container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=str(page.id),hashes=[container.hash])
        t = Thread(target=page_container_cache_updater, kwargs={})
        t.start()

        other_interactions = list(Interaction.objects.filter(
                    container=container,
                    page__site__group = page.site.group,
                    approved=True
                    ))

        other_pages = set()
        for other in other_interactions:
            other_pages.add(other.page)
        for other_page in other_pages:
            cache_updater = PageDataCacheUpdater(method="delete", page_id=other_page.id)
            t = Thread(target=cache_updater, kwargs={})
            t.start()

            cache_updater = PageDataNewerCacheUpdater(method="delete", page_id=other_page.id)
            t = Thread(target=cache_updater, kwargs={})
            t.start()
        
            container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=other_page.id)
            t = Thread(target=container_cache_updater, kwargs={})
            t.start()
        
            page_container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=str(other_page.id),hashes=[container.hash])
            t = Thread(target=page_container_cache_updater, kwargs={})
            t.start()

    except Exception, e:
        logger.warning(traceback.format_exc(50))   
    