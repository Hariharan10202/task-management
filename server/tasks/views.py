from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as drf_status 

from .models import Task
from .serializers import TaskSerializer



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
                key=lambda t: self.PRIORITY_SCORE.get(t.priority, 0),
                reverse=reverse
            )

            total = len(tasks)
            tasks = tasks[skip:skip + limit]

            return Response({
                "data": TaskSerializer(tasks, many=True).data,
                "page": page,
                "total": total
            })

        # SORT
        if sort == "created_desc":
            tasks = tasks.order_by("-created_at")

        elif sort == "created_asc":
            tasks = tasks.order_by("created_at")

        elif sort == "due_asc":
            tasks = tasks.order_by("due_date")

        elif sort == "due_desc":
            tasks = tasks.order_by("-due_date")


        total = tasks.count()

        tasks = tasks[skip:skip + limit]

        return Response({
            "data": TaskSerializer(tasks, many=True).data,
            "page": page,
            "total": total
        })

    def post(self, request):
        serializer = TaskSerializer(data=request.data)

        if serializer.is_valid():
            task = serializer.save()
            return Response(TaskSerializer(task).data, status=drf_status.HTTP_201_CREATED)

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
