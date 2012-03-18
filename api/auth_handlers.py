from piston.handler import BaseHandler
from extras.facebook import GraphAPI, GraphAPIError
from settings import FACEBOOK_APP_SECRET
from decorators import status_response, json_data
from exceptions import JSONException
from authentication.token import *
from utils import *
from userutils import *
import json
from piston.utils import Mimer

class TempUserHandler(BaseHandler):
    @status_response
    def read(self, request):
        data = json.loads(request.GET['json'])
        group_id = data['group_id']
        user = User.objects.create_user(
            username=generateUsername(), 
            email='tempuser@readrboard.com'
        )
        readr_token = createToken(user.id, 'R3dRB0aRdR0X')
        return dict(
            user_id=user.id,
            readr_token=readr_token
        )

class Deauthorize(BaseHandler):
    @status_response
    def read(self, request):
        data = json.loads(request.GET['json'])
        #if not checkToken(data): raise JSONException(u"Token was invalid")
        if len(SocialUser.objects.filter(user__id=data['user_id'])) == 1:
            try:
                SocialAuth.objects.filter(
                    social_user__user__id=data['user_id']
                ).delete()
            except:
                raise JSONException(u'Error deauthorizing user')
        else:
            raise JSONException(u'Cannot deauthorize temp user')

class FBHandler(BaseHandler):
    @status_response
    def read(self, request, admin_req=False):
        data = json.loads(request.GET['json'])
        fb_session = data['fb']
        group_id = data['group_id']
        access_token = fb_session.get('accessToken', None)
        user_id = data.get('user_id', None)

        if(access_token):
            graph = GraphAPI(access_token)
        else:
            raise JSONException(u"No access token")

        # Get user profile from facebook graph
        try:
            profile = graph.get_object("me")
        except GraphAPIError:
            raise JSONException(u'Error getting graph object from Facebook')

        django_user = createDjangoUser(profile);
        social_user = createSocialUser(django_user, profile)
        social_auth = createSocialAuth(
            social_user,
            django_user,
            group_id,
            fb_session
        )

        # Check to see if user passed in was temporary, if yes, convert
        # temporary user's interactions to social user interactions
        if user_id and len(SocialUser.objects.filter(user__id=user_id)) == 0:
            convertUser(user_id, django_user)

        # Make a token for this guy
        readr_token = createToken(django_user.id, social_auth.auth_token)

        return dict(
            user_id=django_user.id,
            first_name=django_user.first_name,
            full_name=social_user.full_name,
            img_url=social_user.img_url,
            readr_token=readr_token
        )
        
        
class RBHandler(BaseHandler):
    allowed_methods = ('POST',)
    @status_response
    def create(self, request, admin_req=False):
        
        group_id = None
        #print 'got data'
        try:
            user_id = request.POST['user_id']
        except KeyError:
            user_id = None
            
        try:
            username = request.POST['username']
            password = request.POST['password']
            
        except KeyError:
            return dict(message='Please enter username and password', status='fail')
        
        faux_fb_session = {'accessToken':'R3dRB0aRdR0X', 'expiresIn':60}
        try:
            django_user = findDjangoUserByUsername(username);
        except User.DoesNotExist:
            authenticated = False
            if not authenticated:
                return dict(message="No such user.", status='fail')
        
        
        authenticated = django_user.check_password(password)
            
        if not authenticated:
            return dict(message="Username or password did not match.", status='fail')
        
        
        confirmed = django_user.has_perm('rb.change_socialuser')
        print django_user.is_active, confirmed
        if not confirmed:
            return dict(message="Please confirm email address", status='fail', 
                        confirmation=generateConfirmation(django_user), user_id=django_user.id)
        
        social_user = findSocialUser(django_user)
        print "SOCIAL: " ,social_user
        social_auth = createSocialAuth(
            social_user,
            django_user,
            group_id,
            faux_fb_session
        )
        
        # Check to see if user passed in was temporary, if yes, convert
        # temporary user's interactions to social user interactions
        if user_id and len(SocialUser.objects.filter(user__id=user_id)) == 0:
            convertUser(user_id, django_user)

        # Make a token for this guy
        readr_token = createToken(django_user.id, social_auth.auth_token)

        return dict(
            user_id=django_user.id,
            first_name=django_user.first_name,
            full_name=social_user.full_name,
            img_url=social_user.img_url,
            readr_token=readr_token
        )
      

class ConfirmUserHandler(BaseHandler):
    allowed_methods = ('POST',)
    @status_response
    def create(self, request):
        data = json.loads(request.POST['json'])
        user_id = data['user_id']
        user_confirmation = data['confirmation']
        user = User.objects.get(id=int(user_id))
        if user_confirmation == generateConfirmation(user):
            msg = EmailMessage("Readrboard email confirmation", generateConfirmationEmail(user), "hello@readrboard.com", [user.email])
            msg.content_subtype='html'
            msg.send(False)
        return dict(
            user_id=user.id,
        )
