import uuid
from cassandra.cqlengine import columns
from cassandra.cqlengine.models import Model
from cassandra.cqlengine.usertype import UserType

   
    
class GroupPageScores(Model):
    CASSANDRA_MODEL = True
    group_id        = columns.Integer(partition_key=True, required=True)
    created_at      = columns.DateTime(primary_key=True,index=True, required=True)
    mobile          = columns.Boolean(index = True, default=False)
    scores          = columns.Map(columns.Integer(), columns.Integer()) #page_id to score
    page_views      = columns.Map(columns.Integer(), columns.Integer()) #page_id to page_views
    reaction_views  = columns.Map(columns.Integer(), columns.Integer()) #page_id to reaction_views
    reactions       = columns.Map(columns.Integer(), columns.Integer()) #page_id to reactions
    

class LegacyGroupEventsReport(Model):
    CASSANDRA_MODEL = True
    group_id        = columns.Integer(partition_key=True, required=True)
    created_at      = columns.DateTime(primary_key=True,index=True, required=True)
    report_start    = columns.DateTime(index=True, required=True)
    report_end      = columns.DateTime(index=True, required=True)
    mobile          = columns.Boolean(default=False)
    text_map        = columns.Map(columns.Text(), columns.Text())
    count_map       = columns.Map(columns.Text(), columns.Double())
    sorted_pages    = columns.List(columns.Integer())  #sorted page ids by score
    pop_topics      = columns.Set(columns.Text())
    pop_referers    = columns.Set(columns.Text())
    pop_content     = columns.Map(columns.Integer(), columns.Text()) #content ids from mysql side
    pop_reactions   = columns.Map(columns.Integer(), columns.Text()) #interaction ids
    reaction_comments   = columns.Map(columns.Integer(), columns.Text()) #probably needs to be serialize JSON... no nested containers
    