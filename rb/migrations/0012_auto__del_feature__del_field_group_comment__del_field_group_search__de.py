# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Deleting model 'Feature'
        db.delete_table('rb_feature')

        # Deleting field 'Group.comment'
        db.delete_column('rb_group', 'comment_id')

        # Deleting field 'Group.search'
        db.delete_column('rb_group', 'search_id')

        # Deleting field 'Group.bookmark'
        db.delete_column('rb_group', 'bookmark_id')

        # Deleting field 'Group.share'
        db.delete_column('rb_group', 'share_id')

        # Deleting field 'Group.rate'
        db.delete_column('rb_group', 'rate_id')

        # Adding field 'Group.share_text'
        db.add_column('rb_group', 'share_text', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.share_image'
        db.add_column('rb_group', 'share_image', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.share_flash'
        db.add_column('rb_group', 'share_flash', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.rate_text'
        db.add_column('rb_group', 'rate_text', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.rate_image'
        db.add_column('rb_group', 'rate_image', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.rate_flash'
        db.add_column('rb_group', 'rate_flash', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.comment_text'
        db.add_column('rb_group', 'comment_text', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.comment_image'
        db.add_column('rb_group', 'comment_image', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.comment_flash'
        db.add_column('rb_group', 'comment_flash', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.bookmark_text'
        db.add_column('rb_group', 'bookmark_text', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.bookmark_image'
        db.add_column('rb_group', 'bookmark_image', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.bookmark_flash'
        db.add_column('rb_group', 'bookmark_flash', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.search_text'
        db.add_column('rb_group', 'search_text', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.search_image'
        db.add_column('rb_group', 'search_image', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Group.search_flash'
        db.add_column('rb_group', 'search_flash', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)


    def backwards(self, orm):
        
        # Adding model 'Feature'
        db.create_table('rb_feature', (
            ('images', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('flash', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('text', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('rb', ['Feature'])

        # User chose to not deal with backwards NULL issues for 'Group.comment'
        raise RuntimeError("Cannot reverse this migration. 'Group.comment' and its values cannot be restored.")

        # User chose to not deal with backwards NULL issues for 'Group.search'
        raise RuntimeError("Cannot reverse this migration. 'Group.search' and its values cannot be restored.")

        # User chose to not deal with backwards NULL issues for 'Group.bookmark'
        raise RuntimeError("Cannot reverse this migration. 'Group.bookmark' and its values cannot be restored.")

        # User chose to not deal with backwards NULL issues for 'Group.share'
        raise RuntimeError("Cannot reverse this migration. 'Group.share' and its values cannot be restored.")

        # User chose to not deal with backwards NULL issues for 'Group.rate'
        raise RuntimeError("Cannot reverse this migration. 'Group.rate' and its values cannot be restored.")

        # Deleting field 'Group.share_text'
        db.delete_column('rb_group', 'share_text')

        # Deleting field 'Group.share_image'
        db.delete_column('rb_group', 'share_image')

        # Deleting field 'Group.share_flash'
        db.delete_column('rb_group', 'share_flash')

        # Deleting field 'Group.rate_text'
        db.delete_column('rb_group', 'rate_text')

        # Deleting field 'Group.rate_image'
        db.delete_column('rb_group', 'rate_image')

        # Deleting field 'Group.rate_flash'
        db.delete_column('rb_group', 'rate_flash')

        # Deleting field 'Group.comment_text'
        db.delete_column('rb_group', 'comment_text')

        # Deleting field 'Group.comment_image'
        db.delete_column('rb_group', 'comment_image')

        # Deleting field 'Group.comment_flash'
        db.delete_column('rb_group', 'comment_flash')

        # Deleting field 'Group.bookmark_text'
        db.delete_column('rb_group', 'bookmark_text')

        # Deleting field 'Group.bookmark_image'
        db.delete_column('rb_group', 'bookmark_image')

        # Deleting field 'Group.bookmark_flash'
        db.delete_column('rb_group', 'bookmark_flash')

        # Deleting field 'Group.search_text'
        db.delete_column('rb_group', 'search_text')

        # Deleting field 'Group.search_image'
        db.delete_column('rb_group', 'search_image')

        # Deleting field 'Group.search_flash'
        db.delete_column('rb_group', 'search_flash')


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
        'rb.container': {
            'Meta': {'ordering': "['id']", 'object_name': 'Container'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'content': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rb.Content']", 'symmetrical': 'False', 'blank': 'True'}),
            'hash': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        'rb.content': {
            'Meta': {'object_name': 'Content'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'kind': ('django.db.models.fields.CharField', [], {'default': "'txt'", 'max_length': '3'}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'rb.group': {
            'Meta': {'ordering': "['short_name']", 'object_name': 'Group'},
            'anno_whitelist': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'blessed_tags': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'bookmark_flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'bookmark_image': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'bookmark_text': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'comment_flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'comment_image': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'comment_text': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'css_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'img_blacklist': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'img_whitelist': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'default': "'en'", 'max_length': '25'}),
            'logo_url_lg': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_med': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'logo_url_sm': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'no_readr': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'rate_flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'rate_image': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'rate_text': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'search_flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'search_image': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'search_text': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'share_flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'share_image': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'share_text': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '25'}),
            'valid_domains': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'})
        },
        'rb.interaction': {
            'Meta': {'ordering': "['id']", 'object_name': 'Interaction'},
            'anonymous': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'content': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Content']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'depth': ('django.db.models.fields.PositiveIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interaction_node': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.InteractionNode']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'numchild': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Page']"}),
            'path': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'rb.interactionnode': {
            'Meta': {'object_name': 'InteractionNode'},
            'body': ('django.db.models.fields.TextField', [], {'unique': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'kind': ('django.db.models.fields.CharField', [], {'max_length': '3'})
        },
        'rb.page': {
            'Meta': {'object_name': 'Page'},
            'canonical_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'site': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Site']"}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        'rb.site': {
            'Meta': {'object_name': 'Site'},
            'css': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'domain': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'include_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'no_rdr_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'})
        }
    }

    complete_apps = ['rb']
