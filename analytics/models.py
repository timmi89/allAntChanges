from django.db import models
import datetime
from rb.models import Group

class JSONGroupReport(models.Model):
    TYPES = (
        ('tvhrc', 'TopViewedReactions'),
        ('ABsld', 'ABScriptLoads'),
    )
    kind = models.CharField(max_length=5, choices=TYPES, default='tvhrc')
    group = group = models.ForeignKey(Group)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    body = models.TextField()
    
    def __unicode__(self):
        return self.kind + " " + str(self.group.id) + " " + str(self.created)
        