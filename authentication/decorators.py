from authentication.token import checkCookieToken
from rb.models import Group, User, SocialUser
from django.http import HttpResponseRedirect
from extras.facebook import GraphAPIError

def requires_login(func):
    pass

def requires_admin(func):
    def wrapper(request, short_name, *args, **kwargs):
        try:
            cookie_user = checkCookieToken(request)
        except GraphAPIError:
            return HttpResponseRedirect('/')
        # If a user is registered and logged in
        if cookie_user:
            group = Group.objects.get(short_name=short_name)
            try:
                social_user = SocialUser.objects.get(user=cookie_user)
            except SocialUser.DoesNotExist:
                return HttpResponseRedirect('/')
            if social_user.group_admin == group and social_user.admin_approved:
                admin_user = cookie_user
            else:
                admin_user = None
        else:
            admin_user = None
        if admin_user: return func(request, group, *args, **kwargs)
        else: return HttpResponseRedirect('/')
    return wrapper