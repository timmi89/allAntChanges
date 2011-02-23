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
            ('inserted', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
        ))
        db.send_create_signal('rb', ['Node'])

        # Adding model 'Edge'
        db.create_table('rb_edge', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(related_name='Parent', to=orm['rb.Node'])),
            ('child', self.gf('django.db.models.fields.related.ForeignKey')(related_name='Child', to=orm['rb.Node'])),
        ))
        db.send_create_signal('rb', ['Edge'])

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

        # Adding model 'RBGroup'
        db.create_table('rb_rbgroup', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('short_name', self.gf('django.db.models.fields.CharField')(max_length=25)),
            ('language', self.gf('django.db.models.fields.CharField')(default='en', max_length=25)),
            ('blessed_tags', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('valid_domains', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('anno_whitelist', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('img_whitelist', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('img_blacklist', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('no_readr', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('logo_url_sm', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
            ('logo_url_med', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
            ('logo_url_lg', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
            ('css_url', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
        ))
        db.send_create_signal('rb', ['RBGroup'])

        # Adding model 'Feature'
        db.create_table('rb_feature', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('kind', self.gf('django.db.models.fields.PositiveSmallIntegerField')(default=1)),
            ('text', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('images', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('flash', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('rb_group', self.gf('django.db.models.fields.related.ForeignKey')(default=1, to=orm['rb.RBGroup'])),
        ))
        db.send_create_signal('rb', ['Feature'])

        # Adding model 'RBSite'
        db.create_table('rb_rbsite', (
            ('site_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['sites.Site'], unique=True, primary_key=True)),
            ('rb_group', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.RBGroup'])),
            ('include_selectors', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('no_rdr_selectors', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('css', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
        ))
        db.send_create_signal('rb', ['RBSite'])

        # Adding model 'RBPage'
        db.create_table('rb_rbpage', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('rb_site', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.RBSite'])),
            ('url', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('canonical_url', self.gf('django.db.models.fields.URLField')(max_length=200)),
        ))
        db.send_create_signal('rb', ['RBPage'])

        # Adding model 'ContentNode'
        db.create_table('rb_contentnode', (
            ('node_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['rb.Node'], unique=True, primary_key=True)),
            ('content_type', self.gf('django.db.models.fields.CharField')(max_length=3)),
            ('content', self.gf('django.db.models.fields.TextField')()),
            ('rb_page', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.RBPage'])),
            ('hash', self.gf('django.db.models.fields.CharField')(max_length=32)),
        ))
        db.send_create_signal('rb', ['ContentNode'])


    def backwards(self, orm):
        
        # Deleting model 'Node'
        db.delete_table('rb_node')

        # Deleting model 'Edge'
        db.delete_table('rb_edge')

        # Deleting model 'Comment'
        db.delete_table('rb_comment')

        # Deleting model 'Tag'
        db.delete_table('rb_tag')

        # Deleting model 'RBGroup'
        db.delete_table('rb_rbgroup')

        # Deleting model 'Feature'
        db.delete_table('rb_feature')

        # Deleting model 'RBSite'
        db.delete_table('rb_rbsite')

        # Deleting model 'RBPage'
        db.delete_table('rb_rbpage')

        # Deleting model 'ContentNode'
        db.delete_table('rb_contentnode')


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
            'Meta': {'object_name': 'ContentNode', '_ormbases': ['rb.Node']},
            'content': ('django.db.models.fields.TextField', [], {}),
            'content_type': ('django.db.models.fields.CharField', [], {'max_length': '3'}),
            'hash': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'node_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['rb.Node']", 'unique': 'True', 'primary_key': 'True'}),
            'rb_page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.RBPage']"})
        },
        'rb.edge': {
            'Meta': {'object_name': 'Edge'},
            'child': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'Child'", 'to': "orm['rb.Node']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'Parent'", 'to': "orm['rb.Node']"})
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
