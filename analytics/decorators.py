from api.token import checkCookieToken
from rb.models import Group, User, SocialUSer
from django.http import HttpResponseRedirect
from api.exceptions import JSONException

def requires_login(func):
    pass

def requires_admin(func):
    def wrapper(request, short_name, *args, **kwargs):
        cookie_user = checkCookieToken(request)
        # If a user is registered and logged in
        if cookie_user:
            try:
                group = Group.objects.get(short_name=short_name)
            except Group.DoesNotExist:
                return JSONException(u'Invalid group')
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