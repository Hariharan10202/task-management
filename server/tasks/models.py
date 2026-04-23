from mongoengine import Document, StringField, DateTimeField, DateField, ValidationError, BooleanField
from django.utils import timezone
import datetime

STATUS_CHOICES = ("pending", "in_progress", "completed")
PRIORITY_CHOICES = ("low", "medium", "high")


class Task(Document):
    title = StringField(required=True, max_length=200)

    description = StringField()

    status = StringField(choices=STATUS_CHOICES, default="pending", required=True)

    priority = StringField(choices=PRIORITY_CHOICES, default="medium", required=True)

    created_at = DateTimeField(default=timezone.now)

    due_date = DateField()

    email_sent = BooleanField(default=False)

    def clean(self):
        if self.due_date:
            if self.due_date < datetime.date.today():
                raise ValidationError("due_date cannot be in the past")


# Create a Task model with fields:
# title (string, required)
# description (string, optional)
# status (enum: pending, in_progress, completed)
# priority (enum: low, medium, high)
# created_at (auto timestamp)
# due_date (date, optional)
