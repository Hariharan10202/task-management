from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Task
from .serializers import TaskSerializer


class TaskListCreateView(APIView):

    def get(self, request):
        status_filter = request.query_params.get("status")
        priority_filter = request.query_params.get("priority")

        query = {}

        if status_filter:
            query["status"] = status_filter

        if priority_filter:
            query["priority"] = priority_filter

        tasks = Task.objects(**query)

        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaskSerializer(data=request.data)

        print(request.data)

        if serializer.is_valid():
            task = serializer.save()
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskDetailView(APIView):

    def get_object(self, id):
        return Task.objects(id=id).first()

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
