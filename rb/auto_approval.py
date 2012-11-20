# from readrboard.rb.models import *
# from django.utils.hashcompat import sha_constructor
# from datetime import datetime
# from extras.facebook import GraphAPI, GraphAPIError
from models import *
from api import userutils
from django.core.mail import EmailMessage
from settings import RB_SOCIAL_ADMINS
import logging
logger = logging.getLogger('rb.standard')

def autoCreateGroup(cleaned_data, cookie_user, isAutoApproved=False, querystring_content=False):
    """
    Automatically create a group and its site.  And set up some defaults. Data needs to be clean
    """
    existingSites = Site.objects.filter(
        domain=cleaned_data['domain'],
    )
    if len(existingSites) > 0:
    
        try:
            site = existingSites[0]
            group = site.group
        except Exception, e:
            raise Exception("Site "+cleaned_data['domain']+" has no group.")
    else:
        # make a group and site
        try:
            group = Group.objects.create(
                name=cleaned_data['name'],
                short_name=cleaned_data['short_name'],
                approved=False,
                temp_interact=0,
                requires_approval=False,
            )
        except Exception, e:
            groups = Group.objects.filter(
                short_name=cleaned_data['short_name']
            )
            if len(groups) == 1:
                group = groups[0]
            else:
                raise Exception("More or less than one group with shortname found: " + cleaned_data['short_name'])
        
        site = Site.objects.create(
            name=cleaned_data['domain'],
            domain=cleaned_data['domain'],
            group=group,
            # this is whether or not a querystring is counted in the url - we should rename this
            querystring_content=querystring_content,
        )

        addDefaultsForNewGroup(group, cookie_user)
        autoApproveUserAsAdmin(group, cookie_user, isAutoApproved=isAutoApproved)

        return group


def addDefaultsForNewGroup(group, cookie_user):

    try:
        social_user = SocialUser.objects.get(user=cookie_user)
    except SocialUser.DoesNotExist:
        social_user = None


    # add defaults based on settings from readrboard's default group
    default_groups = Group.objects.filter(short_name='default')
    for dgroup in default_groups:
        if dgroup.short_name == 'default':
            default_group = dgroup
    
    group.word_blacklist = default_group.word_blacklist
    group.anno_whitelist = default_group.anno_whitelist
    group.save()
    
    blessed = GroupBlessedTag.objects.filter(group = default_group)
    for blessing in blessed:
        GroupBlessedTag.objects.create(group=group, node=blessing.node, order=blessing.order )
    #

    # todo - confirm that we don't need this line: .exclude(id=social_user.id) and consolodate these
    if social_user:
        # Also add us to admins
        readr_admins = SocialUser.objects.filter(
            user__email__in=(
                'porterbayne@gmail.com',
                'erchaves@gmail.com',
                'michael@readrboard.com',
            )
            # user__email__in=RB_SOCIAL_ADMINS
        ).exclude(id=social_user.id)
    else:
        readr_admins = SocialUser.objects.filter(
            user__email__in=(
                'porterbayne@gmail.com',
                'erchaves@gmail.com',
                'michael@readrboard.com',
            )
            # user__email__in=RB_SOCIAL_ADMINS
        )


    for admin in readr_admins:
        #TODO check if this combination already exists... we should set this to be unique at the db level right?
        GroupAdmin.objects.create(group=group,social_user=admin,approved=True)
    #######

    # email us about needing to approve the group
    msg = EmailMessage("ReadrBoard group approval", userutils.generateGroupApprovalEmail(group), "groups@readrboard.com", RB_SOCIAL_ADMINS )
    msg.content_subtype='html'
    msg.send(False)

    return group


def autoApproveUserAsAdmin(group, cookie_user, isAutoApproved=False):

    try:
        social_user = SocialUser.objects.get(user=cookie_user)
    except SocialUser.DoesNotExist:
        return False;

    #make the current logged in user a group admin and auto approve them ifShould.  And send us an email about it.
    if isAutoApproved:
        group_admin = GroupAdmin.objects.create(group=group,social_user=social_user,approved=isAutoApproved)
        ga_approval_mail = userutils.generateAdminApprovalEmail(group_admin, isAutoApproved)
        msg = EmailMessage("ReadrBoard group admin approval", ga_approval_mail, "groups@readrboard.com", RB_SOCIAL_ADMINS )
        msg.content_subtype='html'
        msg.send(False)
        #######

    return group