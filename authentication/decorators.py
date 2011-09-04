from authentication.token import checkCookieToken
from rb.models import Group, User, SocialUser, GroupAdmin
from django.http import HttpResponseRedirect
from extras.facebook import GraphAPIError

def requires_login(func):
    pass

def requires_admin(func):
    def wrapper(*args, **kwargs):
        if len(args) == 1:
            thisobj = None
            request = args[0]
        else:
            thisobj = args[0]
            request = args[1]
            host = request.get_host()
            print 'ajax'
            if host not in ('local.readrboard.com:8080', 'www.readrboard.com'):
                return HttpResponseRedirect('no hax fucker!')
        try:
            cookie_user = checkCookieToken(request)
            kwargs['cookie_user'] = cookie_user
        except GraphAPIError:
            return HttpResponseRedirect('/')

        # If a user is registered and logged in
        if cookie_user:
            short_name = kwargs.get('short_name', None)
            group = None
            if short_name:
                group = Group.objects.get(short_name=short_name)
                del kwargs['short_name']
            try:
                social_user = SocialUser.objects.get(user=cookie_user)
            except SocialUser.DoesNotExist:
                return HttpResponseRedirect('/')
            try:
                if short_name:
                    ga = GroupAdmin.objects.get(social_user=social_user, group=group, approved=True)
                else:
                    ga = GroupAdmin.objects.filter(social_user=social_user, approved=True)
                admin_user = cookie_user
            except GroupAdmin.DoesNotExist:
                print 'failed yo'
                admin_user = None
        else:
            admin_user = None
        if admin_user: 
            if thisobj:
                return func(thisobj, request, group, **kwargs)
            if group:
                return func(request, group, **kwargs)
            else:
                return func(request, **kwargs)
        else: return HttpResponseRedirect('/')
    return wrapper