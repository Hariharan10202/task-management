from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from tasks.models import Task
from django.core.mail import send_mail


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        now = timezone.now()

        lead_minutes = 60
        window_minutes = 5

        window_start = now + timedelta(minutes=lead_minutes - window_minutes)
        window_end = now + timedelta(minutes=lead_minutes)

        print(window_start)
        print(window_end)

        tasks = Task.objects(
            reminder_sent=False,
            status__ne="completed",
            due_at__gt=window_start,
            due_at__lte=window_end,
        )

        count = 0

        for task in tasks:
            try:
                due_at = task.due_at
                if timezone.is_naive(due_at):
                    due_at = timezone.make_aware(
                        due_at, timezone.get_current_timezone()
                    )
                    task.due_at = due_at
                    task.save()

                due_local = timezone.localtime(due_at)

                send_mail(
                    subject="Task Reminder ⏰",
                    message=f"Your task '{task.title}' is due at {due_local.strftime('%Y-%m-%d %I:%M %p %Z')}",
                    from_email="itmehariharan@gmail.com",
                    recipient_list=["itmehariharan@gmail.com"],
                    fail_silently=False,
                )

                task.reminder_sent = True
                task.save()
                count += 1

            except Exception as e:
                self.stdout.write(f"Failed for task {task.id}: {str(e)}")

        self.stdout.write(self.style.SUCCESS(f"{count} reminders sent"))
