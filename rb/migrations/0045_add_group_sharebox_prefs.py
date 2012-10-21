# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'Group.sharebox_show'
        db.add_column('rb_group', 'sharebox_show', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.sharebox_fade'
        db.add_column('rb_group', 'sharebox_fade', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.sharebox_should_own'
        db.add_column('rb_group', 'sharebox_should_own', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.sharebox_selector'
        db.add_column('rb_group', 'sharebox_selector', self.gf('django.db.models.fields.CharField')(default='', max_length=100, blank=True), keep_default=False)

        # Adding field 'Group.sharebox_facebook'
        db.add_column('rb_group', 'sharebox_facebook', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.sharebox_twitter'
        db.add_column('rb_group', 'sharebox_twitter', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.sharebox_stumble'
        db.add_column('rb_group', 'sharebox_stumble', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.sharebox_digg'
        db.add_column('rb_group', 'sharebox_digg', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.sharebox_reddit'
        db.add_column('rb_group', 'sharebox_reddit', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.sharebox_google'
        db.add_column('rb_group', 'sharebox_google', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'Group.sharebox_show'
        db.delete_column('rb_group', 'sharebox_show')

        # Deleting field 'Group.sharebox_fade'
        db.delete_column('rb_group', 'sharebox_fade')

        # Deleting field 'Group.sharebox_should_own'
        db.delete_column('rb_group', 'sharebox_should_own')

        # Deleting field 'Group.sharebox_selector'
        db.delete_column('rb_group', 'sharebox_selector')

        # Deleting field 'Group.sharebox_facebook'
        db.delete_column('rb_group', 'sharebox_facebook')

        # Deleting field 'Group.sharebox_twitter'
        db.delete_column('rb_group', 'sharebox_twitter')

        # Deleting field 'Group.sharebox_stumble'
        db.delete_column('rb_group', 'sharebox_stumble')

        # Deleting field 'Group.sharebox_digg'
        db.delete_column('rb_group', 'sharebox_digg')

        # Deleting field 'Group.sharebox_reddit'
        db.delete_column('rb_group', 'sharebox_reddit')

        # Deleting field 'Group.sharebox_google'
        db.delete_column('rb_group', 'sharebox_google')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'rb.board': {
            'Meta': {'unique_together': "(('owner', 'title'),)", 'object_name': 'Board'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'admins': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'through': "orm['rb.BoardAdmin']", 'symmetrical': 'False'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interactions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rb.Interaction']", 'through': "orm['rb.BoardInteraction']", 'symmetrical': 'False'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'board_owner'", 'to': "orm['auth.User']"}),
            'title': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'visible': ('django.db.models.fields.BooleanField', [], {'default': 'True'})
        },
        'rb.boardadmin': {
            'Meta': {'unique_together': "(('board', 'user'),)", 'object_name': 'BoardAdmin'},
            'approved': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'board': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Board']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'rb.boardinteraction': {
            'Meta': {'unique_together': "(('board', 'interaction'),)", 'object_name': 'BoardInteraction'},
            'board': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Board']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interaction': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Interaction']"})
        },
        'rb.container': {
            'Meta': {'object_name': 'Container'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'hash': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '32', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'kind': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        },
        'rb.content': {
            'Meta': {'object_name': 'Content'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'kind': ('django.db.models.fields.CharField', [], {'default': "'pag'", 'max_length': '3'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True'})
        },
        'rb.feature': {
            'Meta': {'unique_together': "(('text', 'images', 'flash'),)", 'object_name': 'Feature'},
            'flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'images': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'text': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        'rb.follow': {
            'Meta': {'unique_together': "(('owner', 'type', 'follow_id'),)", 'object_name': 'Follow'},
            'board': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'followed_board'", 'null': 'True', 'to': "orm['rb.Board']"}),
            'follow_id': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'followed_group'", 'null': 'True', 'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'follow_owner'", 'to': "orm['auth.User']"}),
            'page': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'followed_page'", 'null': 'True', 'to': "orm['rb.Page']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'followed_user'", 'null': 'True', 'to': "orm['auth.User']"})
        },
        'rb.group': {
            'Meta': {'ordering': "['short_name']", 'object_name': 'Group'},
            'admins': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rb.SocialUser']", 'through': "orm['rb.GroupAdmin']", 'symmetrical': 'False'}),
            'anno_whitelist': ('django.db.models.fields.CharField', [], {'default': "u'p,img'", 'max_length': '255', 'blank': 'True'}),
            'approved': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'blessed_tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rb.InteractionNode']", 'through': "orm['rb.GroupBlessedTag']", 'symmetrical': 'False'}),
            'bookmark': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Bookmark Feature'", 'to': "orm['rb.Feature']"}),
            'call_to_action': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255', 'blank': 'True'}),
            'comment': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Comment Feature'", 'to': "orm['rb.Feature']"}),
            'custom_css': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'demo_group': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'img_blacklist': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'img_whitelist': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'inline_func': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '25', 'blank': 'True'}),
            'inline_selector': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '100', 'blank': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'default': "'en'", 'max_length': '25'}),
            'logo_url_lg': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_med': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_sm': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'media_display_pref': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '25', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'no_readr': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'post_href_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'post_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'rate': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Rate Feature'", 'to': "orm['rb.Feature']"}),
            'requires_approval': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'search': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Search Feature'", 'to': "orm['rb.Feature']"}),
            'share': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Share Feature'", 'to': "orm['rb.Feature']"}),
            'sharebox_digg': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'sharebox_facebook': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'sharebox_fade': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'sharebox_google': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'sharebox_reddit': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'sharebox_selector': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '100', 'blank': 'True'}),
            'sharebox_should_own': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'sharebox_show': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'sharebox_stumble': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'sharebox_twitter': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'short_name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'}),
            'summary_widget_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'temp_interact': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'twitter': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'word_blacklist': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        'rb.groupadmin': {
            'Meta': {'unique_together': "(('group', 'social_user'),)", 'object_name': 'GroupAdmin'},
            'approved': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'social_user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.SocialUser']"})
        },
        'rb.groupblessedtag': {
            'Meta': {'ordering': "['order']", 'object_name': 'GroupBlessedTag'},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.InteractionNode']"}),
            'order': ('django.db.models.fields.IntegerField', [], {})
        },
        'rb.interaction': {
            'Meta': {'ordering': "['-created']", 'unique_together': "(('page', 'content', 'kind', 'interaction_node', 'user'),)", 'object_name': 'Interaction'},
            'anonymous': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'approved': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'container': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Container']", 'null': 'True', 'blank': 'True'}),
            'content': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Content']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interaction_node': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.InteractionNode']"}),
            'kind': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Page']"}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Interaction']", 'null': 'True', 'blank': 'True'}),
            'rank': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'rb.interactionnode': {
            'Meta': {'object_name': 'InteractionNode'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        'rb.link': {
            'Meta': {'object_name': 'Link'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interaction': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Interaction']", 'unique': 'True'}),
            'usage_count': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'rb.nodevalue': {
            'Meta': {'unique_together': "(('group', 'node', 'value'),)", 'object_name': 'NodeValue'},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.InteractionNode']"}),
            'value': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'rb.page': {
            'Meta': {'unique_together': "(('site', 'url', 'canonical_url'),)", 'object_name': 'Page'},
            'canonical_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'site': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Site']"}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        'rb.profile': {
            'Meta': {'object_name': 'Profile'},
            'educated': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['auth.User']", 'unique': 'True'})
        },
        'rb.scrublist': {
            'Meta': {'object_name': 'ScrubList'},
            'bad_word': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'scrubbed_word': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'rb.site': {
            'Meta': {'unique_together': "(('name', 'domain', 'group'),)", 'object_name': 'Site'},
            'css': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'domain': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '100'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'include_selectors': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'logo_url_lg': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_med': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_sm': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'no_rdr_selectors': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'querystring_content': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'twitter': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'})
        },
        'rb.socialauth': {
            'Meta': {'unique_together': "(('auth_token', 'expires'),)", 'object_name': 'SocialAuth'},
            'auth_token': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'expires': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'social_user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'social_auth'", 'to': "orm['rb.SocialUser']"})
        },
        'rb.socialuser': {
            'Meta': {'unique_together': "(('provider', 'uid', 'username'),)", 'object_name': 'SocialUser'},
            'avatar': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'bio': ('django.db.models.fields.TextField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'default_tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rb.InteractionNode']", 'through': "orm['rb.UserDefaultTag']", 'symmetrical': 'False'}),
            'follow_email_option': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'full_name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'gender': ('django.db.models.fields.CharField', [], {'max_length': '1', 'null': 'True', 'blank': 'True'}),
            'hometown': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'img_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'notification_email_option': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'private_profile': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'provider': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'uid': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'user': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'social_user'", 'unique': 'True', 'to': "orm['auth.User']"}),
            'username': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'})
        },
        'rb.userdefaulttag': {
            'Meta': {'ordering': "['order']", 'object_name': 'UserDefaultTag'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.InteractionNode']"}),
            'order': ('django.db.models.fields.IntegerField', [], {}),
            'social_user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.SocialUser']"})
        }
    }

    complete_apps = ['rb']
