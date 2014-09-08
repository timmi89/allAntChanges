from antenna.rb.models import *
from antenna import settings
from datetime import datetime, timedelta
import base64
import uuid
from django.forms.models import model_to_dict
from django.core.mail import send_mail, mail_admins
from django.utils.hashcompat import sha_constructor
from django.contrib.auth.models import Permission
import httplib
import logging
logger = logging.getLogger('rb.standard')


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
    logger.debug("converted temp user to: " + str(existing_user))

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
            "img_url": profile.get('img_url', '')
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

    logger.debug( result + "social user %s (%s: %s)" % (
        social_user.full_name,
        social_user.provider, 
        social_user.uid
    ))

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
    logger.debug( result + "django user %s %s (%s)" % (
        django_user.first_name, 
        django_user.last_name, 
        django_user.email
    ))

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
    profile['img_url'] = ""
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
    message = getEmailTemplate('confirmation_email.html') % (user.username, settings.BASE_URL, 
                                                             user.id, generateConfirmation(user))
    return message      

def generateAgreeEmail(user, count, interaction):
    #message = getEmailTemplate('agree_email.html') % (user.username, count, settings.BASE_URL, interaction.id)
    message = getEmailTemplateFromWeb('agree', user_id=user.id, interaction_id=interaction.id, count=count)
    if message is None:
        raise Exception("None for agree email on interaction: " + str(interaction) + " to user: " 
                        + str(user) 
                        + " count:" 
                        + str(count))
    return message


def generateGroupNodeEmail(interaction, admin_index):
    #message = getEmailTemplate('agree_email.html') % (user.username, count, settings.BASE_URL, interaction.id)
    message = getEmailTemplateFromWeb('group_node', group_id=interaction.page.site.group.id, interaction_id=interaction.id, count=admin_index)
    if message is None:
        raise Exception("None for group node email on interaction: " + str(interaction) + " to user: " 
                        + str(user) 
                        + " admin_index:" 
                        + str(admin_index))
    return message


def generateCommentEmail(user, interaction):
    #message = getEmailTemplate('comment_email.html') % (user.username, settings.BASE_URL, interaction.id)
    message = getEmailTemplateFromWeb('comment', user_id=user.id, interaction_id=interaction.id)
    if message is None:
        raise Exception("None for comment email on interaction: " 
                        + str(interaction) 
                        + " to user: " 
                        + str(user))
    return message


def generatePageEmail(user, interaction):
    #message = getEmailTemplate('comment_email.html') % (user.username, settings.BASE_URL, interaction.id)
    message = getEmailTemplateFromWeb('page', user_id=user.id, interaction_id=interaction.id)
    if message is None:
        raise Exception("None for page email on interaction: " 
                        + str(interaction) 
                        + " to user: " 
                        + str(user))
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

def generatePasswordEmail(username, email):
    try:
        user = findDjangoUserByUsername(username)          
    except User.DoesNotExist:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return (None, False)
    
    password_email = getEmailTemplate('password_email.html') % (settings.BASE_URL, user.id, generatePasswordToken(user))
    return (user, password_email)

def generateFollowEmail(owner):
    #follow_email = getEmailTemplate('follow_email.html') % (settings.BASE_URL, owner.id, owner.social_user.username)
    follow_email = getEmailTemplateFromWeb('agree', user_id=user.id, follow_id=owner.id)
    return (follow_email)

def generateGroupApprovalEmail(group):
    approval_email = getEmailTemplate('group_approval_email.html') % (settings.BASE_URL, group.id, group.short_name)
    return (approval_email)

def generateAdminApprovalEmail(groupadmin, isAutoApproved=False):
    if isAutoApproved:

        # hardcode this for now.  Wordpress is the only preapprover
        isWordpress = True
        emailTemplate = "groupadmin_preapproved_email.html"
        preApprovedBecause = " Preapproval reason: completed through wordpress." if isWordpress else ""
        approval_email = getEmailTemplate(emailTemplate) % (settings.BASE_URL, groupadmin.id, groupadmin.social_user.username, preApprovedBecause)
    else:
        emailTemplate = "groupadmin_approval_email.html"
        approval_email = getEmailTemplate(emailTemplate) % (settings.BASE_URL, groupadmin.id, groupadmin.social_user.username)
    
    return (approval_email)



def getEmailTemplate(template_filename):
    email_template = open(settings.EMAIL_TEMPLATE_DIR + '/' + template_filename)
    return email_template.read()

def getEmailTemplateFromWeb(template_name, **kwargs):
    try:
        if template_name == 'comment':
            url = '/chronos/email/comment/' + str(kwargs['interaction_id']) + '/' + str(kwargs['user_id'])+ '/'
        elif template_name == 'agree':
            url = '/chronos/email/agree/' + str(kwargs['interaction_id']) + '/' + str(kwargs['user_id']) + '/' + str(kwargs['count'])+ '/'
        elif template_name == 'group_node':
            url = '/chronos/email/group_node/' + str(kwargs['interaction_id']) + '/' + str(kwargs['group_id']) + '/' + str(kwargs['count'])+ '/'
        elif template_name == 'page':
            url = '/chronos/email/page/' + str(kwargs['interaction_id']) + '/' + str(kwargs['user_id'])+ '/'
        elif template_name == 'follow':
            url = '/chronos/email/follow/' + str(kwargs['user_id']) + '/' + str(kwargs['follow_id'])+ '/'
        else:
            raise Exception('no template by that name:' + template_name)
        hcon = httplib.HTTPConnection(settings.URL_NO_PROTO, timeout=30)
        #hcon.connect()
        hcon.request('GET', url)
        resp = hcon.getresponse()
        page = resp.read()
        if page is not None:
            logger.info("PAGE GENERATED: " + url)
        else:
            logger.info("NONE PAGE" + url)
        hcon.close()
        return page
    except Exception, e:
        logger.info("BLOW: " + str(e))



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
        social_user = SocialUser.objects.get(id=social_user_id)
    except SocialUser.DoesNotExist:
        return False
    
    return token == generateSocialUserToken(social_user)


def formatUserAvatarUrl(social_user):
    bad_url = social_user.avatar.url    
    filename = bad_url[bad_url.rindex("/") + 1:]
    #logger.info(settings.BASE_URL + settings.MEDIA_URL+ 'users/'+ str(social_user.id) +'/avatars/'+ filename)
    return settings.STATIC_URL + 'users/'+ str(social_user.id) +'/avatars/'+ filename
    #return os.path.join(settings.BASE_URL, "/", settings.MEDIA_URL, 'users/', str(social_user.id) +'/avatars/', filename)
   
   
   
def getUserBoardsDict(cookie_user, visible=True):
    board_admins = BoardAdmin.objects.filter(user = cookie_user)
    user_boards = []
    for b_a in board_admins:
        if visible and b_a.board.visible:
            user_boards.append(model_to_dict(b_a.board, exclude = ['interactions','owner','admins','description','active','visible']))
        elif not visible:
            user_boards.append(model_to_dict(b_a.board, exclude = ['interactions','owner','admins','description','active','visible']))
    return user_boards
        
def isGroupAdmin(group, cookie_user):
    try:
        social_user = SocialUser.objects.filter(user=cookie_user)[0]
        admin_groups = social_user.admin_groups()
        if group in admin_groups:
            return True
        return False
    except SocialUser.DoesNotExist:
        return False
    
