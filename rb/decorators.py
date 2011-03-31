from functools import wraps
from django.conf import settings
from django.contrib.auth import SESSION_KEY
from django.contrib.auth import authenticate
from django.contrib.auth import get_user
from django.contrib.auth import login
from django.contrib.auth.models import User

from utils import username_from_session

ALLOW_LAZY_REGISTRY = {}

def allow_lazy_user(func):
    # added self so this could wrap a method
    def wrapped(self, request, *args, **kwargs):
        assert hasattr(request, 'session'), ("You need to have the session "
                                             "app intsalled")
        if getattr(settings, 'LAZYSIGNUP_ENABLE', True):
            # If there's already a key in the session for a valid user, then we don't
            # need to do anything. If the user isn't valid, then get_user will return
            # an anonymous user
            if get_user(request).is_anonymous():
                # If not, then we have to create a user, and log them in.
                from models import LazyUser
                username = username_from_session(request.session.session_key)
                user = LazyUser.objects.create_lazy_user(username)
                request.user = None
                user = authenticate(username=username)
                assert user, ("Lazy user creation and authentication "
                              "failed. Have you got "
                              "lazysignup.backends.LazySignupBackend in "
                              "AUTHENTICATION_BACKENDS?")
                # Set the user id in the session here to prevent the login
                # call cycling the session key.
                request.session[SESSION_KEY] = user.id
                login(request, user)
        return func(self, request, *args, **kwargs)

    return wraps(func)(wrapped)
