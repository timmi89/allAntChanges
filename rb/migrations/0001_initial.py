# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'RBGroup'
        db.create_table('rb_rbgroup', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('include_selectors', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('no_rdr_selectors', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('css', self.gf('django.db.models.fields.URLField')(max_length=200)),
        ))
        db.send_create_signal('rb', ['RBGroup'])

        # Adding model 'RBSite'
        db.create_table('rb_rbsite', (
            ('site_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['sites.Site'], unique=True, primary_key=True)),
            ('rb_group', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.RBGroup'])),
            ('include_selectors', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('no_rdr_selectors', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('css', self.gf('django.db.models.fields.URLField')(max_length=200)),
        ))
        db.send_create_signal('rb', ['RBSite'])

        # Adding model 'RBPage'
        db.create_table('rb_rbpage', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['rb.RBPage'])),
            ('inserted', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('rb_site', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.RBSite'])),
            ('url', self.gf('django.db.models.fields.URLField')(max_length=200)),
        ))
        db.send_create_signal('rb', ['RBPage'])

        # Adding model 'ContentNode'
        db.create_table('rb_contentnode', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['rb.ContentNode'])),
            ('inserted', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=3)),
            ('rb_page', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.RBPage'])),
            ('hash', self.gf('django.db.models.fields.CharField')(max_length=32)),
            ('content', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('rb', ['ContentNode'])

        # Adding model 'Comment'
        db.create_table('rb_comment', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['rb.Comment'])),
            ('inserted', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('comment', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('rb', ['Comment'])

        # Adding model 'Tag'
        db.create_table('rb_tag', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['rb.Tag'])),
            ('inserted', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('tag', self.gf('django.db.models.fields.CharField')(max_length=160)),
        ))
        db.send_create_signal('rb', ['Tag'])


    def backwards(self, orm):
        
        # Deleting model 'RBGroup'
        db.delete_table('rb_rbgroup')

        # Deleting model 'RBSite'
        db.delete_table('rb_rbsite')

        # Deleting model 'RBPage'
        db.delete_table('rb_rbpage')

        # Deleting model 'ContentNode'
        db.delete_table('rb_contentnode')

        # Deleting model 'Comment'
        db.delete_table('rb_comment')

        # Deleting model 'Tag'
        db.delete_table('rb_tag')


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
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'include_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'no_rdr_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        },
        'rb.rbpage': {
            'Meta': {'object_name': 'RBPage'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inserted': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['rb.RBPage']"}),
            'rb_site': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.RBSite']"}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        'rb.rbsite': {
            'Meta': {'ordering': "('domain',)", 'object_name': 'RBSite', '_ormbases': ['sites.Site']},
            'css': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'include_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'no_rdr_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
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
