from __future__ import absolute_import
import factory
import factory.fuzzy

from antenna.rb.models import SocialUser

from .user_factory import UserFactory


class SocialUserFactory(factory.DjangoModelFactory):
    "Factory for rb.models.SocialUser"
    class Meta:
        model = SocialUser

    full_name = factory.LazyAttribute(
        lambda obj: " ".join([obj.user.first_name, obj.user.last_name])
    )
    username = factory.SelfAttribute('user.username')
    uid = factory.fuzzy.FuzzyText(length=12)

    user = factory.SubFactory(UserFactory)
