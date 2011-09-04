from authentication.token import checkCookieToken
from rb.models import Group, User, SocialUser, GroupAdmin
from django.http import HttpResponseRedirect
from extras.facebook import GraphAPIError

def requires_login(func):
    pass

def requires_admin(func):
    def wrapper(*args, **kwargs):
        if len(args) == 1:
            request = args[0]
        else:
            request = args[1]
        # Check to see if user is logged in to facebook
        try:
            cookie_user = checkCookieToken(request)
            kwargs['cookie_user'] = cookie_user
        except GraphAPIError:
            return HttpResponseRedirect('/')

        # If a user is registered and logged in
        if cookie_user:
            admin_groups = cookie_user.social_user.admin_groups()
            short_name = kwargs.get('short_name', None)
            if short_name:
                group = Group.objects.get(short_name=short_name)
                if group not in admin_groups:
                    return HttpResponseRedirect('/')
                else:
                    kwargs['admin_groups'] = [group]
            else:
                kwargs['admin_groups'] = admin_groups
                
            return func(*args, **kwargs)
        else:
            return HttpResponseRedirect('/')
    return wrapper