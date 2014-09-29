import settings
from apiclient.discovery import build
from oauth2client.file import Storage
from oauth2client.client import AccessTokenRefreshError
from oauth2client.client import OAuth2WebServerFlow
from oauth2client.tools import run
import time, httplib2, json
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

    def get_top_reaction_view_hash_counts(self, group, month, year, maxResults = 100):
        table = self.get_table_name(group, month, year)
        query = 'select ch, count(ch) as counts  from ' + table + ' where ch != "null" group by ch order by counts desc'
        
        body = self.get_request_body(query, maxResults)
        try:
            result = self.service.jobs().query(projectId=int(self.PROJECT_NUMBER),body=body).execute()
            rows = result['rows']
            hash_tuples = []
            for row in rows:
                hash_tuples.append((row['f'][0]['v'],row['f'][1]['v'])) #hash, count
            return hash_tuples
        except Exception, ex:
            logger.warn(ex)
    
    
    
    def get_group_widget_loads(self, group, month, year, maxResults = 1):
        table = self.get_table_name(group, month, year)
        query = 'select count(et) as counts  from ' + table + ' where et = "wl"'
        
        body = self.get_request_body(query, maxResults)

        try:
            result = self.service.jobs().query(projectId=int(self.PROJECT_NUMBER),body=body).execute()
            rows = result['rows']
            return rows[0]['f'][0]['v']
            
        except Exception, ex:
            logger.warn(ex)
        return None
    
    def get_group_script_loads(self, group, month, year, maxResults = 1):
        table = self.get_table_name(group, month, year)
        query = 'select count(et) as counts  from ' + table + ' where et = "sl"'
        
        body = self.get_request_body(query, maxResults)
        try:
            result = self.service.jobs().query(projectId=int(self.PROJECT_NUMBER),body=body).execute()
            rows = result['rows']
            return rows[0]['f'][0]['v']
            
        except Exception, ex:
            logger.warn(ex)
        return None
    
    def get_table_name(self, group, month, year):
        return '[events.events_' + str(year) + '_' + str(month) + '_' + str(group.id) + ']'
    
    
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

    