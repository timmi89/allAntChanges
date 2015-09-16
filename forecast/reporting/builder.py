import settings
from antenna.rb.models import * 
from antenna.analytics.utils import OAuth2EventsUtility

import datetime, json, random

class BQQueryBuilder(object):
    """
    DOES NOT SUPPORT JOINS!!!
    ALL Methods other than get_result_rows should return self to allow chaining...
    Usage Example:
    group1 = Group.objects.get(id=1)
    group2 = Group.objects.get(id=2)
    builder = BQQueryBuilder().set_max_results(100).set_start_date(datetime.datetime.now() - datetime.timedelta(days=30))
    builder.set_end_date(datetime.datetime.now())
    ...
    builder.set_group(group1).build_query().run_query()
    group1_rows = builder.get_result_rows()
    builder.set_group(group2).build_query().run_query()
    group2_rows = builder.get_result_rows()
    """
    
    def __init__(self):
        self.event_util = OAuth2EventsUtility(kwargs={'projectNumber':settings.EVENTS_PROJECT_NUMBER, 
                                      'keyFile':settings.EVENTS_KEY_FILE,
                                      'serviceEmail' : settings.EVENTS_SERVICE_ACCOUNT_EMAIL})
        
        self.group = None
        self.query = None
        self.custom_query = None
        self.start_date = None
        self.end_date = None
        self.max_results = 250
        self.select_columns = []
        self.group_by = ''
        self.order_by = ''
        self.where_clause = None  #this should be a clause object
        self.limit = None
        self.rows = None
   

    def set_group(self, group):
        self.group = group
        return self
    
    def set_max_results(self, max_results):
        """defaults to 250 if not set"""
        self.max_results = max_results
        return self
    
    def set_start_date(self, start_date):
        """mandatory for everything but custom queries"""
        self.start_date = start_date
        return self
    def set_end_date(self, end_date):    
        """mandatory for everything but custom queries"""
        self.end_date = end_date
        return self
    
    def run_query(self):
        """Should throw runtime if minimum parameters have not been set"""
        if not self.custom_query and (self.query is None or len(self.select_columns) == 0):
            raise Exception('Query Not Built')
        request_body = self.event_util.get_request_body(self.query, self.max_results)
        self.rows = self.event_util.request_body_result_rows(request_body)
        return self
    
    def set_custom_query(self, custom_query):
        self.custom_query = custom_query
        return self
    
    def set_clause(self, clause):
        self.where_clause = clause
        return self
    
    def sel_col(self, column_name):
        self.select_columns.append(column_name)
        return self
    
    def sel_columns(self, column_names):
        self.select_columns.extend(column_names)
        return self
    
    def set_group_by(self, group_by):
        self.group_by = group_by
        return self
    def set_order_by(self, order_by):
        self.order_by = order_by
        return self
    
    def set_limit(self, limit):
        self.limit = limit
        return self
    
    def build_query(self):
        if self.custom_query:
            self.query = self.custom_query
            return self
        else:
            if len(self.select_columns) == 0:
                raise Exception('Query Not Buildable')
            select_str = 'select ' + ','.join(self.select_columns) + ' from '
            table_names = self.event_util.query_table_names_by_dates(self.group, self.start_date, self.end_date)
            self.query = select_str + table_names + ' where ' + self.where_clause.__str__()
            if self.group_by:
                self.query = self.query + ' ' + self.group_by
            if self.order_by:
                self.query = self.query + ' ' + self.order_by
            if self.limit:
                self.query = self.query + ' limit ' + str(self.limit)
        return self
    
    def get_query_str(self):
        return self.query
    
    def get_result_rows(self):
        return self.rows
    
    

class BQCrit(object):
    
    def __init__(self, column, operand, value):
        self.column = column
        self.operand = operand
        self.value = value
        
    def __str__(self):
        if self.column and self.operand and self.value:
            #TODO:  This needs to be addressed better
            if self.value == 'T': 
                return self.column + ' ' + self.operand + ' true'
            elif  self.value == 'F':
                return self.column + ' ' + self.operand + ' false'
            return self.column + ' ' + self.operand + ' "'  + self.value + '"'
        else:
            #this is probably a runtime, actually
            return ''
    

class BQClause(object):
    def __init__(self, left, operand = None, right = None):
        self.left = left
        self.operand = operand
        self.right = right
    
    def __str__(self):
        if self.left and self.operand and self.right:
            return '(' + self.left.__str__() + ' ' + self.operand + ' ' + self.right.__str__() + ')'
        else:
            return self.left.__str__()
    
class QueryJoiner(object): 
    def __init__(self, select_columns, left, left_alias, operand, right, right_alias, on_clause):
        self.select_columns = select_columns
        self.left = left
        self.left_alias = left_alias
        self.operand = operand
        self.right = right
        self.right_alias = right_alias
        self.on_clause = on_clause
        
    def __str__(self):
        query = 'select' + ' ' + ','.join(self.select_columns) + ' from ('
        query +=  self.left.__str__() + ') as ' +  self.left_alias + ' '
        query += self.operand + ' (' + self.right.__str__() + ') as ' + self.right_alias + ' on ' + self.on_clause
        return  query
           
"""
i.e.
et1 = BQCrit('et','=','re')
et2 = BQCrit('et','=','rs')
ev1 = BQCrit('ev','LIKE', 'rd%')
ev2 = BQCrit('ev','=', 'show')
et3 = BQCrit('et','=','sb')
ev3 = BQCrit('ev','=', 'vw')
cl1 = BQClause(et2, 'AND', ev1)
cl2 = BQClause(et3, 'AND', ev3)
cl3 = BQClause(et1, 'OR', cl1)
cla = BQClause(cl3, 'OR', cl2)
str(cla)
'((et = "re" OR (et = "rs" AND ev LIKE "rd%")) OR (et = "sb" AND ev = "vw"))'

"""        
        
    
    
    