from api.token import checkCookieToken
from models import Group, User
from django.http import HttpResponseRedirect

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
            if cookie_user.social_user.group_admin == group and cookie_user.social_user.admin_approved:
                admin_user = cookie_user
            else:
                admin_user = None
        else:
            admin_user = None
            
        if admin_user: return func(request, group, *args, **kwargs)
        else: return HttpResponseRedirect('/')
    return wrapper