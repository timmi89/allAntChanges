def engagement_score(item):
    # sort by engagement score: (reactions + reaction views) / itemviews
    return \
        (item['reaction_count'] + item['reaction_view_count']) \
        / item.get('itemview_count', 1)


def unique_content_filter(seen, item):
    if item['content'].body in seen:
        return False
    else:
        seen.add(item['content'].body)
        return True

class Struct(object):
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
