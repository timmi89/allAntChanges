from django import forms
from rb.models import *

class GroupForm(forms.ModelForm):
    blessed_tags = forms.CharField(label='Blessed Tags')
    
    def clean_blessed_tags(self):
        tags = self.cleaned_data['blessed_tags']
        interaction_nodes = []
        for tag in tags.split(','):
            new_blessed_tags.append(
                InteractionNode.objects.get_or_create(body=tag)
            )
        self.new_blessed_tags = new_blessed_tags
        
    def save(self):
        current_blessed_tags = self.instance.blessed_tags
        for tag in self.new_blessed_tags:
            if tag not in current_blessed_tags:
                current_blessed_tags.add(tag)
        for tag in self.instance.blessed_tags:
            if tag not in new_blessed_tags:
                current_blessed_tags.remove(tag)
            
    
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
            'css_url'
        )