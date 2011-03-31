import re
from django.conf import settings
from django.contrib.auth.models import User
from django.db import models

class LazyUserManager(models.Manager):

    def create_lazy_user(self, username):
        """
        Create a lazy user.
        """
        user = User.objects.create_user(username, '')
        self.create(user=user)
        return user

    def convert(self, form):
        """ 
        Convert a lazy user to a non-lazy one. The form passed
        in is expected to be a ModelForm instance, bound to the user
        to be converted.

        The converted ``User`` object is returned.

        Raises a TypeError if the user is not lazy.
        """
        if not is_lazy_user(form.instance):
            raise NotLazyError, 'You cannot convert a non-lazy user'

        user = form.save()

        # We need to remove the LazyUser instance assocated with the
        # newly-converted user
        self.filter(user=user).delete()
        return user


class LazyUser(models.Model):
    user = models.ForeignKey('auth.User', unique=True)
    objects = LazyUserManager()
