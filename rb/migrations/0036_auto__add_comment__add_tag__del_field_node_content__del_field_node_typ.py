# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Comment'
        db.create_table('rb_comment', (
            ('node_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['rb.Node'], unique=True, primary_key=True)),
            ('content', self.gf('django.db.models.fields.TextField')(blank=True)),
        ))
        db.send_create_signal('rb', ['Comment'])

        # Adding model 'Tag'
        db.create_table('rb_tag', (
            ('node_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['rb.Node'], unique=True, primary_key=True)),
            ('content', self.gf('django.db.models.fields.CharField')(max_length=64)),
        ))
        db.send_create_signal('rb', ['Tag'])

        # Deleting field 'Node.content'
        db.delete_column('rb_node', 'content')

        # Deleting field 'Node.type'
        db.delete_column('rb_node', 'type')

        # Adding field 'Node.user'
        db.add_column('rb_node', 'user', self.gf('django.db.models.fields.related.ForeignKey')(default=1, to=orm['auth.User']), keep_default=False)

        # Deleting field 'ContentNode.node_ptr'
        db.delete_column('rb_contentnode', 'node_ptr_id')

        # Adding field 'ContentNode.id'
        db.add_column('rb_contentnode', 'id', self.gf('django.db.models.fields.AutoField')(default=1, primary_key=True), keep_default=False)

        # Adding field 'ContentNode.inserted'
        db.add_column('rb_contentnode', 'inserted', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, default=1, blank=True), keep_default=False)

        # Adding field 'ContentNode.updated'
        db.add_column('rb_contentnode', 'updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, default=1, blank=True), keep_default=False)


    def backwards(self, orm):
        
        # Deleting model 'Comment'
        db.delete_table('rb_comment')

        # Deleting model 'Tag'
        db.delete_table('rb_tag')

        # Adding field 'Node.content'
        db.add_column('rb_node', 'content', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # User chose to not deal with backwards NULL issues for 'Node.type'
        raise RuntimeError("Cannot reverse this migration. 'Node.type' and its values cannot be restored.")

        # Deleting field 'Node.user'
        db.delete_column('rb_node', 'user_id')

        # User chose to not deal with backwards NULL issues for 'ContentNode.node_ptr'
        raise RuntimeError("Cannot reverse this migration. 'ContentNode.node_ptr' and its values cannot be restored.")

        # Deleting field 'ContentNode.id'
        db.delete_column('rb_contentnode', 'id')

        # Deleting field 'ContentNode.inserted'
        db.delete_column('rb_contentnode', 'inserted')

        # Deleting field 'ContentNode.updated'
        db.delete_column('rb_contentnode', 'updated')


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
            'content': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'node_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['rb.Node']", 'unique': 'True', 'primary_key': 'True'})
        },
        'rb.contentnode': {
            'Meta': {'object_name': 'ContentNode'},
            'content_type': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
            'hash': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inserted': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'rb_page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.RBPage']"}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
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
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
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
            'content': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'node_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['rb.Node']", 'unique': 'True', 'primary_key': 'True'})
        },
        'sites.site': {
            'Meta': {'ordering': "('domain',)", 'object_name': 'Site', 'db_table': "'django_site'"},
            'domain': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['rb']
