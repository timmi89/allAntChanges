from readrboard.rb.models import *
from readrboard import settings
from datetime import datetime, timedelta
import base64
import uuid
from django.core.mail import send_mail, mail_admins
from django.utils.hashcompat import sha_constructor
from django.contrib.auth.models import Permission


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
    expires = datetime.now() + timedelta(minutes=expires_in)

    # Store the information and link it to the SocialUser
    social_auth = SocialAuth.objects.get_or_create(
        social_user = social_user,
        auth_token = access_token,
        defaults = {
            "expires": expires
        }
    )
    new = social_auth[1]
    social_auth = social_auth[0]
    
    if new:
        # Remove stale tokens (if they exist)
        SocialAuth.objects.filter(social_user=social_user).exclude(id=social_auth.id).delete()

    return social_auth

def createSocialUser(django_user, profile, base = 'http://graph.facebook.com', provider = 'Facebook'):
    
    if provider == 'Facebook':
        profile['img_url'] = '%s/%s/picture' % (base, profile['id'])

    # Make Gender key look like our model
    if 'gender' in profile.keys():
        profile ['gender'] = profile['gender'].capitalize()[:1]

    # Create social user object for user
    social = SocialUser.objects.get_or_create(
        user = django_user,
        provider = provider, 
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
        mail_admins(
            'New ReadrBoard User',
            social_user.full_name + ' just joined ReadrBoard!',
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
    result = "Created new" if user[1] else "Retrieved existing"
    print result, "django user %s %s (%s)" % (
        django_user.first_name, 
        django_user.last_name, 
        django_user.email
    )

    return django_user

def findDjangoUserByUsername(username):
    user = User.objects.get(
        username=username   
    )    
    return user
    

def findDjangoUserById(user_id):
    user = User.objects.get(
        id=user_id   
    )
    return user

def findSocialUser(django_user):
    return SocialUser.objects.get(user = django_user)  
    
def populateUserProfile(django_user):
    profile = {}
    profile['id'] = django_user.id
    profile['name'] = django_user.username
    profile['username'] = django_user.username
    return profile


def confirmUser(user_id, confirmation):
    if confirmation is None:
        return False
    django_user = findDjangoUserById(user_id)
    if confirmation == generateConfirmation(django_user):
        django_user.user_permissions.add(Permission.objects.get(codename="change_socialuser"))
        profile = populateUserProfile(django_user)
        social_user = createSocialUser(django_user, profile, base=None, provider='Readrboard')
        return True
    else:
        return False
    
def generateConfirmation(user):
    try:
        token = sha_constructor(
            unicode(user.email) +
            unicode("4rc4n37h1ng")
        ).hexdigest()[::2]
        return token
    except User.DoesNotExist:
        return None


def generateConfirmationEmail(user):
    message = getEmailTemplate('confirmation_email.html') % (settings.BASE_URL, user.id, generateConfirmation(user))
    
    return message      

def generatePasswordToken(user):
    window_datetime = datetime.now()
    window_str = window_datetime.strftime("%Y%m%d")
    try:
        token = sha_constructor(
            unicode(user.email) +
            unicode("0bfu5c473d1n73n7") +
            unicode(window_str)
        ).hexdigest()[::2]
        return token
    except User.DoesNotExist:
        return None

def generatePasswordEmail(username):
    try:
        user = findDjangoUserByUsername(username)
    
        message = '%s/reset_password?uid=%s&token=%s ' % (settings.BASE_URL, user.id, generatePasswordToken(user))
        message += 'Click here to reset your password.  This link is valid until midnight GMT of the day requested.'
        password_email = getEmailTemplate('password_email.html') % (settings.BASE_URL, user.id, generatePasswordToken(user))
        print password_email
        return (user, password_email)    
    except User.DoesNotExist:
        return (None, False)

def getEmailTemplate(template_filename):
    email_template = open(settings.EMAIL_TEMPLATE_DIR + '/' + template_filename)
    return email_template.read()

def validatePasswordToken(user_id, token):
    try:
        user = findDjangoUserById(user_id)
    except User.DoesNotExist:
        return False
    
    return token == generatePasswordToken(user)

def generateSocialUserToken(social_user):
    window_datetime = datetime.now()
    window_str = window_datetime.strftime("%Y%m%d")
    try:
        token = sha_constructor(
            unicode(social_user.id) +
            unicode("0bfu5c473d1n73n7") +
            unicode(window_str)
        ).hexdigest()[::2]
        return token
    except SocialUser.DoesNotExist:
        return None

def validateSocialUserToken(social_user_id, token):
    try:
        social_user = SocialUser.obects.get(id=social_user_id)
    except SocialUser.DoesNotExist:
        return False
    
    return token == generateSocialUserToken(social_user)
