from django.forms import ModelForm
from rb.models import Group

class GroupForm(ModelForm):
    class Meta:
        model = Group
        fields = (
            'name',
            'short_name', 
            'twitter',
            'language',
            'anno_whitelist',
            'no_readr',
            'img_whitelist',
            'img_blacklist',
            'temp_interact',
            'logo_url_sm',
            'logo_url_med',
            'logo_url_lg',
            'requires_approval',
            'word_blacklist',
            'css_url',
            'secret', 
            'blessed_tags'
        )