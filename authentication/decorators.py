from authentication.token import checkCookieToken
from rb.models import Group, User, SocialUser, GroupAdmin, Site
from django.http import HttpResponseRedirect
from extras.facebook import GraphAPIError
from api.utils import *

def requires_login(func):
    pass

def requires_wordpress_admin(func):
    def wrapper(*args, **kwargs):
        # request = args[0] if len(args) == 1 else args[1]
        
        # context = kwargs.get('context', {})
    
        # hostdomain = context['hostdomain'] = request.GET.get('hostdomain', None)
        # context['short_name'] = request.GET.get('short_name', None)
        # context['hostplatform'] = request.GET.get('hostplatform', None)
        # context['iswordpress'] = context['hostplatform'] == 'wordpress'
        
        # #todo: figure out the better way to do this
        # context['qParams'] = "?"+"hostplatform="+context['hostplatform']+"&"+"hostdomain="+context['hostdomain']+"&"+"short_name="+context['short_name'];
        
        # site = Site.objects.get(domain=hostdomain)
        # if site and site.group:
        #     context['hostdomaingroup'] = site.group
        
        # kwargs['context'] = context
        return func(*args, **kwargs)

    return wrapper

#this isn't really the right place for this.. Move it later
def wordpress_context(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]
        context = kwargs.get('context', {})
        
        params = [
            'hostplatform',
            'hostdomain',
            'short_name',
            'company_name',
        ];
        for param in params:
            context[param] = request.GET.get(param, None)
        
        context['iswordpress'] = context['hostplatform'] == 'wordpress'
        
        context['qParams'] = "".join([
            ( ("?" if i==0 else "&") + x + "=" + context[x] )
            for i,x in enumerate(params)
        ])

        site = Site.objects.get(domain=context['hostdomain'])
        if site and site.group:
            context['hostdomaingroup'] = site.group
        
        kwargs['context'] = context
        return func(*args, **kwargs)

    return wrapper

def requires_admin(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]

        #I think it would make sense to redirect to the login page instead, 
        #but there is sometimes a redirect loop if we do that because of when we do if (top == self) { window.location.reload(); }
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