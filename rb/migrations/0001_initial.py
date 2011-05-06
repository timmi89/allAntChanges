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

        # Adding unique constraint on 'Feature', fields ['text', 'images', 'flash']
        db.create_unique('rb_feature', ['text', 'images', 'flash'])

        # Adding model 'InteractionNode'
        db.create_table('rb_interactionnode', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('kind', self.gf('django.db.models.fields.CharField')(max_length=3)),
            ('body', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('rb', ['InteractionNode'])

        # Adding unique constraint on 'InteractionNode', fields ['kind', 'body']
        db.create_unique('rb_interactionnode', ['kind', 'body'])

        # Adding model 'Group'
        db.create_table('rb_group', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('short_name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=25)),
            ('language', self.gf('django.db.models.fields.CharField')(default='en', max_length=25)),
            ('valid_domains', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('anno_whitelist', self.gf('django.db.models.fields.CharField')(default=u'p', max_length=250, blank=True)),
            ('img_whitelist', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('img_blacklist', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('no_readr', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('logo_url_sm', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
            ('logo_url_med', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
            ('logo_url_lg', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
            ('share', self.gf('django.db.models.fields.related.ForeignKey')(related_name='Share Feature', to=orm['rb.Feature'])),
            ('rate', self.gf('django.db.models.fields.related.ForeignKey')(related_name='Rate Feature', to=orm['rb.Feature'])),
            ('comment', self.gf('django.db.models.fields.related.ForeignKey')(related_name='Comment Feature', to=orm['rb.Feature'])),
            ('bookmark', self.gf('django.db.models.fields.related.ForeignKey')(related_name='Bookmark Feature', to=orm['rb.Feature'])),
            ('search', self.gf('django.db.models.fields.related.ForeignKey')(related_name='Search Feature', to=orm['rb.Feature'])),
            ('temp_interact', self.gf('django.db.models.fields.IntegerField')(default=5)),
            ('css_url', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
            ('secret', self.gf('django.db.models.fields.CharField')(max_length=128)),
        ))
        db.send_create_signal('rb', ['Group'])

        # Adding M2M table for field blessed_tags on 'Group'
        db.create_table('rb_group_blessed_tags', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('group', models.ForeignKey(orm['rb.group'], null=False)),
            ('interactionnode', models.ForeignKey(orm['rb.interactionnode'], null=False))
        ))
        db.create_unique('rb_group_blessed_tags', ['group_id', 'interactionnode_id'])

        # Adding model 'NodeValue'
        db.create_table('rb_nodevalue', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('group', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Group'])),
            ('node', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.InteractionNode'])),
            ('value', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('rb', ['NodeValue'])

        # Adding unique constraint on 'NodeValue', fields ['group', 'node', 'value']
        db.create_unique('rb_nodevalue', ['group_id', 'node_id', 'value'])

        # Adding model 'Site'
        db.create_table('rb_site', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=100)),
            ('domain', self.gf('django.db.models.fields.CharField')(unique=True, max_length=50)),
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
            ('canonical_url', self.gf('django.db.models.fields.URLField')(max_length=200, blank=True)),
        ))
        db.send_create_signal('rb', ['Page'])

        # Adding model 'Content'
        db.create_table('rb_content', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('kind', self.gf('django.db.models.fields.CharField')(default='txt', max_length=3)),
            ('body', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('rb', ['Content'])

        # Adding model 'Container'
        db.create_table('rb_container', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('hash', self.gf('django.db.models.fields.CharField')(unique=True, max_length=32)),
            ('body', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('rb', ['Container'])

        # Adding model 'Interaction'
        db.create_table('rb_interaction', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('page', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Page'])),
            ('container', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Container'], null=True, blank=True)),
            ('content', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Content'])),
            ('interaction_node', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.InteractionNode'])),
            ('anonymous', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Interaction'], null=True, blank=True)),
        ))
        db.send_create_signal('rb', ['Interaction'])

        # Adding unique constraint on 'Interaction', fields ['page', 'content', 'interaction_node', 'user']
        db.create_unique('rb_interaction', ['page_id', 'content_id', 'interaction_node_id', 'user_id'])

        # Adding model 'Link'
        db.create_table('rb_link', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('interaction', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['rb.Interaction'], unique=True)),
            ('usage_count', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('rb', ['Link'])

        # Adding model 'SocialUser'
        db.create_table('rb_socialuser', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.OneToOneField')(related_name='social_user', unique=True, to=orm['auth.User'])),
            ('provider', self.gf('django.db.models.fields.CharField')(max_length=32)),
            ('uid', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('full_name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('username', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255, blank=True)),
            ('gender', self.gf('django.db.models.fields.CharField')(max_length=1, blank=True)),
            ('hometown', self.gf('django.db.models.fields.CharField')(max_length=255, blank=True)),
            ('bio', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('img_url', self.gf('django.db.models.fields.CharField')(max_length=255, blank=True)),
        ))
        db.send_create_signal('rb', ['SocialUser'])

        # Adding unique constraint on 'SocialUser', fields ['provider', 'uid']
        db.create_unique('rb_socialuser', ['provider', 'uid'])

        # Adding model 'SocialAuth'
        db.create_table('rb_socialauth', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('social_user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='social_auth', to=orm['rb.SocialUser'])),
            ('auth_token', self.gf('django.db.models.fields.CharField')(unique=True, max_length=103)),
            ('expires', self.gf('django.db.models.fields.DateTimeField')(null=True)),
        ))
        db.send_create_signal('rb', ['SocialAuth'])

        # Adding unique constraint on 'SocialAuth', fields ['auth_token', 'expires']
        db.create_unique('rb_socialauth', ['auth_token', 'expires'])


    def backwards(self, orm):
        
        # Removing unique constraint on 'SocialAuth', fields ['auth_token', 'expires']
        db.delete_unique('rb_socialauth', ['auth_token', 'expires'])

        # Removing unique constraint on 'SocialUser', fields ['provider', 'uid']
        db.delete_unique('rb_socialuser', ['provider', 'uid'])

        # Removing unique constraint on 'Interaction', fields ['page', 'content', 'interaction_node', 'user']
        db.delete_unique('rb_interaction', ['page_id', 'content_id', 'interaction_node_id', 'user_id'])

        # Removing unique constraint on 'NodeValue', fields ['group', 'node', 'value']
        db.delete_unique('rb_nodevalue', ['group_id', 'node_id', 'value'])

        # Removing unique constraint on 'InteractionNode', fields ['kind', 'body']
        db.delete_unique('rb_interactionnode', ['kind', 'body'])

        # Removing unique constraint on 'Feature', fields ['text', 'images', 'flash']
        db.delete_unique('rb_feature', ['text', 'images', 'flash'])

        # Deleting model 'Feature'
        db.delete_table('rb_feature')

        # Deleting model 'InteractionNode'
        db.delete_table('rb_interactionnode')

        # Deleting model 'Group'
        db.delete_table('rb_group')

        # Removing M2M table for field blessed_tags on 'Group'
        db.delete_table('rb_group_blessed_tags')

        # Deleting model 'NodeValue'
        db.delete_table('rb_nodevalue')

        # Deleting model 'Site'
        db.delete_table('rb_site')

        # Deleting model 'Page'
        db.delete_table('rb_page')

        # Deleting model 'Content'
        db.delete_table('rb_content')

        # Deleting model 'Container'
        db.delete_table('rb_container')

        # Deleting model 'Interaction'
        db.delete_table('rb_interaction')

        # Deleting model 'Link'
        db.delete_table('rb_link')

        # Deleting model 'SocialUser'
        db.delete_table('rb_socialuser')

        # Deleting model 'SocialAuth'
        db.delete_table('rb_socialauth')


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
            'hash': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '32'}),
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
        'rb.feature': {
            'Meta': {'unique_together': "(('text', 'images', 'flash'),)", 'object_name': 'Feature'},
            'flash': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'images': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'text': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        'rb.group': {
            'Meta': {'ordering': "['short_name']", 'object_name': 'Group'},
            'anno_whitelist': ('django.db.models.fields.CharField', [], {'default': "u'p'", 'max_length': '250', 'blank': 'True'}),
            'blessed_tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['rb.InteractionNode']", 'symmetrical': 'False'}),
            'bookmark': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'Bookmark Feature'", 'to': "orm['rb.Feature']"}),
            'comment': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'Comment Feature'", 'to': "orm['rb.Feature']"}),
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
            'rate': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'Rate Feature'", 'to': "orm['rb.Feature']"}),
            'search': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'Search Feature'", 'to': "orm['rb.Feature']"}),
            'secret': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'share': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'Share Feature'", 'to': "orm['rb.Feature']"}),
            'short_name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '25'}),
            'temp_interact': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'valid_domains': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'})
        },
        'rb.interaction': {
            'Meta': {'ordering': "['id']", 'unique_together': "(('page', 'content', 'interaction_node', 'user'),)", 'object_name': 'Interaction'},
            'anonymous': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'container': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Container']", 'null': 'True', 'blank': 'True'}),
            'content': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Content']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'interaction_node': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.InteractionNode']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Page']"}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Interaction']", 'null': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'rb.interactionnode': {
            'Meta': {'unique_together': "(('kind', 'body'),)", 'object_name': 'InteractionNode'},
            'body': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'kind': ('django.db.models.fields.CharField', [], {'max_length': '3'})
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
            'Meta': {'object_name': 'Page'},
            'canonical_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'site': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Site']"}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        'rb.site': {
            'Meta': {'object_name': 'Site'},
            'css': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'domain': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['rb.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'include_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '100'}),
            'no_rdr_selectors': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'})
        },
        'rb.socialauth': {
            'Meta': {'unique_together': "(('auth_token', 'expires'),)", 'object_name': 'SocialAuth'},
            'auth_token': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '103'}),
            'expires': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'social_user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'social_auth'", 'to': "orm['rb.SocialUser']"})
        },
        'rb.socialuser': {
            'Meta': {'unique_together': "(('provider', 'uid'),)", 'object_name': 'SocialUser'},
            'bio': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'full_name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'gender': ('django.db.models.fields.CharField', [], {'max_length': '1', 'blank': 'True'}),
            'hometown': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'img_url': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'provider': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'uid': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'user': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'social_user'", 'unique': 'True', 'to': "orm['auth.User']"}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255', 'blank': 'True'})
        }
    }

    complete_apps = ['rb']
