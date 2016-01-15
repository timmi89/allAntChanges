from authentication.token import checkCookieToken
from rb.models import Group, User, SocialUser, GroupAdmin, Site
from django.http import HttpResponseRedirect
from extras.facebook import GraphAPIError
from settings import FACEBOOK_APP_ID, BASE_URL, TEMP_LIMIT_GROUPADMIN_AUTOAPPROVE
from api.utils import *
from rb.auto_approval import *

def requires_login(func):
    pass

#A lot of this is a copy of requires_admin - should be consolodated.
def requires_admin_wordpress(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]
        context = kwargs.get('context', {})

        params = [
            'hostplatform',
            # e.g. https://www.somedomain.com
            'host_xdm_url',
            # hostdomain has www removed, unlike host_xdm_url
            'hostdomain',
            'short_name',
            'company_name',
        ]


        def makeQParams():
            # make the query params
            context['qParams'] = "".join([
                (("?" if i==0 else "&") + x + "=" + context[x] )
                for i,x in enumerate(params)
            ])
            return  context['qParams']

        def getURLForNotAdminRedirect():
            return  '/friendlylogin_wordpress/'+makeQParams()

        for param in params:
            context[param] = request.GET.get(param, "")

        
        siteQ = Site.objects.select_related('group').filter(domain=context['hostdomain'])
        group = siteQ[0].group if siteQ.exists() else None

        if group:
            context['hostdomaingroup'] = group
            context['true_short_name'] = group.short_name
            
            if not group.approved:
                context['group_not_approved'] = "true"
                params.append('group_not_approved')

            if context['short_name'] != context['true_short_name']:
                params.append('true_short_name')


        context['qParams'] = makeQParams()

        try:
            context['fb_client_id'] = FACEBOOK_APP_ID
            cookie_user = checkCookieToken(request)
            context['cookie_user'] = cookie_user
            kwargs['cookie_user'] = cookie_user
        except GraphAPIError:
            return HttpResponseRedirect(getURLForNotAdminRedirect())

        # If a user is registered and logged in
        if cookie_user:
            if len(SocialUser.objects.filter(user=cookie_user)) == 1:
                admin_groups = cookie_user.social_user.admin_groups()
                admin_groups_unapproved = cookie_user.social_user.admin_groups_unapproved()

                short_name = context.get('short_name', None)
                if short_name:
                    group = Group.objects.get(short_name=short_name)
                    if group not in admin_groups:
                        if group in admin_groups_unapproved:
                            context['user_unapproved_admin'] = "true"
                            params.append('user_unapproved_admin')

                        else:
                            # todo: this is just a cursory check for too many group admins.. Later we need to approve these correctly.
                            groupAdminsForGroup = GroupAdmin.objects.filter(group=group)
                            if len(groupAdminsForGroup) < TEMP_LIMIT_GROUPADMIN_AUTOAPPROVE:
                                group = autoApproveUserAsAdmin(group, cookie_user, isAutoApproved=True)
                                kwargs['admin_just_approved'] = True
                                # quick hack - remake the Qparams after adding 'requested'
                                context['refresh'] = "true"
                                params.append('refresh')
                                context['qParams'] = makeQParams()

                            else:
                                context['user_not_admin'] = "true"
                                params.append('user_not_admin')

                                return HttpResponseRedirect(getURLForNotAdminRedirect())

                    else:
                        kwargs['admin_groups'] = [group]

                else:                    
                    kwargs['admin_groups'] = admin_groups
                
            else:
                return HttpResponseRedirect(getURLForNotAdminRedirect())
        else:
            return HttpResponseRedirect(getURLForNotAdminRedirect())

        kwargs['context'] = context
        return func(*args, **kwargs)

    return wrapper

def requires_admin(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]


        #I think it would make sense to redirect to the login page instead, 
        #but there is sometimes a redirect loop if we do that because of when we do if (top == self) { window.location.reload() }
        isNotAdminRedirectUrl = "/sign/"
        isNotAdminRedirectUrl = "/"

        # Check to see if user is logged in to facebook
        try:
            cookie_user = checkCookieToken(request)
            kwargs['cookie_user'] = cookie_user
        except GraphAPIError:
            return HttpResponseRedirect(isNotAdminRedirectUrl)

        # If a user is registered and logged in
        if cookie_user:
            if len(SocialUser.objects.filter(user=cookie_user)) == 1:
                if cookie_user.email in RB_SOCIAL_ADMINS:
                    return func(*args, **kwargs)

                admin_groups = cookie_user.social_user.admin_groups()
                short_name = kwargs.get('short_name', None)
                if short_name:
                    group = Group.objects.get(short_name=short_name)
                    if group not in admin_groups:
                        return HttpResponseRedirect(isNotAdminRedirectUrl)
                    else:
                        kwargs['admin_groups'] = [group]
                else:
                    kwargs['admin_groups'] = admin_groups
                
                return func(*args, **kwargs)
            else:
                return HttpResponseRedirect(isNotAdminRedirectUrl)
        else:
            return HttpResponseRedirect(isNotAdminRedirectUrl)
    return wrapper

# Note this is mostly a copy of requires_admin - refactor later.
def requires_admin_super(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]

        isNotAdminRedirectUrl = "/"

        # Check to see if user is logged in to facebook
        try:
            cookie_user = checkCookieToken(request)
            kwargs['cookie_user'] = cookie_user
        except GraphAPIError:
            return HttpResponseRedirect(isNotAdminRedirectUrl)

        # If a user is registered and logged in
        if cookie_user:
            userList = SocialUser.objects.filter(user=cookie_user)
            readr_admins = SocialUser.objects.filter(
                user__email__in=RB_SOCIAL_ADMINS
            )
            if len(userList) == 1:
                user = userList[0]
                if user in readr_admins:
                    return func(*args, **kwargs)
                else:
                    return HttpResponseRedirect(isNotAdminRedirectUrl)
            else:
                return HttpResponseRedirect(isNotAdminRedirectUrl)
        else:
            return HttpResponseRedirect(isNotAdminRedirectUrl)
    return wrapper    

def requires_admin_rest(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]
        res = {"status": 'success'}
        # Check to see if user is logged in to facebook
        
        try:
            cookie_user = checkCookieToken(request)
            kwargs['cookie_user'] = cookie_user
        except GraphAPIError:
            res['status'] =  'fail'
            res['message'] = 'GRAPHAPIError'

        # If a user is registered and logged in
        if cookie_user:
            if len(SocialUser.objects.filter(user=cookie_user)) == 1:
                try:
                    admin_groups = cookie_user.social_user.admin_groups()
                    group_id = kwargs.get('group_id', None)
                    if group_id:
                        group = Group.objects.get(id=int(group_id))
                        if group not in admin_groups:
                            res['status'] =  'fail'
                            res['message'] = 'Not an admin'
                        else:
                            kwargs['admin_groups'] = [group]
                    else:
                        kwargs['admin_groups'] = admin_groups
                    
                    res['data'] = func(*args, **kwargs)
                except JSONException, jsonex:
                    res['status'] =  'fail'
                    res['message'] = jsonex
                except Group.DoesNotExist:
                    res['status'] =  'fail'
                    res['message'] = 'Bad Group Id'
                except Exception, ex:
                    res['status'] = 'fail'
                    res['message'] = ex 
            else:
                res['status'] =  'fail'
                res['message'] = 'No Social User'
                
        else:
            res['status'] =  'fail'
            res['message'] = 'No cookie user'
        return res
    
    return wrapper

def requires_access_key(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]

        return func(*args, **kwargs)
    return wrapper