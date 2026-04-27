# your_app/cron.py
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from .models import Task


def send_due_task_reminders():
    now = timezone.now()
    lead = getattr(settings, "TASK_REMINDER_LEAD_MINUTES", 60)
    interval = getattr(settings, "TASK_REMINDER_CRON_INTERVAL_MINUTES", 5)

    window_start = now + timedelta(minutes=lead)
    window_end = window_start + timedelta(minutes=interval)

    tasks = Task.objects(
        due_at__gte=window_start,
        due_at__lt=window_end,
        status__ne="completed",
        reminder_sent=False,
    )

    for task in tasks:
        # replace with your user email lookup
        recipient = "itmehariharan@gmail.com"

        send_mail(
            subject=f"Reminder: {task.title} is due soon",
            message=f"Task '{task.title}' is due at {task.due_at}.",
            from_email=getattr(
                settings, "DEFAULT_FROM_EMAIL", "itmehariharan@gmail.com"
            ),
            recipient_list=[recipient],
            fail_silently=False,
        )

        task.reminder_sent = True
        task.save()
