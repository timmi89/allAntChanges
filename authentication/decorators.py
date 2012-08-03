from authentication.token import checkCookieToken
from rb.models import Group, User, SocialUser, GroupAdmin
from django.http import HttpResponseRedirect
from extras.facebook import GraphAPIError

def requires_login(func):
    pass

def requires_wordpress_admin(func):
    #dummy function - need to hook up workings
    #also, this is a shitty copy of requires_admin for now - consolodate later.
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]
        isNotAdminRedirectUrl = "/login/"
        # isNotAdminRedirectUrl = "/"

        #TODO
        #actually set these from our db later.
        hasRegistered = False;

        # Check to see if user is logged in to facebook
        try:
            cookie_user = checkCookieToken(request)
            kwargs['cookie_user'] = cookie_user
        except GraphAPIError:
            return HttpResponseRedirect(isNotAdminRedirectUrl)

        # If a user is registered and logged in
        if cookie_user:


            if not hasRegistered:
                return HttpResponseRedirect("/signup")


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


def requires_admin(func):
    def wrapper(*args, **kwargs):
        request = args[0] if len(args) == 1 else args[1]

        #I think it would make sense to redirect to the login page instead, 
        #but there is sometimes a redirect loop if we do that because of when we do if (top == self) { window.location.reload(); }
        # isNotAdminRedirectUrl = "/login/"
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