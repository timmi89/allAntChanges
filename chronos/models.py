from rb.models import *
from django.db import models


class NotificationRule(models.Model):
    name = models.CharField(max_length=50, unique=True)
    def __unicode__(self):
        return u'ID: {0}, Name: {1}'.format(self.id, self.name[:25])

class NotificationType(models.Model):
    name = models.CharField(max_length=50)
    rules = models.ManyToManyField(NotificationRule)
    email_template = models.CharField(max_length=255)
    def __unicode__(self):
        return u'ID: {0}, Name: {1}, Template: {2}'.format(self.id, self.name[:25], self.email_template[:25])

"""
This class is for logging specific types of notifications as they are generated
"""
class InteractionNotification(DateAwareModel):
    interaction = models.ForeignKey(Interaction)
    social_user = models.ForeignKey(SocialUser)
    notification_type = models.ForeignKey(NotificationType)
    
    def __unicode__(self):
        return str(self.interaction) + ":" + str(self.social_user) + "" + str(self.notification_type)
    
    class Meta:
        unique_together = ('interaction', 'social_user', 'notification_type')
    
    
    