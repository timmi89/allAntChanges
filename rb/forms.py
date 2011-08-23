from django import forms
from rb.models import *

class GroupForm(forms.ModelForm):
    blessed_tags = forms.CharField(label='Blessed Tags')
    
    # Override init for the form to set blessed tags for group instance
    def __init__(self, *args, **kwargs):
        super(GroupForm, self).__init__(*args, **kwargs)
        tags = []
        for tag in self.instance.blessed_tags.all():
            tags.append(tag.body)
        self.fields['blessed_tags'].initial = ','.join(tags)
    
    # Get or create blessed tag interaction nodes to prepare for save
    def clean_blessed_tags(self):
        tags = self.cleaned_data['blessed_tags']
        new_blessed_tags = []
        for tag in tags.split(','):
            new_blessed_tags.append(
                InteractionNode.objects.get_or_create(body=tag)[0]
            )
        self.new_blessed_tags = new_blessed_tags
        print new_blessed_tags
    
    # Write the many to many relationships
    def save(self, force_insert=False, force_update=False, commit=True):
        m = super(GroupForm, self).save(commit=False)
        current_blessed_tags = self.instance.blessed_tags.all()
        # Add all the new blessed tags
        for tag in self.new_blessed_tags:
            if tag not in current_blessed_tags:
                print tag
                self.instance.blessed_tags.add(tag)
        # Remove all the old blessed tags
        for tag in self.instance.blessed_tags.all():
            if tag not in self.new_blessed_tags:
                self.instance.blessed_tags.remove(tag)
        if commit:
            m.save()
        return m
            
    
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
            'post_selector',
            'post_href_selector',
            'summary_widget_selector'
        )