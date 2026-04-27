import os
import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.storage import default_storage
from django.http import FileResponse
from rest_framework import status as drf_status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task, TaskAttachment
from .serializers import TaskAttachmentSerializer, TaskSerializer


class TaskListCreateView(APIView):

    PRIORITY_SCORE = {
        "low": 1,
        "medium": 2,
        "high": 3,
    }

    def get(self, request):
        tast_status = request.query_params.get("status")
        priority = request.query_params.get("priority")
        search = request.query_params.get("search")
        sort = request.query_params.get("sort")

        page = int(request.query_params.get("page", 1))
        limit = int(request.query_params.get("limit", 9))
        skip = (page - 1) * limit

        tasks = Task.objects()

        # FILTERS
        if tast_status:
            tasks = tasks.filter(status=tast_status)

        if priority:
            tasks = tasks.filter(priority=priority)

        # SEARCH
        if search:
            tasks = tasks.filter(title__icontains=search)

        if sort in ["priority_high", "priority_low"]:
            tasks = list(tasks)

            reverse = sort == "priority_high"

            tasks.sort(
                key=lambda t: self.PRIORITY_SCORE.get(t.priority, 0), reverse=reverse
            )

            total = len(tasks)
            tasks = tasks[skip : skip + limit]

            return Response(
                {
                    "data": TaskSerializer(tasks, many=True).data,
                    "page": page,
                    "total": total,
                }
            )

        if not sort:
            tasks = tasks.order_by("order")

        # SORT
        if sort == "created_desc":
            tasks = tasks.order_by("-created_at")

        elif sort == "created_asc":
            tasks = tasks.order_by("created_at")

        elif sort == "due_asc":
            tasks = tasks.order_by("due_at")

        elif sort == "due_desc":
            tasks = tasks.order_by("-due_at")

        total = tasks.count()

        tasks = tasks[skip : skip + limit]

        return Response(
            {
                "data": TaskSerializer(tasks, many=True).data,
                "page": page,
                "total": total,
            }
        )

    def post(self, request):
        print(request.data)
        serializer = TaskSerializer(data=request.data)

        if serializer.is_valid():
            task = serializer.save()
            return Response(
                TaskSerializer(task).data, status=drf_status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=drf_status.HTTP_400_BAD_REQUEST)


class TaskDetailView(APIView):

    def get_object(self, id):
        try:
            return Task.objects(id=id).first()
        except Exception:
            return None

    def get(self, request, id):
        task = self.get_object(id)
        if not task:
            return Response({"error": "Task not found"}, status=404)

        return Response(TaskSerializer(task).data)

    def put(self, request, id):
        task = self.get_object(id)
        if not task:
            return Response({"error": "Task not found"}, status=404)

        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(TaskSerializer(updated).data)

        return Response(serializer.errors, status=400)

    def delete(self, request, id):
        task = self.get_object(id)
        if not task:
            return Response({"error": "Task not found"}, status=404)

        task.delete()
        return Response({"message": "Deleted successfully"}, status=204)


# views.py
class TaskReorderView(APIView):
    def post(self, request):
        print(request)
        """
        Expected payload:
        [
          {"id": "...", "order": 0},
          {"id": "...", "order": 1}
        ]
        """

        data = request.data

        for item in data:
            Task.objects(id=item["id"]).update_one(set__order=item["order"])

        return Response({"message": "Order updated"}, status=200)


class TaskAttachmentListCreateView(APIView):
    MAX_SIZE = getattr(settings, "TASK_ATTACHMENT_MAX_SIZE", 10 * 1024 * 1024)
    ALLOWED_EXTENSIONS = set(
        getattr(
            settings,
            "TASK_ATTACHMENT_ALLOWED_EXTENSIONS",
            [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"],
        )
    )

    def _get_task(self, id):
        try:
            return Task.objects(id=id).first()
        except Exception:
            return None

    def get(self, request, id):
        task = self._get_task(id)
        if not task:
            return Response({"error": "Task not found"}, status=404)

        attachments = TaskAttachment.objects(task=task).order_by("-created_at")
        return Response(TaskAttachmentSerializer(attachments, many=True).data)

    def post(self, request, id):
        task = self._get_task(id)
        if not task:
            return Response({"error": "Task not found"}, status=404)

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "file is required"}, status=400)

        ext = Path(uploaded_file.name).suffix.lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return Response({"error": "File type not allowed"}, status=400)

        if uploaded_file.size > self.MAX_SIZE:
            return Response(
                {"error": f"Max file size is {self.MAX_SIZE // (1024 * 1024)}MB"},
                status=400,
            )

        stored_name = f"{uuid.uuid4().hex}{ext}"
        relative_path = f"task_attachments/{task.id}/{stored_name}"
        saved_path = default_storage.save(relative_path, uploaded_file)

        attachment = TaskAttachment(
            task=task,
            original_name=uploaded_file.name,
            stored_name=stored_name,
            file_path=saved_path,
            content_type=getattr(uploaded_file, "content_type", ""),
            size_bytes=uploaded_file.size,
        )
        attachment.save()

        return Response(
            TaskAttachmentSerializer(attachment).data,
            status=drf_status.HTTP_201_CREATED,
        )


class TaskAttachmentDeleteView(APIView):
    def delete(self, request, id, attachment_id):
        task = Task.objects(id=id).first()
        if not task:
            return Response({"error": "Task not found"}, status=404)

        attachment = TaskAttachment.objects(id=attachment_id, task=task).first()
        if not attachment:
            return Response({"error": "Attachment not found"}, status=404)

        if attachment.file_path and default_storage.exists(attachment.file_path):
            default_storage.delete(attachment.file_path)

        attachment.delete()

        task_folder = Path(settings.MEDIA_ROOT) / "task_attachments" / str(task.id)
        base_folder = (Path(settings.MEDIA_ROOT) / "task_attachments").resolve()
        try:
            resolved_task_folder = task_folder.resolve()
            if (
                resolved_task_folder.exists()
                and base_folder in resolved_task_folder.parents
                and not any(resolved_task_folder.iterdir())
            ):
                resolved_task_folder.rmdir()
        except FileNotFoundError:
            pass

        return Response({"message": "Attachment deleted"}, status=200)
