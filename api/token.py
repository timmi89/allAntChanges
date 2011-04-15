from readrboard.rb.models import *
from django.utils.hashcompat import sha_constructor
from datetime import datetime
from exceptions import JSONException

def checkToken(data):
    """
    Check to see if token in request is good
    """
    try:
        user_id = data.get('user_id', None)
    except KeyError:
        raise JSONException("No user id supplied")
    if len(SocialUser.objects.filter(user__id=user_id)) == 1:
        print "Checking token for registered user"
        try:
            social_auth = SocialAuth.objects.get(social_user__user=data['user_id'])
        except SocialAuth.DoesNotExist:
            raise JSONException(u'Social Auth does not exist for user')
        now = datetime.now()
        if social_auth.expires > now:
            auth_token = social_auth.auth_token
        else:
            raise JSONException(u'Facebook token expired')
    else:
        print "Checking token for temporary user"
        auth_token = 'R3dRB0aRdR0X'
    readr_token = createToken(data['user_id'], auth_token, data['group_id'])
    #print "server side token is ", readr_token
    #print "client side token is ", data['readr_token']
    return (readr_token == data['readr_token'])

def createToken(django_id, auth_token, group_id):
    """
    Create an SHA token from django id, social network
    auth token and group secret.
    """
    # Get the group secret which only we know
    group_secret = Group.objects.get(id=group_id).secret
    username = User.objects.get(id=django_id).username
    print "Creating readr_token %s %s %s" % (django_id, auth_token, group_secret)
    token = sha_constructor(
        unicode(username) +
        unicode(auth_token) +
        unicode(group_secret)
    ).hexdigest()[::2]
    print "Created token", token
    return token