from rest_framework.test import APITestCase
from rest_framework import status
from .models import Task

class TaskAPITest(APITestCase):

    def setUp(self):
        Task.drop_collection()

    def test_create_task(self):
        url = "/api/tasks/"

        data = {
            "title": "Test Task",
            "description": "Test Description",
            "status": "pending",
            "priority": "high",
            "due_date": "2026-12-31"
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Test Task")
        self.assertEqual(Task.objects.count(), 1)


    def test_get_tasks_list(self):
        Task.objects.create(
            title="Task 1",
            status="pending",
            priority="low"
        )

        url = "/api/tasks/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)