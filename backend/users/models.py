from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Roles(models.TextChoices):
        CLIENT = "CLIENT", "client"
        RESTAURANT = "RESTAURANT", "restaurant"
        COURIER = "COURIER", "courier"
        ADMIN = "ADMIN", "admin"

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.CLIENT,
    )

    def __str__(self):
        return f'{self.username} ({self.role})'
