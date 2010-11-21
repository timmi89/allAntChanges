from django.db import models
from django.contrib.auth.models import User
import datetime

# Create your models here.
class Node(models.Model):
    # Time fields
    created = models.DateField(auto_now_add=True, editable=False)
    modified = models.DateField(auto_now_add=True, editable=False)
    # Connectors
    user = models.ForeignKey(User)
    parent = models.ForeignKey('self', null=True, blank=True)
    # Content
    body = models.TextField()
    shorturl = models.URLField(blank=True)
    
    def __unicode__(self):
        title = self.body
        if len(self.body) > 25:
            title = u"%s ..." % title[0:25]
        return title

    class Meta:
        verbose_name_plural = 'nodes'
