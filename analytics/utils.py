import settings
import jws
from apiclient.discovery import build
from oauth2client.file import Storage
from oauth2client.client import AccessTokenRefreshError
from oauth2client.client import OAuth2WebServerFlow
from oauth2client.tools import run
from oauth2client.client import SignedJwtAssertionCredentials

"""
{
    "web": {
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "client_email": "774436620412-oegm0d53lfcngnbja6s6043bdrr3vv4a@developer.gserviceaccount.com",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/774436620412-oegm0d53lfcngnbja6s6043bdrr3vv4a@developer.gserviceaccount.com",
        "client_id": "774436620412-oegm0d53lfcngnbja6s6043bdrr3vv4a.apps.googleusercontent.com",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
    }
}
"""

class OAuth2EventsUtility(object):
    flow = None
    credentials = None
    def __call__(self, **kwargs):
        #do Oauth initialization
        self.authorize()
        return
    
    def authorize(self):
        header = {"alg":"RS256","typ":"JWT"}
        payload = {
               "iss":"774436620412-esk3bm6ov5otu9kl49dsjke61b0rpv58@developer.gserviceaccount.com",
               "scope":"https://www.googleapis.com/auth/devstorage.readonly",
               "aud":"https://accounts.google.com/o/oauth2/token",
               "exp":int(time.time() + 3600),
               "iat":int(time.time())
           }
        PROJECT_NUMBER = '774436620412'
        KEY_FILE = 'ssl/antenna_events.p12'

        with open(KEY_FILE, 'r') as fd:
            key = fd.read()
        
        SERVICE_ACCOUNT_EMAIL = '774436620412-esk3bm6ov5otu9kl49dsjke61b0rpv58@developer.gserviceaccount.com'
        
        self.credentials = SignedJwtAssertionCredentials(SERVICE_ACCOUNT_EMAIL, key,
              scope="https://www.googleapis.com/auth/bigquery")

        assertion = self.credentials._generate_assertion()

        h = httplib2.Http()
        h = self.credentials.authorize(h)
        #self.credentials._do_refresh_request(h.request)
        service = build('bigquery', 'v2')
        datasets = service.datasets()
        response = datasets.list(projectId=PROJECT_NUMBER).execute(h)

        return
    
    def get_most_viewed_reaction_hashes(group):
        return []
    