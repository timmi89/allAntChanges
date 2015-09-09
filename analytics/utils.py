import settings
try:
    from apiclient.discovery import build
except ImportError, ie:
    from googleapiclient.discovery import build
from oauth2client.file import Storage
from oauth2client.client import AccessTokenRefreshError
from oauth2client.client import OAuth2WebServerFlow
from oauth2client.tools import run
import time, httplib2, json
from datetime import timedelta
from oauth2client.client import SignedJwtAssertionCredentials
import logging
logger = logging.getLogger('rb.standard')


class OAuth2EventsUtility(object):
    flow = None
    credentials = None
    http_auth = None
    service = None
    PROJECT_NUMBER = None
    KEY_FILE = None
    SERVICE_ACCOUNT_EMAIL = None
        
    def __init__(self, **kwargs):
        self.PROJECT_NUMBER = kwargs.get('projectNumber','774436620412')
        self.KEY_FILE = kwargs.get('keyFile','ssl/antenna_events.p12')
        self.SERVICE_ACCOUNT_EMAIL = kwargs.get('serviceEmail', 
                                '774436620412-esk3bm6ov5otu9kl49dsjke61b0rpv58@developer.gserviceaccount.com')
        self.authorize()
    
    def authorize(self):
        with open(self.KEY_FILE, 'r') as fd:
            key = fd.read()
               
        self.credentials = SignedJwtAssertionCredentials(self.SERVICE_ACCOUNT_EMAIL, key,
              scope="https://www.googleapis.com/auth/bigquery")

        assertion = self.credentials._generate_assertion()

        self.http_auth = self.credentials.authorize(httplib2.Http())
        self.service = build('bigquery', 'v2', http=self.http_auth)
        
    def refresh(self):
        self.credentials._do_refresh_request(self.http_auth.request)

    def get_top_reaction_view_hash_counts(self, group, start, end, maxResults = 100):
        
        query = 'select ch, count(ch) as counts  from %s where ch != "null" and et = "rs" and ev="rd" and %s group by ch order by counts desc'
        body = self.get_request_body(self.mod_query_for_dates(query, group, start, end), maxResults)
        try:
            result = self.service.jobs().query(projectId=int(self.PROJECT_NUMBER),body=body).execute()
            rows = result['rows']
            hash_tuples = []
            for row in rows:
                hash_tuples.append((row['f'][0]['v'],row['f'][1]['v'])) #hash, count
            return hash_tuples
        except Exception, ex:
            logger.warn(ex)
    

    
    def get_group_AB_script_loads(self, group, start, end, maxResults = 1, ab_group = 'A'):     
        query = 'select count(et) as counts  from %s where et = "sl" and ev = "' + ab_group + '" and %s'      
        rows = self.get_rows(self.mod_query_for_dates(query, group, start, end), maxResults)
        return rows[0]['f'][0]['v']

    def get_event_type_count_by_event_value(self, group, start, end, maxResults = 1, event_type = 'sl', event_value = 'A'):
        query = 'select count(et) as counts  from %s where et = "' + event_type + '" and ev = "' + event_value + '" and %s'
        
        rows = self.get_rows(self.mod_query_for_dates(query, group, start, end), maxResults)
        return rows[0]['f'][0]['v']
    
    def check_activity(self, group, month, year):
        table= self.get_table_name(group, month, year)
        query = 'select ev from ' + table + ' where et="sl" limit 1'
        body = self.get_request_body(query, 1)
        try:
            result = self.service.jobs().query(projectId=int(self.PROJECT_NUMBER),body=body).execute()
            return True
        except Exception, her:
            return False
    
    def get_group_general_user_data(self, group, start, end, maxResults = 1000):
        
        query = 'select count(distinct lts) from %s where et = "sl" and ev = "A" and %s'
        rows = self.get_rows(self.mod_query_for_dates(query, group, start, end), 1)
        A_user_count = rows[0]['f'][0]['v']
        
        query = 'select count(distinct lts) from %s where et = "sl" and ev = "B" and %s'
        rows = self.get_rows(self.mod_query_for_dates(query, group, start, end), 1)
        B_user_count = rows[0]['f'][0]['v']
        
        query = 'select count(distinct lts) from %s where (et = "re" OR (et = "rs" and ev="rd") OR ( et="sb" and ev="show" ) OR ( et="sb" and ev="vw" ) ) and %s'
        rows = self.get_rows(self.mod_query_for_dates(query, group, start, end), 1)
        engaged_user_count = rows[0]['f'][0]['v']
        
        return {'A_user_count' : A_user_count, 'B_user_count' : B_user_count, 'engaged_user_count' : engaged_user_count}
          
    
    def check_last_month_table(self, group, start, end, maxResults = 1):
        query = 'select count(distinct lts) from %s'
        rows = self.get_rows(query, maxResults)
        return rows[0]['f'][0]['v']
    
    def get_table_name(self, group, month, year):
        return '[events.events_' + str(year) + '_' + str(month) + '_' + str(group.id) + ']'
    
    
    def query_table_names_by_dates(self, group, start, end):
        td = timedelta(days=30)
        tables = set()
        while start <= end:
            tables.add(self.get_table_name(group, start.month, start.year))
            start = start + td
        return ','.join(tables)    
    
    def query_date_limits(self, start, end):
        return ' createdAt >= "' + start.strftime('%Y-%m-%d') + ' 00:00:00" and createdAt <= "' + end.strftime('%Y-%m-%d') + ' 23:59:59"'
    
    def mod_query_for_dates(self, query, group, start, end):
        return query % (self.query_table_names_by_dates(group, start, end), self.query_date_limits(start, end))
    
    def get_rows(self, query, maxResults):
        body = self.get_request_body(query, maxResults)
        result = self.service.jobs().query(projectId=int(self.PROJECT_NUMBER),body=body).execute()
        return result['rows']
        
    def get_request_body(self, query, maxResults):
        return {
                "timeoutMs": 60000, 
                "kind": "bigquery#queryRequest", 
                "dryRun": False, 
                "useQueryCache": False, 
                "defaultDataset": { 
                                   "projectId": self.PROJECT_NUMBER, 
                                   "datasetId": "events"
                                   },
                "maxResults": maxResults, 
                "query": query 
                }
    def request_body_result_rows(self, request_body):
        result = self.service.jobs().query(projectId=int(self.PROJECT_NUMBER),body=request_body).execute()
        return result['rows']

    
