from __future__ import absolute_import
import factory

from django.contrib.auth.models import User


class UserFactory(factory.DjangoModelFactory):
    "Factory for django.contrib.auth.models.User"
    class Meta:
        model = User

    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    username = factory.LazyAttribute(
        lambda obj: "_".join([obj.first_name, obj.last_name]).lower()
    )
    email = factory.Faker('email')
    password = factory.PostGenerationMethodCall('set_password', 'test')
