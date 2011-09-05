from readrboard.rb.models import *
from datetime import datetime, timedelta
import base64
import uuid
from django.core.mail import send_mail

def convertUser(temp_user, existing_user):
    existing = Interaction.objects.filter(user=existing_user)
    new = Interaction.objects.filter(user=temp_user)

    # Make sure there are no duplicate interactions
    # Delete them if there are dupes
    for existing_row in existing:
        for new_row in new:
            if (
                new_row.page == existing_row.page and
                new_row.content == existing_row.content and
                new_row.interaction_node == existing_row.interaction_node
            ):
                new_row.delete();

    new.update(user=existing_user)
    User.objects.get(id=temp_user).delete()

def generateUsername():
    username = base64.b64encode(uuid.uuid4().bytes)[:-2]
    try:
        User.objects.get(username=username)
        return GenerateUsername()
    except User.DoesNotExist:
        return username

def createSocialAuth(social_user, django_user, group_id, fb_session):
    # Create expiration time from Facebook timestamp.
    # We know this exists because we aren't asking for 
    # offline access. If not we would need to check.
    access_token = fb_session['accessToken']
    expires_in = fb_session['expiresIn']

    # Store the information and link it to the SocialUser
    social_auth = SocialAuth.objects.get(
        social_user = social_user,
        auth_token = access_token,
    )
    
    if not social_auth or social_auth.expires > datetime.now:        
        # Remove stale tokens (if they exist)
        SocialAuth.objects.filter(social_user=social_user).exclude(auth_token=access_token).delete()
        social_auth = SocialAuth.objects.create(
            social_user = social_user,
            auth_token = access_token,
            expires = datetime.now + timedelta(minutes=expires_in)
        )[0]

    return social_auth

def createSocialUser(django_user, profile):
    base = 'http://graph.facebook.com'
    profile['img_url'] = '%s/%s/picture' % (base, profile['id'])

    # Make Gender key look like our model
    if 'gender' in profile.keys():
        profile ['gender'] = profile['gender'].capitalize()[:1]

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
            "bio": profile.get('bio', None),
            "img_url": profile.get('img_url', None)
        }
    )
    # Print out the result
    social_user = social[0]
    if social[1]:
        send_mail(
            'New ReadrBoard User',
            social_user.full_name + ' just joined RB!',
            'server@readrboard.com',
            ['tyler@readrboard.com'],
            fail_silently=True
        )
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