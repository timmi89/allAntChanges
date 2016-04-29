from django import template
from django.conf import settings
from django.utils.safestring import mark_safe
from django.utils.datastructures import SortedDict
import collections

import logging
logger = logging.getLogger('rb.standard')

register = template.Library()


@register.simple_tag(name='settings')
def settings_tag(name):
    return getattr(settings, name, "")


@register.filter
def get_interaction_count(interaction_node, page=None, content=None):
    return interaction_node.tag_count(page=page, content=content)


@register.filter
def calculate_image_height(content):
    try:
        return int((content.height * 500)/content.width)
    except ZeroDivisionError:
        # let it fill the html height attribute with an empty string.
        return ""


@register.filter
def split_reaction(tagBodyRaw):
    tagBodyRaw = tagBodyRaw
    tagBody = ""
    tagBodyClass = "nospace"

    if len(tagBodyRaw) > 16:
        if ' ' not in tagBodyRaw:
            tagBody = '<div class="nospace charCount_' + \
                str(len(tagBodyRaw[:15])) + '">' + tagBodyRaw[:15] + \
                '-</div><div class="charCount_' + \
                str(len(tagBodyRaw[15:])) + '">' + tagBodyRaw[15:] + \
                '</div>'
        else:
            tagBody1 = ""
            tagBody1Class = "nospace"
            tagBody2 = ""
            tagBody2Class = "nospace"
            keepLooping = True

            tagBodyRawSplit = collections.deque(tagBodyRaw.split(' '))

            while keepLooping:
                tagBody1 += tagBodyRawSplit.popleft() + ' '
                if (
                    len(tagBody1) +
                    len(tagBodyRawSplit[0]) >= 16
                ) or len(tagBodyRawSplit) == 0:
                    keepLooping = False
            if ' ' in tagBody1.strip():
                tagBody1Class = "space"

            while len(tagBodyRawSplit) > 0:
                tagBody2 += tagBodyRawSplit.popleft() + ' '

            if ' ' in tagBody2.strip():
                tagBody2Class = "space"
            tagBody = '<div class="' + tagBody1Class + ' charCount_' + \
                str(len(tagBody1)) + '">' + tagBody1 + '</div><div class="' + \
                tagBody2Class + ' charCount_' + str(len(tagBody2)) + '">' + \
                tagBody2 + '</div>'
    else:
        if ' ' in tagBody.strip():
            tagBodyClass = "space"
        tagBody = '<div class="'+tagBodyClass+' charCount_' + \
            str(len(tagBodyRaw))+'">' + tagBodyRaw + '</div>'

    return mark_safe(tagBody)


@register.filter(name='cssClass')
def cssClass(field, css):
    return field.as_widget(attrs={"class": css})


@register.filter
def keyvalue(dict, key):
    try:
        return dict[key]
    except KeyError:
        return ''


# via http://stackoverflow.com/questions/2024660/django-sort-dict-in-template
@register.filter(name='sort')
def listsort(value):
    if isinstance(value, dict):
        new_dict = SortedDict()
        key_list = sorted(value.keys())
        for key in key_list:
            new_dict[key] = value[key]
        return new_dict
    elif isinstance(value, list):
        return sorted(value)
    else:
        return value
    listsort.is_safe = True
