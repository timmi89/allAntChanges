# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'Page.created'
        db.add_column('rb_page', 'created',
                      self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, default=datetime.datetime(2014, 11, 19, 0, 0), blank=True),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'Page.created'
        db.delete_column('rb_page', 'created')


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
        'rb.alltag': {
            'Meta': {'ordering': "['order']", 'unique_together': "(('group', 'node'),)", 'object_name': 'AllTag'},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.InteractionNode']"}),
            'order': ('django.db.models.fields.IntegerField', [], {})
        },
        'rb.blockedtag': {
            'Meta': {'ordering': "['order']", 'unique_together': "(('group', 'node'),)", 'object_name': 'BlockedTag'},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.InteractionNode']"}),
            'order': ('django.db.models.fields.IntegerField', [], {})
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
            'item_type': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '64', 'blank': 'True'}),
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
            'active_sections': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'admins': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rb.SocialUser']", 'through': "orm['rb.GroupAdmin']", 'symmetrical': 'False'}),
            'all_tags': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'All Tag'", 'symmetrical': 'False', 'through': "orm['rb.AllTag']", 'to': "orm['rb.InteractionNode']"}),
            'anno_whitelist': ('django.db.models.fields.CharField', [], {'default': "u'p,img'", 'max_length': '255', 'blank': 'True'}),
            'approved': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'author_attribute': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'author_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'blessed_tags': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'Blessed Tag'", 'symmetrical': 'False', 'through': "orm['rb.GroupBlessedTag']", 'to': "orm['rb.InteractionNode']"}),
            'blocked_tags': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'Blocked Tag'", 'symmetrical': 'False', 'through': "orm['rb.BlockedTag']", 'to': "orm['rb.InteractionNode']"}),
            'bookmark': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Bookmark Feature'", 'to': "orm['rb.Feature']"}),
            'br_replace_scope_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'call_to_action': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255', 'blank': 'True'}),
            'comment': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Comment Feature'", 'to': "orm['rb.Feature']"}),
            'custom_css': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'demo_group': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'doubleTapMessage': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'doubleTapMessagePosition': ('django.db.models.fields.CharField', [], {'default': "'bottom'", 'max_length': '25'}),
            'hideDoubleTapMessage': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'hideOnMobile': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image_attribute': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'image_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'img_blacklist': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'img_indicator_show_onload': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'img_indicator_show_side': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '25', 'blank': 'True'}),
            'img_whitelist': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'inline_func': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '25', 'blank': 'True'}),
            'inline_selector': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '100', 'blank': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'default': "'en'", 'max_length': '25'}),
            'logo_url_lg': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_med': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_sm': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'media_display_pref': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '25', 'blank': 'True'}),
            'media_url_ignore_query': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'no_readr': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'paragraph_helper': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'post_href_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'post_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'premium': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'rate': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Rate Feature'", 'to': "orm['rb.Feature']"}),
            'recirc_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'recirc_title': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'requires_approval': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'search': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Search Feature'", 'to': "orm['rb.Feature']"}),
            'section_attribute': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'section_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'send_notifications': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'separate_cta': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
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
            'show_recirc': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'signin_organic_required': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'summary_widget_method': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'summary_widget_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'tag_box_bg_colors': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'tag_box_font_family': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'tag_box_gradient': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'tag_box_text_colors': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'tags_bg_css': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'temp_interact': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'topics_attribute': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'topics_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
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
            'author': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'canonical_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'section': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'site': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Site']"}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'topics': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        'rb.product': {
            'Meta': {'object_name': 'Product'},
            'additionalType': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'aggregateRating_ratingValue': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'alternateName': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'brand_name': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'color': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'gtin13': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'gtin14': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'gtin8': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'logo': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'manufacturer': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'model': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'mpn': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'offers_price': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'offers_priceCurrency': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'productID': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'releaseDate': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'sameAs': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'sku': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'url': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'weight': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'width': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'})
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
            'auth_token': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
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