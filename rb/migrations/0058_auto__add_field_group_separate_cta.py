# -*- coding: utf-8 -*-
# from south.utils import datetime_utils as datetime
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'Group.separate_cta'
        db.add_column(u'rb_group', 'separate_cta',
                      self.gf('django.db.models.fields.CharField')(default='', max_length=255, blank=True),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'Group.separate_cta'
        db.delete_column(u'rb_group', 'separate_cta')


    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'rb.alltag': {
            'Meta': {'ordering': "['order']", 'unique_together': "(('group', 'node'),)", 'object_name': 'AllTag'},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.InteractionNode']"}),
            'order': ('django.db.models.fields.IntegerField', [], {})
        },
        u'rb.blockedtag': {
            'Meta': {'ordering': "['order']", 'unique_together': "(('group', 'node'),)", 'object_name': 'BlockedTag'},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.InteractionNode']"}),
            'order': ('django.db.models.fields.IntegerField', [], {})
        },
        u'rb.board': {
            'Meta': {'unique_together': "(('owner', 'title'),)", 'object_name': 'Board'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'admins': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.User']", 'through': u"orm['rb.BoardAdmin']", 'symmetrical': 'False'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interactions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['rb.Interaction']", 'through': u"orm['rb.BoardInteraction']", 'symmetrical': 'False'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'board_owner'", 'to': u"orm['auth.User']"}),
            'title': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'visible': ('django.db.models.fields.BooleanField', [], {'default': 'True'})
        },
        u'rb.boardadmin': {
            'Meta': {'unique_together': "(('board', 'user'),)", 'object_name': 'BoardAdmin'},
            'approved': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'board': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Board']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"})
        },
        u'rb.boardinteraction': {
            'Meta': {'unique_together': "(('board', 'interaction'),)", 'object_name': 'BoardInteraction'},
            'board': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Board']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interaction': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Interaction']"})
        },
        u'rb.container': {
            'Meta': {'object_name': 'Container'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'hash': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '32', 'db_index': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item_type': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '64', 'blank': 'True'}),
            'kind': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        },
        u'rb.content': {
            'Meta': {'object_name': 'Content'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'kind': ('django.db.models.fields.CharField', [], {'default': "'pag'", 'max_length': '3'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True'})
        },
        u'rb.feature': {
            'Meta': {'unique_together': "(('text', 'images', 'flash'),)", 'object_name': 'Feature'},
            'flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'images': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'text': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        u'rb.follow': {
            'Meta': {'unique_together': "(('owner', 'type', 'follow_id'),)", 'object_name': 'Follow'},
            'board': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'followed_board'", 'null': 'True', 'to': u"orm['rb.Board']"}),
            'follow_id': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'followed_group'", 'null': 'True', 'to': u"orm['rb.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'follow_owner'", 'to': u"orm['auth.User']"}),
            'page': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'followed_page'", 'null': 'True', 'to': u"orm['rb.Page']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'followed_user'", 'null': 'True', 'to': u"orm['auth.User']"})
        },
        u'rb.group': {
            'Meta': {'ordering': "['short_name']", 'object_name': 'Group'},
            'active_sections': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'admins': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['rb.SocialUser']", 'through': u"orm['rb.GroupAdmin']", 'symmetrical': 'False'}),
            'all_tags': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'All Tag'", 'symmetrical': 'False', 'through': u"orm['rb.AllTag']", 'to': u"orm['rb.InteractionNode']"}),
            'anno_whitelist': ('django.db.models.fields.CharField', [], {'default': "u'p,img'", 'max_length': '255', 'blank': 'True'}),
            'approved': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'author_attribute': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'author_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'blessed_tags': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'Blessed Tag'", 'symmetrical': 'False', 'through': u"orm['rb.GroupBlessedTag']", 'to': u"orm['rb.InteractionNode']"}),
            'blocked_tags': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'Blocked Tag'", 'symmetrical': 'False', 'through': u"orm['rb.BlockedTag']", 'to': u"orm['rb.InteractionNode']"}),
            'bookmark': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Bookmark Feature'", 'to': u"orm['rb.Feature']"}),
            'br_replace_scope_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'call_to_action': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255', 'blank': 'True'}),
            'comment': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Comment Feature'", 'to': u"orm['rb.Feature']"}),
            'custom_css': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'demo_group': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'doubleTapMessage': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'doubleTapMessagePosition': ('django.db.models.fields.CharField', [], {'default': "'bottom'", 'max_length': '25'}),
            'hideDoubleTapMessage': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'hideOnMobile': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'img_blacklist': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
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
            'rate': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Rate Feature'", 'to': u"orm['rb.Feature']"}),
            'requires_approval': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'search': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Search Feature'", 'to': u"orm['rb.Feature']"}),
            'section_attribute': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'section_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'send_notifications': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'separate_cta': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'share': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'related_name': "'Share Feature'", 'to': u"orm['rb.Feature']"}),
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
            'signin_organic_required': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'summary_widget_method': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'summary_widget_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'temp_interact': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'topics_attribute': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'topics_selector': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'twitter': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'word_blacklist': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        u'rb.groupadmin': {
            'Meta': {'unique_together': "(('group', 'social_user'),)", 'object_name': 'GroupAdmin'},
            'approved': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'social_user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.SocialUser']"})
        },
        u'rb.groupblessedtag': {
            'Meta': {'ordering': "['order']", 'object_name': 'GroupBlessedTag'},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.InteractionNode']"}),
            'order': ('django.db.models.fields.IntegerField', [], {})
        },
        u'rb.interaction': {
            'Meta': {'ordering': "['-created']", 'unique_together': "(('page', 'content', 'kind', 'interaction_node', 'user'),)", 'object_name': 'Interaction'},
            'anonymous': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'approved': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'container': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Container']", 'null': 'True', 'blank': 'True'}),
            'content': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Content']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interaction_node': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.InteractionNode']"}),
            'kind': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'page': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Page']"}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Interaction']", 'null': 'True', 'blank': 'True'}),
            'rank': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"})
        },
        u'rb.interactionnode': {
            'Meta': {'object_name': 'InteractionNode'},
            'body': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        u'rb.link': {
            'Meta': {'object_name': 'Link'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interaction': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Interaction']", 'unique': 'True'}),
            'usage_count': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'rb.nodevalue': {
            'Meta': {'unique_together': "(('group', 'node', 'value'),)", 'object_name': 'NodeValue'},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.InteractionNode']"}),
            'value': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'rb.page': {
            'Meta': {'unique_together': "(('site', 'url', 'canonical_url'),)", 'object_name': 'Page'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'canonical_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'section': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'site': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Site']"}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'topics': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        u'rb.product': {
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
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
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
        u'rb.profile': {
            'Meta': {'object_name': 'Profile'},
            'educated': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['auth.User']", 'unique': 'True'})
        },
        u'rb.scrublist': {
            'Meta': {'object_name': 'ScrubList'},
            'bad_word': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'scrubbed_word': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'rb.site': {
            'Meta': {'unique_together': "(('name', 'domain', 'group'),)", 'object_name': 'Site'},
            'css': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'domain': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '100'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'include_selectors': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'logo_url_lg': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_med': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_sm': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'no_rdr_selectors': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'querystring_content': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'twitter': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'})
        },
        u'rb.socialauth': {
            'Meta': {'unique_together': "(('auth_token', 'expires'),)", 'object_name': 'SocialAuth'},
            'auth_token': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'expires': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'social_user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'social_auth'", 'to': u"orm['rb.SocialUser']"})
        },
        u'rb.socialuser': {
            'Meta': {'unique_together': "(('provider', 'uid', 'username'),)", 'object_name': 'SocialUser'},
            'avatar': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'bio': ('django.db.models.fields.TextField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'default_tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['rb.InteractionNode']", 'through': u"orm['rb.UserDefaultTag']", 'symmetrical': 'False'}),
            'follow_email_option': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'full_name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'gender': ('django.db.models.fields.CharField', [], {'max_length': '1', 'null': 'True', 'blank': 'True'}),
            'hometown': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'img_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'notification_email_option': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'private_profile': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'provider': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'uid': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'user': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'social_user'", 'unique': 'True', 'to': u"orm['auth.User']"}),
            'username': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'})
        },
        u'rb.userdefaulttag': {
            'Meta': {'ordering': "['order']", 'object_name': 'UserDefaultTag'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.InteractionNode']"}),
            'order': ('django.db.models.fields.IntegerField', [], {}),
            'social_user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['rb.SocialUser']"})
        }
    }

    complete_apps = ['rb']