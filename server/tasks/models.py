from mongoengine import (
    Document,
    StringField,
    DateTimeField,
    DateField,
    ValidationError,
    BooleanField,
    IntField,
    ReferenceField,
    CASCADE,
)
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

    due_at = DateTimeField(required=False, null=True, default=None)

    reminder_sent = BooleanField(default=False)

    order = IntField(default=0)

    def clean(self):
        if self.due_at:
            due_at = self.due_at

            if timezone.is_naive(due_at):
                due_at = timezone.make_aware(due_at, timezone.get_current_timezone())
                self.due_at = due_at

            now = timezone.now()
            if due_at < now and self.status != "completed":
                raise ValidationError("due_at cannot be in the past")


class TaskAttachment(Document):
    task = ReferenceField(Task, required=True, reverse_delete_rule=CASCADE)

    original_name = StringField(required=True, max_length=255)

    stored_name = StringField(required=True, max_length=255)

    file_path = StringField(required=True)  # path in MEDIA_ROOT

    content_type = StringField(default="")

    size_bytes = IntField(required=True)

    created_at = DateTimeField(default=timezone.now)

    meta = {"indexes": ["task", "-created_at"]}


# Create a Task model with fields:
# title (string, required)
# description (string, optional)
# status (enum: pending, in_progress, completed)
# priority (enum: low, medium, high)
# created_at (auto timestamp)
# due_at (date, optional)
