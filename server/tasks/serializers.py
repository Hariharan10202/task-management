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

    def validate_due_date(self, value):
        if value and value < date.today():
            raise serializers.ValidationError("due_date cannot be in the past")
        return value

    def create(self, validated_data):
        task = Task(**validated_data)
        task.save()
        return task

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
