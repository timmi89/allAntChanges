# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Deleting field 'RBGroup.short_name'
        db.delete_column('rb_rbgroup', 'short_name')

        # Adding field 'RBGroup.public_id'
        db.add_column('rb_rbgroup', 'public_id', self.gf('django.db.models.fields.CharField')(default='', max_length=25), keep_default=False)

        # Adding field 'RBGroup.selector_whitelist'
        db.add_column('rb_rbgroup', 'selector_whitelist', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'RBGroup.selector_blacklist'
        db.add_column('rb_rbgroup', 'selector_blacklist', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'RBGroup.tag_whitelist'
        db.add_column('rb_rbgroup', 'tag_whitelist', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'RBGroup.tag_blacklist'
        db.add_column('rb_rbgroup', 'tag_blacklist', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding field 'RBGroup.css_url'
        db.add_column('rb_rbgroup', 'css_url', self.gf('django.db.models.fields.URLField')(default='http://www.blank.org/', max_length=200), keep_default=False)


    def backwards(self, orm):
        
        # Adding field 'RBGroup.short_name'
        db.add_column('rb_rbgroup', 'short_name', self.gf('django.db.models.fields.CharField')(default='', max_length=25), keep_default=False)

        # Deleting field 'RBGroup.public_id'
        db.delete_column('rb_rbgroup', 'public_id')

        # Deleting field 'RBGroup.selector_whitelist'
        db.delete_column('rb_rbgroup', 'selector_whitelist')

        # Deleting field 'RBGroup.selector_blacklist'
        db.delete_column('rb_rbgroup', 'selector_blacklist')

        # Deleting field 'RBGroup.tag_whitelist'
        db.delete_column('rb_rbgroup', 'tag_whitelist')

        # Deleting field 'RBGroup.tag_blacklist'
        db.delete_column('rb_rbgroup', 'tag_blacklist')

        # Deleting field 'RBGroup.css_url'
        db.delete_column('rb_rbgroup', 'css_url')


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
            'Meta': {'object_name': 'Comment'},
            'comment': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inserted': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['rb.Comment']"}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'rb.contentnode': {
            'Meta': {'object_name': 'ContentNode'},
            'content': ('django.db.models.fields.TextField', [], {}),
            'hash': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inserted': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['rb.ContentNode']"}),
            'rb_page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.RBPage']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'rb.rbgroup': {
            'Meta': {'object_name': 'RBGroup'},
            'css': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'css_url': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'include_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'no_rdr_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'public_id': ('django.db.models.fields.CharField', [], {'max_length': '25'}),
            'selector_blacklist': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'selector_whitelist': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'tag_blacklist': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'tag_whitelist': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        'rb.rbpage': {
            'Meta': {'object_name': 'RBPage'},
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
            'Meta': {'object_name': 'Tag'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inserted': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['rb.Tag']"}),
            'tag': ('django.db.models.fields.CharField', [], {'max_length': '160'}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
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
