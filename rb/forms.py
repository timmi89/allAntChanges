from django import forms
from rb.models import *
import re

class CreateGroupForm(forms.Form):
    name = forms.CharField(label='Company Name')
    short_name = forms.CharField(label='Short Name')
    domain = forms.CharField(label='Domain Name')
    
    def clean_domain(self):
        requested_domain = self.cleaned_data['domain']
        split_domain = requested_domain.split('.')
        if 'www' in split_domain[0]:
            split_domain = split_domain[1:]
        domain = '.'.join(split_domain)
        return domain
    
    def clean_short_name(self):
        requested_sn = self.cleaned_data['short_name'].lower()
        requested_sn = re.sub(r'\s', '', requested_sn)
        if len(Group.objects.filter(short_name=requested_sn)) > 0:
            raise forms.ValidationError("Requested short name is not unique!")
        else:
            return requested_sn
    
    def save(self, cookie_user, force_insert=False, force_update=False, commit=True):
        group = Group.objects.create(
            name=self.cleaned_data['name'],
            short_name=self.cleaned_data['short_name']
        )
        Site.objects.create(
            name=self.cleaned_data['domain'],
            domain=self.cleaned_data['domain'],
            group=group
        )
        social_user = SocialUser.objects.get(user=cookie_user)
        GroupAdmin.objects.create(group=group,social_user=social_user,approved=True)

        # Add us to admins
        readr_admins = SocialUser.objects.filter(
            user__email__in=(
                'porterbayne@gmail.com',
                'erchaves@gmail.com',
                'tyler.brock@gmail.com'
            )
        ).exclude(id=social_user.id)

        for admin in readr_admins:
            GroupAdmin.objects.create(group=group,social_user=admin,approved=True)
            
        return group
        

class GroupForm(forms.ModelForm):
    blessed_tags = forms.CharField(label='Blessed Tags')
    
    # Override init for the form to set blessed tags for group instance
    def __init__(self, *args, **kwargs):
        super(GroupForm, self).__init__(*args, **kwargs)
        tags = []
        for tag in GroupBlessedTag.objects.filter(group=self.instance):
            tags.append(tag.node.body)
        self.fields['blessed_tags'].initial = ','.join(tags)
    
    # Get or create blessed tag interaction nodes to prepare for save
    def clean_blessed_tags(self):
        tags = self.cleaned_data['blessed_tags']
        new_blessed_tags = []
        for tag in tags.split(','):
            tag = tag.strip()
            new_blessed_tags.append(
                InteractionNode.objects.get_or_create(body=tag)[0]
            )
        self.new_blessed_tags = new_blessed_tags
    
    # Write the many to many relationships
    def save(self, force_insert=False, force_update=False, commit=True):
        m = super(GroupForm, self).save(commit=False)
        
        # Remove all the old blessed tags
        GroupBlessedTag.objects.filter(group=self.instance).delete()
        
        # Add all the new blessed tags
        for tag in enumerate(self.new_blessed_tags):
            GroupBlessedTag.objects.create(group=self.instance, node=tag[1], order=tag[0])
        if commit:
            m.save()
        return m
            
    
    class Meta:
        model = Group
        fields = (
            'name',
            'short_name', 
            'twitter',
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
            'custom_css',
            'post_selector',
            'post_href_selector',
            'summary_widget_selector',
            'call_to_action'
        )