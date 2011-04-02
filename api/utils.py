from readrboard.rb.models import *
from django.utils.hashcompat import sha_constructor
from datetime import datetime, timedelta
import json

def createSocialAuth(social_user, django_user, group_id, expiration):
    # Create expiration time from Facebook timestamp
    dt = datetime.fromtimestamp(expiration)

    # Get the group secret which only we know
    group_secret = Group.objects.get(id=group_id).secret

    # Create the readr_token
    readr_token = createToken(django_user.id, access_token, group_secret)

    # Store the information and link it to the SocialUser
    social_auth = SocialAuth.objects.get_or_create(
        social_user = social_user,
        auth_token = access_token,
        expires = dt
    )

    # Remove stale tokens (if they exist)
    SocialAuth.objects.all().filter(social_user=social_user).exclude(readr_token=readr_token).delete()

def createSocialUser(django_user, profile):
    # Create social user object for user
    social = SocialUser.objects.get_or_create(
        user = django_user,
        provider = 'Facebook',
        uid = profile['id'],
        defaults = {
            "full_name": profile['name'],
            "username": profile.get('username', None),
            "gender": profile.get('gender', None),
            "hometown": profile['hometown']['name'] if (profile.get('hometown', None)) else None,
            "bio": profile.get('bio', None)
        }
    )

    # Print out the result
    social_user = social[0]
    result = ("Created new" if social[1] else "Retreived existing")
    print result, "social user %s (%s: %s)" % (
        social_user.full_name,
        social_user.provider, 
        social_user.uid
    )

    return social_user

def createDjangoUser(profile):
    # Create new Django user if one doesn't exist
    user = User.objects.get_or_create(
        username=profile['email'],
        defaults = {
            "email": profile['email'],
            "first_name": profile['first_name'].capitalize(),
            "last_name": profile['last_name'].capitalize(),
        },
    )

    # Print out the result
    django_user = user[0]
    result = "Created new" if user[1] else "Retreived existing"
    print result, "django user %s %s (%s)" % (
        django_user.first_name, 
        django_user.last_name, 
        django_user.email
    )

    return django_user

def checkToken(request):
    """
    Check to see if token in request is good
    """
    data = json.loads(request.GET['json'])
    group_secret = Group.objects.get(id=data['group_id']).secret
    auth = SocialAuth.objects.get(social_user__user=data['user_id'])
    readr_token = createToken(data['user_id'], auth.access_token, group_secret)
    return (readr_token == data['readr_token'])

def createToken(djangoid, auth_token, group_secret):
    """
    Create an SHA token from django id, social network
    auth token and group secret
    """
    print "Creating readr_token"
    return sha_constructor(
        unicode(djangoid) +
        unicode(auth_token) +
        unicode(group_secret)
    ).hexdigest()[::2]

def getPage(request, pageid=None):
    canonical = request.GET.get('canonical_url', None)
    fullurl = request.GET.get('url', None)
    host = request.get_host()
    host = host[0:host.find(":")]
    site = Site.objects.get(domain=host)
    if pageid:
        return Page.objects.get(id=pageid)
    elif canonical:
        page = Page.objects.get_or_create(canonical_url=canonical, defaults={'url': fullurl, 'site': site})
    else:
        page = Page.objects.get_or_create(url=fullurl, defaults={'site': site})
        
    if page[1] == True: print "Created page {0}".format(page)

    return page[0]

def createInteractionNode(kind, body):
    if kind and body:
            node = InteractionNode.objects.get_or_create(kind=kind, body=comment)[0]
            print "Success creating InteractionNode with id %s" % node.id
            return node

def createInteraction(page, content, user, interaction_node, parent=None):
    if content and user and interaction_node:
        # Can't rely on Django's auto_now to create the time before storing the node
        now = created=datetime.now()
        if parent:
            print "Creating Interaction with parent node"
            new = parent.add_child(page=page, 
                           content=content, 
                           user=user, 
                           interaction_node=interaction_node,
                           created=now)
        else:
            print "Creating Interaction without parent node"
            new = Interaction.add_root(page=page, 
                           content=content, 
                           user=user, 
                           interaction_node=interaction_node, 
                           created=now)
        return new
