from rest_framework import serializers
from django.utils import timezone
from .models import Task, TaskAttachment


class TaskAttachmentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    task_id = serializers.SerializerMethodField()
    original_name = serializers.CharField(read_only=True)
    content_type = serializers.CharField(read_only=True)
    size_bytes = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def get_task_id(self, obj):
        return str(obj.task.id) if obj.task else None


class TaskSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=["pending", "in_progress", "completed"])
    priority = serializers.ChoiceField(choices=["low", "medium", "high"])
    created_at = serializers.DateTimeField(read_only=True)
    due_at = serializers.DateTimeField(required=False, allow_null=True)
    reminder_sent = serializers.BooleanField(read_only=True)
    attachments = serializers.SerializerMethodField(read_only=True)

    def get_attachments(self, obj):
        items = TaskAttachment.objects(task=obj).order_by("-created_at")
        return TaskAttachmentSerializer(items, many=True).data

    def validate(self, data):
        due_at = data.get("due_at")
        incoming_status = data.get("status")
        resolved_status = incoming_status or (
            self.instance.status if self.instance else None
        )

        if due_at and resolved_status != "completed" and due_at < timezone.now():
            raise serializers.ValidationError(
                {"due_at": "due_at cannot be in the past"}
            )
        return data

    def create(self, validated_data):
        task = Task(**validated_data)
        task.save()
        return task

    def update(self, instance, validated_data):
        old_due_at = instance.due_at

        for key, value in validated_data.items():
            setattr(instance, key, value)

        if "due_at" in validated_data and validated_data["due_at"] != old_due_at:
            instance.reminder_sent = False

        instance.save()
        return instance
