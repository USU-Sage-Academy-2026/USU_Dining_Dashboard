from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse


@override_settings(
    MAILERS={
        "default": {
            "BACKEND": "django.core.mail.backends.locmem.EmailBackend",
        }
    }
)
class SignUpAndPasswordResetTests(TestCase):
    def test_signup_saves_email_address(self):
        response = self.client.post(
            reverse("signup"),
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password1": "Safe-test-password-9021",
                "password2": "Safe-test-password-9021",
            },
        )

        self.assertRedirects(response, reverse("login"))
        user = get_user_model().objects.get(username="newuser")
        self.assertEqual(user.email, "newuser@example.com")

    def test_password_reset_sends_email_to_registered_address(self):
        user = get_user_model().objects.create_user(
            username="resetuser",
            email="resetuser@example.com",
            password="Safe-test-password-9021",
        )

        response = self.client.post(
            reverse("password_reset"),
            {"email": user.email},
        )

        self.assertRedirects(response, reverse("password_reset_done"))
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [user.email])
