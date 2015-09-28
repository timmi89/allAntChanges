from antenna.rb.models import *
from django.utils.hashcompat import sha_constructor
from datetime import datetime
from extras.facebook import GraphAPI, GraphAPIError
from api.exceptions import JSONException
import logging
logger = logging.getLogger('rb.standard')

def checkCookieToken(request):
    """
    Cookie wrapper for token request
    """
    cookies = request.COOKIES
    data = {}
    data['user_id'] = cookies.get('user_id', None)
    data['ant_token'] = cookies.get('ant_token', None)
    return checkToken(data)

def checkToken(data):
    """
    Check to see if token in request is good
    If request is good and token matches return User object
    Returns None if failure
    """
    try:
        user_id = data.get('user_id')
    except KeyError:
        raise JSONException("No user id supplied")
        
    # Get user objects from database
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist, User.MultipleObjectsReturned:
        return None
    
    social_user = SocialUser.objects.filter(user=user_id)
    
    # Check and set auth_token for registered social user
    if len(social_user) == 1 and social_user[0].provider == 'Facebook':
        try:
            social_auth = SocialAuth.objects.get(social_user__user=data['user_id'])
            
        except SocialAuth.DoesNotExist:
            return None

        # Check with facebook to see if token is still valid
        # Note: this is slow -- look for a way to improve
        if social_user[0].provider == 'Facebook':
            try:
                graph = GraphAPI(social_auth.auth_token)
                graph.get_object("me")
            except GraphAPIError as GAE:
                logger.info( GAE.message)
                return None
                
        # If facebook approves, check if expired -- could be redundant
        now = datetime.now()
        if social_auth.expires > now:
            auth_token = social_auth.auth_token
        else:
            return None
    
    # Set auth_token for temporary user
    else:
        auth_token = 'R3dRB0aRdR0X'
    
    # Create token with passed in credentials
    ant_token = createToken(data['user_id'], auth_token)

    if(ant_token == data['ant_token']):
        return user

    return None

def createToken(django_id, auth_token):
    """
    Create an SHA token from django id, social network auth token
    """
    if django_id and auth_token:
        try:
            username = User.objects.get(id=django_id).username
        except User.DoesNotExist:
            raise JSONException("User does not exist")

        token = sha_constructor(
            unicode(username) +
            unicode(auth_token)
        ).hexdigest()[::2]
        return token
    return None


def createTokenFromUser(django_user, auth_token):

    token = sha_constructor(
        unicode(django_user.username) +
        unicode(auth_token)
    ).hexdigest()[::2]
    return token

    