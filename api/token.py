from readrboard.rb.models import *
from django.utils.hashcompat import sha_constructor

def checkToken(data):
    """
    Check to see if token in request is good
    """
    user_id = data['user_id']
    if len(SocialUser.objects.filter(id=user_id)) == 1:
        print "Checking token for registered user"
        auth_token = SocialAuth.objects.get(social_user__user=data['user_id'])
    else:
        print "Checking token for temporary user"
        auth_token = 'R3dRB0aRdR0X'
    readr_token = createToken(data['user_id'], auth_token, data['group_id'])
    print "server side token is ", readr_token
    print "client side token is ", data['readr_token']
    return (readr_token == data['readr_token'])

def createToken(djangoid, auth_token, group_id):
    """
    Create an SHA token from django id, social network
    auth token and group secret.
    """
    # Get the group secret which only we know
    group_secret = Group.objects.get(id=group_id).secret
    print "Creating readr_token %s %s %s" % (djangoid, auth_token, group_secret)
    token = sha_constructor(
        unicode(djangoid) +
        unicode(auth_token) +
        unicode(group_secret)
    ).hexdigest()[::2]
    print "Created token", token
    return token