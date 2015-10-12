import random
#from django.db import models
import logging
logger = logging.getLogger('rb.standard')

class SyncRouter(object):
    """A router that sets up a simple master/slave configuration"""

    def db_for_read(self, model, **hints):
        logger.info('read: ' + str(hints))
        logger.info('read model: ' + str(model))
        return 'default'

    def db_for_write(self, model, **hints):
        logger.info('write: ' + str(hints))
        logger.info('write model: ' + str(model))
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        logger.info(hints)
        return True

    def allow_syncdb(self, db, model):
        "Explicitly put all models on all databases."
        
        return True
    
class MasterSlaveRouter(object):
    """A router that sets up a simple master/slave configuration"""

    def db_for_read(self, model, **hints):
        "Point all read operations to a random slave"
        return random.choice(['default', 'readonly1', 'readonly2'])

    def db_for_write(self, model, **hints):
        "Point all write operations to the master"
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        "Allow any relation between two objects in the db pool"
        db_list = ('default','readonly1', 'readonly2')
        if obj1._state.db in db_list and obj2._state.db in db_list:
            return True
        return None

    def allow_syncdb(self, db, model):
        "Explicitly put all models on all databases."
        return False
