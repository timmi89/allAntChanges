import factory

from antenna.rb.models import Group, GroupAdmin


class GroupFactory(factory.DjangoModelFactory):
    "Factory for rb.models.Group"
    class Meta:
        model = Group

    name = factory.Sequence(lambda n: 'Test Group %04d' % n)
    short_name = factory.Sequence(lambda n: 'test_group_%04d' % n)

    share_id = 1
    rate_id = 1
    comment_id = 1
    bookmark_id = 1
    search_id = 1

    @factory.post_generation
    def admins(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for admin in extracted:
                GroupAdmin(
                    group=self,
                    social_user=admin,
                    approved=True
                ).save()
