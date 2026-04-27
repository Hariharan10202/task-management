from django.urls import path
from .views import (
    TaskListCreateView,
    TaskDetailView,
    TaskReorderView,
    TaskAttachmentDeleteView,
    TaskAttachmentListCreateView,
)

urlpatterns = [
    path("tasks/reorder/", TaskReorderView.as_view()),
    path("tasks/", TaskListCreateView.as_view()),
    path("tasks/<str:id>/", TaskDetailView.as_view()),
    path("tasks/<str:id>/attachments/", TaskAttachmentListCreateView.as_view()),
    # path(
    #     "tasks/<str:id>/attachments/<str:attachment_id>/download/",
    #     TaskAttachmentDownloadView.as_view(),
    # ),
    path(
        "tasks/<str:id>/attachments/<str:attachment_id>/",
        TaskAttachmentDeleteView.as_view(),
    ),
]
