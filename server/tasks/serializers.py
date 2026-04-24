from rest_framework import serializers
from .models import Task
from datetime import date


class TaskSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=["pending", "in_progress", "completed"])
    priority = serializers.ChoiceField(choices=["low", "medium", "high"])
    created_at = serializers.DateTimeField(read_only=True)
    due_date = serializers.DateField(required=False, allow_null=True)
    email_sent = serializers.BooleanField(read_only=True)

    def validate(self, data):
        due_date = data.get("due_date")
        incoming_status = data.get("status")
        if self.instance:
            resolved_status = incoming_status or self.instance.status
        else:
            resolved_status = incoming_status

        if due_date and resolved_status != "completed" and due_date < date.today():
            raise serializers.ValidationError({"due_date": "due_date cannot be in the past"})

        return data

    def create(self, validated_data):
        task = Task(**validated_data)
        task.save()
        return task

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
