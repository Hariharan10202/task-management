from datetime import date
from .models import Task
from django.core.mail import send_mail


def check_overdue_tasks():
    overdue_tasks = Task.objects(
        due_date__lt=date.today(),
        status__ne="completed"
    )

    print('Hello')

    for task in overdue_tasks:
        print(f"Overdue: {task.title}")

        send_mail(
            subject="Task overdue",
            message=f"{task.title} is overdue!",
            from_email="hariharan10202@gmail.com",
            recipient_list=["hariharan10202@gmail.com"],
        )