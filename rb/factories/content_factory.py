from __future__ import absolute_import
import factory

from antenna.rb.models import Content


class ContentFactory(factory.DjangoModelFactory):
    "Factory for django.contrib.auth.models.Content"
    class Meta:
        model = Content

    kind = 'txt'
    location = ':0,:1'
    body = 'Test content paragraph'
    height = 0
    width = 0
