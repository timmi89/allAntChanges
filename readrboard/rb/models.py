from django.db import models
from django.contrib.auth.models import User
import datetime

# Create your models here.
class Node(models.Model):
    # Time fields
    created = models.DateField(auto_now_add=True, editable=False, verbose_name='time-created')
    modified = models.DateField(auto_now=True, editable=False, verbose_name='time-modified')
    # Connectors
    user = models.ForeignKey(User)
    parent = models.ForeignKey('self', null=True, blank=True)
    # Content
    body = models.TextField()
    shorturl = models.URLField(blank=True)
    
    def __unicode__(self):
        title = self.body
        if len(self.body) > 50:
            title = u"%s ..." % title[0:50]
        return title

    class Meta:
        verbose_name_plural = 'nodes'
        ordering = ['-modified']
