from django import forms
from rb.models import Group

class BlessedTags(forms.Field):
    def to_python(self, value):
        pass
        
    def validate(self, value):
        pass

class GroupForm(forms.ModelForm):
    blessed_tags = forms.CharField()
    
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
            #'logo_sm',
            'logo_url_sm',
            #'logo_med',
            'logo_url_med',
            #'logo_lg',
            'logo_url_lg',
            'requires_approval',
            'word_blacklist',
            'css_url',
        )