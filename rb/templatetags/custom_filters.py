from django import template
register = template.Library()

@register.filter
def get_interaction_count(interaction_node, page=None, content=None):
    return interaction_node.tag_count(page=page, content=content)