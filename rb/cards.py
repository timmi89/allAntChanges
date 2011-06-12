from models import *
import random

class TagContent:
    def __init__(self, content, interactions):
        self.content_item = content
        self.interactions = interactions

        # Randomly pick an interaction to show
        self.interaction = random.choice(interactions)
        self.comments = []
        self.other_tags = []

    def getComments(self, interactions):
        # Get the comments for the randomly selected interaction on this tag
        self.comments.extend(interactions.filter(parent=self.interaction)[:1])

    def getOtherTags(self, interactions):
        # Get the comments for the randomly selected interaction on this tag
        other_tags = interactions.filter(content=self.content_item, kind='tag')
        other_tag_ids = other_tags.values_list('interaction_node').distinct()
        other_tag_nodes = InteractionNode.objects.filter(id__in=other_tag_ids).exclude(id=self.interaction.interaction_node.id)
        self.other_tags = [
            Tag(tag, other_tags.filter(interaction_node=tag), setContent=False)
            for tag in other_tag_nodes
        ]

class Tag:
    def __init__(self, tag, interactions, setContent=True):
        self.tag = tag
        self.interactions = interactions.filter(kind='tag')
        if setContent:
            self.setContent()

    def setContent(self):
        content_item_ids = self.interactions.values_list('content').distinct()
        content_items = Content.objects.filter(id__in=content_item_ids)

        content = [
            TagContent(content_item, self.interactions.filter(content=content_item))
            for content_item in content_items
        ]

        self.content = sorted(content, key=lambda x: len(x.interactions), reverse=True)[0]

class Card:
    def __init__(self, page, interactions):
        self.page = page
        self.interactions = interactions.filter(user__social_user__isnull=False)
        self.tags = self.makeTags()

    def makeTags(self):
        tag_interactions = self.interactions.filter(kind='tag')
        interaction_node_ids = tag_interactions.values_list('interaction_node').distinct()
        interaction_nodes = InteractionNode.objects.filter(id__in=interaction_node_ids)

        # Make tag objects for each tag on the page
        tags = [
            Tag(tag, tag_interactions.filter(interaction_node=tag))
            for tag in interaction_nodes
        ]

        # Sort tags by number of interactions on page
        tags = sorted(tags, key=lambda x: len(x.interactions), reverse=True)[:3]

        [tag.content.getComments(self.interactions) for tag in tags]
        [tag.content.getOtherTags(self.interactions) for tag in tags]

        return tags