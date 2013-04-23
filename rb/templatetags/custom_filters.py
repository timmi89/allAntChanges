from django import template
from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe
import collections

register = template.Library()

@register.filter
def get_interaction_count(interaction_node, page=None, content=None):
    return interaction_node.tag_count(page=page, content=content)

@register.filter
def split_reaction(tagBodyRaw):
	tagBodyRaw = tagBodyRaw
	tagBody = ""
	tagIsSplitClass = ""

	if len(tagBodyRaw) > 16:
		# do stuff
		tagIsSplitClass = "rdr_tag_split"
		if not ' ' in tagBodyRaw:
			tagBody = '<div>' + tagBodyRaw[:15] + '-</div><div>' + tagBodyRaw[15:] + '</div>'
		else:
			tagBody1 = ""
			tagBody2 = ""
			keepLooping = True

			tagBodyRawSplit = collections.deque( tagBodyRaw.split(' ') )

			while keepLooping:
				tagBody1 += tagBodyRawSplit.popleft() + ' '
				if (len(tagBody1)+len(tagBodyRawSplit[0]) >= 16) or len(tagBodyRawSplit) == 0:
					keepLooping = False

			while len(tagBodyRawSplit) > 0:
				tagBody2 += tagBodyRawSplit.popleft() + ' '
			
			tagBody = '<div>' + tagBody1 +'</div><div>' + tagBody2 + '</div>'

	else:
		tagBody = '<div>' + tagBodyRaw + '</div>'

	return mark_safe(tagBody)
