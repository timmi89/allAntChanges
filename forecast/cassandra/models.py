import uuid
from cassandra.cqlengine import columns
from cassandra.cqlengine.models import Model
from cassandra.cqlengine.usertype import UserType

class EventsReportTestModel(Model):
    CASSANDRA_MODEL = True
    #read_repair_chance = 0.05 # optional - defaults to 0.1
    #group_id      = columns.UUID(primary_key=True, default=uuid.uuid4)
    group_id        = columns.Integer(partition_key=True, required=True)
    created_at      = columns.DateTime(primary_key=True,index=True, required=True)
    #description     = columns.Text(required=False)
    report          = columns.Map(columns.Text(), columns.Text())
    

class PageScore(Model):
    CASSANDRA_MODEL = True
    group_id        = columns.Integer(partition_key=True, required=True)
    page_id         = columns.Integer(primary_key=True,index=True, required=True)
    created_at      = columns.DateTime(primary_key=True,index=True, required=True)
    score           = columns.Integer()
    page_views      = columns.Integer()
    reaction_views  = columns.Integer()
    reactions       = columns.Integer()
    
class GroupPageScores(Model):
    CASSANDRA_MODEL = True
    group_id        = columns.Integer(partition_key=True, required=True)
    created_at      = columns.DateTime(primary_key=True,index=True, required=True)
    scores          = columns.Map(columns.Integer(), columns.Integer()) #page_id to score
    page_views      = columns.Map(columns.Integer(), columns.Integer()) #page_id to page_views
    reaction_views  = columns.Map(columns.Integer(), columns.Integer()) #page_id to reaction_views
    reactions       = columns.Map(columns.Integer(), columns.Integer()) #page_id to reactions
    

class LegacyGroupEventsReport(Model):
    CASSANDRA_MODEL = True
    group_id        = columns.Integer(partition_key=True, required=True)
    created_at      = columns.DateTime(primary_key=True,index=True, required=True)
    mobile          = columns.Boolean(default=False)
    text_map        = columns.Map(columns.Text(), columns.Text())
    count_map       = columns.Map(columns.Text(), columns.Integer())
    pop_topics      = columns.Set(columns.Text())
    pop_referers    = columns.Set(columns.Text())
    pop_content     = columns.Set(columns.Integer()) #content ids from mysql side
    pop_reactions   = columns.Set(columns.Integer()) #interaction ids
    reaction_comments   = columns.Map(columns.Integer(), columns.Text()) #pop reactions ids to text of comments?
    