from django.db import models
from rb.models import Group, SIte

class GroupReport(models.Model):
    group = models.ForeignKey(Group)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    
    def __unicode__(self):
        return "Group Report " + str(self.group.id) + " " + str(self.created)
    
