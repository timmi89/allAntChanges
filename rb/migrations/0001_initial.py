# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Feature'
        db.create_table('rb_feature', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('text', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('images', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('flash', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('rb', ['Feature'])

        # Adding model 'Group'
        db.create_table('rb_group', (
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
            ('share', self.gf('django.db.models.fields.related.OneToOneField')(related_name='Sharables', unique=True, to=orm['rb.Feature'])),
            ('rate', self.gf('django.db.models.fields.related.OneToOneField')(related_name='Ratables', unique=True, to=orm['rb.Feature'])),
            ('comment', self.gf('django.db.models.fields.related.OneToOneField')(related_name='Commentables', unique=True, to=orm['rb.Feature'])),
            ('bookmark', self.gf('django.db.models.fields.related.OneToOneField')(related_name='Bookmarkables', unique=True, to=orm['rb.Feature'])),
            ('search', self.gf('django.db.models.fields.related.OneToOneField')(related_name='Searchables', unique=True, to=orm['rb.Feature'])),
            ('css_url', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
        ))
        db.send_create_signal('rb', ['Group'])

        # Adding model 'Site'
        db.create_table('rb_site', (
            ('site_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['sites.Site'], unique=True, primary_key=True)),
            ('group', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Group'])),
            ('include_selectors', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('no_rdr_selectors', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('css', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
        ))
        db.send_create_signal('rb', ['Site'])

        # Adding model 'Page'
        db.create_table('rb_page', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('site', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Site'])),
            ('url', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('canonical_url', self.gf('django.db.models.fields.URLField')(max_length=200)),
        ))
        db.send_create_signal('rb', ['Page'])

        # Adding model 'Content'
        db.create_table('rb_content', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('inserted', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('kind', self.gf('django.db.models.fields.CharField')(default='txt', max_length=3)),
            ('body', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('rb', ['Content'])

        # Adding model 'Container'
        db.create_table('rb_container', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('hash', self.gf('django.db.models.fields.CharField')(max_length=32)),
        ))
        db.send_create_signal('rb', ['Container'])

        # Adding M2M table for field content on 'Container'
        db.create_table('rb_container_content', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('container', models.ForeignKey(orm['rb.container'], null=False)),
            ('content', models.ForeignKey(orm['rb.content'], null=False))
        ))
        db.create_unique('rb_container_content', ['container_id', 'content_id'])

        # Adding model 'InteractionNode'
        db.create_table('rb_interactionnode', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=3)),
            ('body', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('rb', ['InteractionNode'])

        # Adding model 'Interaction'
        db.create_table('rb_interaction', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('path', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('depth', self.gf('django.db.models.fields.PositiveIntegerField')()),
            ('numchild', self.gf('django.db.models.fields.PositiveIntegerField')(default=0)),
            ('inserted', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('page', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Page'])),
            ('content', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Content'])),
            ('node', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.InteractionNode'])),
        ))
        db.send_create_signal('rb', ['Interaction'])


    def backwards(self, orm):
        
        # Deleting model 'Feature'
        db.delete_table('rb_feature')

        # Deleting model 'Group'
        db.delete_table('rb_group')

        # Deleting model 'Site'
        db.delete_table('rb_site')

        # Deleting model 'Page'
        db.delete_table('rb_page')

        # Deleting model 'Content'
        db.delete_table('rb_content')

        # Deleting model 'Container'
        db.delete_table('rb_container')

        # Removing M2M table for field content on 'Container'
        db.delete_table('rb_container_content')

        # Deleting model 'InteractionNode'
        db.delete_table('rb_interactionnode')

        # Deleting model 'Interaction'
        db.delete_table('rb_interaction')


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
            'Meta': {'object_name': 'Container'},
            'content': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rb.Content']", 'symmetrical': 'False'}),
            'hash': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        'rb.content': {
            'Meta': {'object_name': 'Content'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inserted': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'kind': ('django.db.models.fields.CharField', [], {'default': "'txt'", 'max_length': '3'}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'rb.feature': {
            'Meta': {'object_name': 'Feature'},
            'flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'images': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'text': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        'rb.group': {
            'Meta': {'ordering': "['short_name']", 'object_name': 'Group'},
            'anno_whitelist': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'blessed_tags': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'bookmark': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'Bookmarkables'", 'unique': 'True', 'to': "orm['rb.Feature']"}),
            'comment': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'Commentables'", 'unique': 'True', 'to': "orm['rb.Feature']"}),
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
            'rate': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'Ratables'", 'unique': 'True', 'to': "orm['rb.Feature']"}),
            'search': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'Searchables'", 'unique': 'True', 'to': "orm['rb.Feature']"}),
            'share': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'Sharables'", 'unique': 'True', 'to': "orm['rb.Feature']"}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '25'}),
            'valid_domains': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'})
        },
        'rb.interaction': {
            'Meta': {'object_name': 'Interaction'},
            'content': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Content']"}),
            'depth': ('django.db.models.fields.PositiveIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inserted': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'node': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.InteractionNode']"}),
            'numchild': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Page']"}),
            'path': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'rb.interactionnode': {
            'Meta': {'object_name': 'InteractionNode'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '3'})
        },
        'rb.page': {
            'Meta': {'object_name': 'Page'},
            'canonical_url': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'site': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Site']"}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        'rb.site': {
            'Meta': {'ordering': "('domain',)", 'object_name': 'Site', '_ormbases': ['sites.Site']},
            'css': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'include_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'no_rdr_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'site_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['sites.Site']", 'unique': 'True', 'primary_key': 'True'})
        },
        'sites.site': {
            'Meta': {'ordering': "('domain',)", 'object_name': 'Site', 'db_table': "'django_site'"},
            'domain': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['rb']
