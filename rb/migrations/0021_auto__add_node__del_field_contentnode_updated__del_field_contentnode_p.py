# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Node'
        db.create_table('rb_node', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['rb.Node'])),
            ('inserted', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
        ))
        db.send_create_signal('rb', ['Node'])

        # Deleting field 'ContentNode.updated'
        db.delete_column('rb_contentnode', 'updated')

        # Deleting field 'ContentNode.parent'
        db.delete_column('rb_contentnode', 'parent_id')

        # Deleting field 'ContentNode.inserted'
        db.delete_column('rb_contentnode', 'inserted')

        # Deleting field 'ContentNode.id'
        db.delete_column('rb_contentnode', 'id')

        # Adding field 'ContentNode.node_ptr'
        db.add_column('rb_contentnode', 'node_ptr', self.gf('django.db.models.fields.related.OneToOneField')(default=['datetime'], to=orm['rb.Node'], unique=True, primary_key=True), keep_default=False)

        # Deleting field 'Tag.updated'
        db.delete_column('rb_tag', 'updated')

        # Deleting field 'Tag.parent'
        db.delete_column('rb_tag', 'parent_id')

        # Deleting field 'Tag.inserted'
        db.delete_column('rb_tag', 'inserted')

        # Deleting field 'Tag.id'
        db.delete_column('rb_tag', 'id')

        # Adding field 'Tag.node_ptr'
        db.add_column('rb_tag', 'node_ptr', self.gf('django.db.models.fields.related.OneToOneField')(default=1, to=orm['rb.Node'], unique=True, primary_key=True), keep_default=False)

        # Deleting field 'Comment.updated'
        db.delete_column('rb_comment', 'updated')

        # Deleting field 'Comment.parent'
        db.delete_column('rb_comment', 'parent_id')

        # Deleting field 'Comment.inserted'
        db.delete_column('rb_comment', 'inserted')

        # Deleting field 'Comment.id'
        db.delete_column('rb_comment', 'id')

        # Adding field 'Comment.node_ptr'
        db.add_column('rb_comment', 'node_ptr', self.gf('django.db.models.fields.related.OneToOneField')(default=1, to=orm['rb.Node'], unique=True, primary_key=True), keep_default=False)


    def backwards(self, orm):
        
        # Deleting model 'Node'
        db.delete_table('rb_node')

        # User chose to not deal with backwards NULL issues for 'ContentNode.updated'
        raise RuntimeError("Cannot reverse this migration. 'ContentNode.updated' and its values cannot be restored.")

        # Adding field 'ContentNode.parent'
        db.add_column('rb_contentnode', 'parent', self.gf('django.db.models.fields.related.ForeignKey')(related_name='children', null=True, to=orm['rb.ContentNode'], blank=True), keep_default=False)

        # User chose to not deal with backwards NULL issues for 'ContentNode.inserted'
        raise RuntimeError("Cannot reverse this migration. 'ContentNode.inserted' and its values cannot be restored.")

        # User chose to not deal with backwards NULL issues for 'ContentNode.id'
        raise RuntimeError("Cannot reverse this migration. 'ContentNode.id' and its values cannot be restored.")

        # Deleting field 'ContentNode.node_ptr'
        db.delete_column('rb_contentnode', 'node_ptr_id')

        # User chose to not deal with backwards NULL issues for 'Tag.updated'
        raise RuntimeError("Cannot reverse this migration. 'Tag.updated' and its values cannot be restored.")

        # Adding field 'Tag.parent'
        db.add_column('rb_tag', 'parent', self.gf('django.db.models.fields.related.ForeignKey')(related_name='children', null=True, to=orm['rb.Tag'], blank=True), keep_default=False)

        # User chose to not deal with backwards NULL issues for 'Tag.inserted'
        raise RuntimeError("Cannot reverse this migration. 'Tag.inserted' and its values cannot be restored.")

        # User chose to not deal with backwards NULL issues for 'Tag.id'
        raise RuntimeError("Cannot reverse this migration. 'Tag.id' and its values cannot be restored.")

        # Deleting field 'Tag.node_ptr'
        db.delete_column('rb_tag', 'node_ptr_id')

        # User chose to not deal with backwards NULL issues for 'Comment.updated'
        raise RuntimeError("Cannot reverse this migration. 'Comment.updated' and its values cannot be restored.")

        # Adding field 'Comment.parent'
        db.add_column('rb_comment', 'parent', self.gf('django.db.models.fields.related.ForeignKey')(related_name='children', null=True, to=orm['rb.Comment'], blank=True), keep_default=False)

        # User chose to not deal with backwards NULL issues for 'Comment.inserted'
        raise RuntimeError("Cannot reverse this migration. 'Comment.inserted' and its values cannot be restored.")

        # User chose to not deal with backwards NULL issues for 'Comment.id'
        raise RuntimeError("Cannot reverse this migration. 'Comment.id' and its values cannot be restored.")

        # Deleting field 'Comment.node_ptr'
        db.delete_column('rb_comment', 'node_ptr_id')


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
        'rb.comment': {
            'Meta': {'object_name': 'Comment', '_ormbases': ['rb.Node']},
            'comment': ('django.db.models.fields.TextField', [], {}),
            'node_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['rb.Node']", 'unique': 'True', 'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'rb.contentnode': {
            'Meta': {'object_name': 'ContentNode', '_ormbases': ['rb.Node']},
            'content': ('django.db.models.fields.TextField', [], {}),
            'hash': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'node_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['rb.Node']", 'unique': 'True', 'primary_key': 'True'}),
            'rb_page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.RBPage']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'rb.feature': {
            'Meta': {'object_name': 'Feature'},
            'flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'images': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'kind': ('django.db.models.fields.PositiveSmallIntegerField', [], {'default': '1'}),
            'rb_group': ('django.db.models.fields.related.ForeignKey', [], {'default': '1', 'to': "orm['rb.RBGroup']"}),
            'text': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        'rb.node': {
            'Meta': {'object_name': 'Node'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inserted': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['rb.Node']"}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'rb.rbgroup': {
            'Meta': {'ordering': "['short_name']", 'object_name': 'RBGroup'},
            'anno_whitelist': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'blessed_tags': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
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
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '25'}),
            'valid_domains': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'})
        },
        'rb.rbpage': {
            'Meta': {'object_name': 'RBPage'},
            'canonical_url': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'rb_site': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.RBSite']"}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        'rb.rbsite': {
            'Meta': {'ordering': "('domain',)", 'object_name': 'RBSite', '_ormbases': ['sites.Site']},
            'css': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'include_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'no_rdr_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'rb_group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.RBGroup']"}),
            'site_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['sites.Site']", 'unique': 'True', 'primary_key': 'True'})
        },
        'rb.tag': {
            'Meta': {'object_name': 'Tag', '_ormbases': ['rb.Node']},
            'node_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['rb.Node']", 'unique': 'True', 'primary_key': 'True'}),
            'tag': ('django.db.models.fields.CharField', [], {'max_length': '160'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'sites.site': {
            'Meta': {'ordering': "('domain',)", 'object_name': 'Site', 'db_table': "'django_site'"},
            'domain': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['rb']
