from authentication.token import checkCookieToken
from rb.models import Group, User, SocialUser, GroupAdmin, Site
from django.http import HttpResponseRedirect
from extras.facebook import GraphAPIError
from settings import FACEBOOK_APP_ID, BASE_URL
from api.utils import *

def requires_login(func):
    pass

#A lot of this is a copy of requires_admin - should be consolodated.
def requires_admin_wordpress(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]
        context = kwargs.get('context', {})

        params = [
            'hostplatform',
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

def requires_access_key(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]

        return func(*args, **kwargs)
    return wrapper