from django import forms
from rb.models import *
import re
from api import userutils

from django.contrib.auth.forms import UserCreationForm
from django.utils.translation import ugettext_lazy as _
from PIL import Image

import StringIO

from django.core.files.uploadedfile import InMemoryUploadedFile


import traceback
import logging
logger = logging.getLogger('rb.standard')

class CreateUserForm(forms.ModelForm):
    """
    A form that creates a user, with no privileges, from the given username and password.
    Extended version of UserCreationForm from django.contrib.auth.forms
    """
    username = forms.RegexField(label=_("Username"), max_length=30, regex=r'^[\w.@+-]+$',
        help_text = _("Required. 30 characters or fewer. Letters, digits and @/./+/-/_ only."),
        error_messages = {'invalid': _("This value may contain only letters, numbers and @/./+/-/_ characters.")})
    password1 = forms.CharField(label=_("Password"), widget=forms.PasswordInput)
    password2 = forms.CharField(label=_("Password confirmation"), widget=forms.PasswordInput,
        help_text = _("Enter the same password as above, for verification."))

    email = forms.EmailField(max_length=75, error_messages={'required': 'Please enter your email address', 'invalid':'Please enter a valid email address'})

    class Meta:
        model = User
        fields = ("username", "email",)

    def clean_username(self):
        username = self.cleaned_data["username"]
        try:
            User.objects.get(username=username)
        except User.DoesNotExist:
            return username
        raise forms.ValidationError(_("A user with that username already exists."))

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1", "")
        password2 = self.cleaned_data["password2"]
        if password1 != password2:
            raise forms.ValidationError(_("The two password fields didn't match."))
        return password2

    def clean_email(self):
        email_addr = self.cleaned_data['email']
        
        if len(User.objects.filter(email=email_addr.lower())) > 0:
            raise forms.ValidationError(_("Requested Email address already registered."))
        return email_addr
    
    def is_valid(self):
        valid = super(CreateUserForm, self).is_valid()
            
        return valid
    
    def save(self, commit=True):
        user = super(CreateUserForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user
            
class ChangePasswordForm(forms.ModelForm):
    uid = forms.CharField(label=_('User Id'), widget=forms.HiddenInput)
    password_token = forms.CharField(label=_('Reset Token'), widget=forms.HiddenInput)
    password = forms.CharField(label=_("Password"), widget=forms.PasswordInput)
    password2 = forms.CharField(label=_("Password confirmation"), widget=forms.PasswordInput,
        help_text = _("Enter the same password as above, for verification."))

    def __init__(self, *args, **kwargs):
        super(ChangePasswordForm, self).__init__(*args, **kwargs)
        

    class Meta:
        model = User
        fields = ("password",)

    def clean_uid(self):
        return self.cleaned_data['uid']
    
    def clean_password_token(self):
        return self.cleaned_data['password_token']
    
    def clean_password(self):
        return self.cleaned_data.get("password","")

    def clean_password2(self):
        password = self.cleaned_data.get("password", "")
        password2 = self.cleaned_data["password2"]
        if password != password2:
            print "Bad password "
            raise forms.ValidationError(_("The two password fields didn't match."))
        return password2
    
    def is_valid(self):
        valid = super(ChangePasswordForm, self).is_valid()
        print self.errors
        return valid
    
    def save(self, commit=True):
        user = User.objects.get(id=int(self.cleaned_data['uid']))
        
        user.set_password(self.cleaned_data["password"])
        
        if commit:
            user.save()
        return user

class ModifySocialUserForm(forms.ModelForm):
    
    id = forms.CharField(label=_('User Id'), widget=forms.HiddenInput)
    user_token = forms.CharField(label=_('User Token'), widget=forms.HiddenInput)
    avatar = forms.ImageField(label=_("Avatar Image"), max_length=255)
    
    class Meta:
        model = SocialUser
        fields = ("avatar", "id")

    def clean_id(self):
        return self.cleaned_data['id']
    
    def clean_user_token(self):
        return self.cleaned_data['user_token']
    
    def clean_avatar(self):
        avatar = self.cleaned_data["avatar"]
        
        return avatar
    
    def is_valid(self):
        valid = super(ModifySocialUserForm, self).is_valid()
        return valid and userutils.validateSocialUserToken(self.cleaned_data['id'],self.cleaned_data['user_token'] )
        
    
    def save(self, commit=True):
        
        try:
            social_user = SocialUser.objects.get(id=self.clean_id())
            social_user.avatar = self.clean_avatar()
            
        except SocialUser.DoesNotExist:
            raise forms.ValidationError(_("A problem occurred while updating your profile."))
        
        if commit:
            
            #social_user.save()
            #this should probably just be done in the clean avatar method
            try:
                logger.info("Starting thumb")

                image = Image.open(social_user.avatar)
                image.thumbnail((50,50),Image.ANTIALIAS)
                thumb_io = StringIO.StringIO()
                logger.info("Trying to save")
                image.save(thumb_io, format=image.format)
                #social_user.avatar.delete()
                filename = social_user.img_url[social_user.img_url.rindex("/") + 1:]
                logger.info("FORMAT: " + image.format + " " + filename)
                thumb_file = InMemoryUploadedFile(thumb_io, None, filename, 'image/' + image.format, thumb_io.len, None)
                social_user.avatar = thumb_file
                social_user.img_url = userutils.formatUserAvatarUrl(social_user)                
                logger.info("IMG_URL: " + social_user.img_url)                
                social_user.save()
            except Exception, e:
                logger.info(traceback.format_exc())
            
        return social_user

           

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
