from django.urls import path
from .views import TaskListCreateView, TaskDetailView

urlpatterns = [
    path("tasks/", TaskListCreateView.as_view()),
    path("tasks/<str:id>/", TaskDetailView.as_view()),
]
