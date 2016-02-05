from django import forms
from rb.models import *
import re
from api import userutils
from auto_approval import autoCreateGroup
from api.util_functions import getSettingsDict
from django.contrib.auth.forms import UserCreationForm
from django.utils.translation import ugettext_lazy as _
from django.core.mail import EmailMessage
from settings import RB_SOCIAL_ADMINS

from PIL import Image

import StringIO

from django.core.files.uploadedfile import InMemoryUploadedFile

from threading import Thread
from chronos.jobs import *

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
            
class ChangePasswordWhileLoggedInForm(forms.ModelForm):
    uid = forms.CharField(label=_('User Id'), widget=forms.HiddenInput)
    password = forms.CharField(label=_("Password"), widget=forms.PasswordInput)
    password2 = forms.CharField(label=_("Password confirmation"), widget=forms.PasswordInput,
        help_text = _("Enter the same password as above, for verification."))

    def __init__(self, *args, **kwargs):
        super(ChangePasswordWhileLoggedInForm, self).__init__(*args, **kwargs)
        
    class Meta:
        model = User
        fields = ("password",)

    def clean_uid(self):
        return self.cleaned_data['uid']
        
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
        valid = super(ChangePasswordWhileLoggedInForm, self).is_valid()
        print self.errors
        return valid
    
    def save(self, commit=True):
        user = User.objects.get(id=int(self.cleaned_data['uid']))
        
        user.set_password(self.cleaned_data["password"])
        
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
    avatar = forms.ImageField(label=_("Avatar Image"), max_length=255, required = False)
    default_tags = forms.CharField(label='Default Reactions', required = False)
    
    def __init__(self, *args, **kwargs):
        super(ModifySocialUserForm, self).__init__(*args, **kwargs)
        tags = []
        for tag in GroupBlessedTag.objects.filter(group=self.instance):
            tags.append(tag.node.body)
        self.fields['default_tags'].initial = ';'.join(tags)
  
    class Meta:
        model = SocialUser
        fields = ("avatar", "id", "default_tags")

    def clean_id(self):
        return self.cleaned_data['id']
    
    def clean_user_token(self):
        return self.cleaned_data['user_token']
    
    def clean_avatar(self):
        avatar = self.cleaned_data["avatar"]
        
        return avatar
    

    # Get or create blessed tag interaction nodes to prepare for save
    def clean_default_tags(self):
        tags = self.cleaned_data['default_tags']
        new_default_tags = []
        for tag in tags.split(';'):
            tag = tag.strip()
            check_nodes = InteractionNode.objects.filter(body__exact = tag)
        
            if check_nodes.count() == 0:
                inode = InteractionNode.objects.create(body=tag)

            elif check_nodes.count() > 1:
                inode = check_nodes[0]
        
            elif check_nodes.count() == 1:
                inode = check_nodes[0]

            new_default_tags.append(
                inode
            )
        self.new_default_tags = new_default_tags
    
    
    def is_valid(self):
        valid = super(ModifySocialUserForm, self).is_valid()
        return valid and userutils.validateSocialUserToken(self.cleaned_data['id'],self.cleaned_data['user_token'] )
        
    
    def save(self, commit=True):
        
        try:
            social_user = SocialUser.objects.get(id=self.clean_id())
            if self.clean_avatar() is not None:
                social_user.avatar = self.clean_avatar()
            
        except SocialUser.DoesNotExist:
            raise forms.ValidationError(_("A problem occurred while updating your profile."))

        if commit:
            UserDefaultTag.objects.filter(social_user=social_user).delete()
        
            # Add all the new blessed tags
            for tag in enumerate(self.new_default_tags):
                UserDefaultTag.objects.create(social_user=social_user, node=tag[1], order=tag[0])
    
            #social_user.save()
            #this should probably just be done in the clean avatar method
            if self.clean_avatar() is not None:
                try:
                    image = Image.open(social_user.avatar)
                    image.thumbnail((50,50),Image.ANTIALIAS)
                    thumb_io = StringIO.StringIO()
                    image.save(thumb_io, format=image.format)
                    #social_user.avatar.delete()
                    #filename = social_user.img_url[social_user.img_url.rindex("/") + 1:]
                    filename = 'avatar.' + image.format
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
    
    def save(self, cookie_user, force_insert=False, force_update=False, commit=True, isAutoApproved=False, querystring_content=False):

        cleaned_data = dict(
            name=self.cleaned_data['name'],
            short_name=self.cleaned_data['short_name'],
            domain=self.cleaned_data['domain'],
        )

        group, site = autoCreateGroup(cleaned_data, cookie_user, isAutoApproved=isAutoApproved, querystring_content=querystring_content)
        return group
        

class GroupForm(forms.ModelForm):
    blessed_tags = forms.CharField(label='Blessed Tags')
    
    # Override init for the form to set blessed tags for group instance
    def __init__(self, *args, **kwargs):
        super(GroupForm, self).__init__(*args, **kwargs)
        tags = []
        for tag in GroupBlessedTag.objects.filter(group=self.instance):
            tags.append(tag.node.body)
        self.fields['blessed_tags'].initial = ';'.join(tags)
    
    # Get or create blessed tag interaction nodes to prepare for save
    def clean_blessed_tags(self):
        tags = self.cleaned_data['blessed_tags']
        new_blessed_tags = []
        for tag in tags.split(';'):
            tag = tag.strip()

            case_insensitive_nodes = InteractionNode.objects.filter(body__exact = tag)
            inode = None
            for node in case_insensitive_nodes:
                # InteractionNode body is case insensitive, but the group default reactions should be case sensitive
                # so publishers can change the case of their default reactions
                if node.body == tag:
                    inode = node
                    break

            if inode is None:
                inode = InteractionNode.objects.create(body=tag)

            new_blessed_tags.append(inode)

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
        site = Site.objects.get(group=self.instance.id)
        cache_data = getSettingsDict(self.instance, site, self.new_blessed_tags)
        try:
            cache.set('group_settings_'+ str(site.domain), cache_data)
        except Exception, e:
            logger.warning(e)
        try:
            get_cache('redundant').set('group_settings_'+ str(site.domain), cache_data)
        except Exception, e:
            logger.warning(e)

        if settings.CACHE_SYNCBACK:
            try:
                refresh_url = settings.OTHER_DATACENTER + '/api/cache/settings/refresh/'+ str(self.instance.id)
                hcon = httplib.HTTPConnection(refresh_url, timeout=5)
                hcon.request('GET', url)
                resp = hcon.getresponse()
                lines = resp.read()
                hcon.close()
            except Exception, e:
                logger.info("Other datacenter refresh: " + str(e))
        return m
            
    
    class Meta:
        model = Group
        fields = (
            'name',
            'short_name', 
            'twitter',
            'active_sections',
            'anno_whitelist',
            'separate_cta',
            'separate_cta_expanded',
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
            'signin_organic_required',
            'word_blacklist',
            'word_whitelist',
            'custom_css',
            'post_selector',
            'post_href_selector',
            'post_href_attribute',
            'summary_widget_selector',
            'summary_widget_method',
            'summary_widget_expanded_mobile',
            'br_replace_scope_selector',
            'call_to_action',
            'paragraph_helper',
            'hideOnMobile',
            'hideDoubleTapMessage',
            'doubleTapMessage',
            'doubleTapMessagePosition',
            'send_notifications',
            'author_selector',
            'author_attribute',
            'topics_selector',
            'topics_attribute',
            'section_selector',
            'section_attribute',
            'img_indicator_show_onload',
            'img_indicator_show_side',
            'tag_box_bg_colors',
            'tag_box_bg_colors_hover',
            'tag_box_text_colors',
            'tag_box_font_family',
            'tag_box_gradient',
            'tags_bg_css',
            'image_selector',
            'image_attribute',
            'ignore_subdomain',
            'page_tld',
            'show_recirc',
            'recirc_selector',
            'recirc_title',
            'recirc_background',
            'recirc_jquery_method'
        )


class CreateBoardForm(forms.Form):
    title = forms.CharField(label='Board Title')
    description = forms.CharField(label='Board Description')
    
    def clean_title(self):
        return self.cleaned_data['title']
    def clean_description(self):
        return self.cleaned_data['description']
    def save(self, cookie_user, force_insert=False, force_update=False, commit=True):
        board = Board.objects.create(owner=cookie_user, title = self.clean_title(), description = self.clean_description())
        board.save()
        board_admin = BoardAdmin.objects.create(board = board, user = cookie_user, approved = True)
        board_admin.save()
        return board
