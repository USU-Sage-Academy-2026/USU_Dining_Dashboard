import json
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import Client, TestCase, override_settings
from django.urls import reverse


@override_settings(
    MAILERS={
        "default": {
            "BACKEND": "django.core.mail.backends.locmem.EmailBackend",
        }
    }
)
class SignUpAndPasswordResetTests(TestCase):
    def test_home_redirects_authenticated_users_to_dashboard(self):
        response = self.client.get(reverse("home"))

        self.assertNotContains(response, "View dashboard")
        self.assertEqual(response.status_code, 200)

        user = get_user_model().objects.create_user(
            username="homeuser",
            password="Safe-test-password-9021",
        )
        self.client.force_login(user)

        response = self.client.get(reverse("home"))

        self.assertRedirects(
            response,
            reverse("dashboard"),
            fetch_redirect_response=False,
        )

    @override_settings(
        STORAGES={
            "default": {
                "BACKEND": "django.core.files.storage.FileSystemStorage",
            },
            "staticfiles": {
                "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
            },
        }
    )
    def test_dashboard_renders_frontend_build(self):
        user = get_user_model().objects.create_user(
            username="dashboarduser",
            password="Safe-test-password-9021",
        )
        self.client.force_login(user)

        with TemporaryDirectory() as temp_dir:
            manifest_path = Path(temp_dir) / "manifest.json"
            manifest_path.write_text(
                json.dumps(
                    {
                        "index.html": {
                            "file": "assets/index.js",
                            "css": ["assets/index.css"],
                        }
                    }
                )
            )
            with patch("myproject.views.FRONTEND_MANIFEST_PATH", manifest_path):
                response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'id="root"')
        self.assertContains(response, "/static/frontend/assets/index.js")
        self.assertContains(response, "/static/frontend/assets/index.css")
        self.assertIn("csrftoken", response.cookies)
        self.assertIn("no-store", response.headers["Cache-Control"])

    def test_dashboard_redirects_anonymous_users_to_login(self):
        response = self.client.get(reverse("dashboard"))

        self.assertRedirects(
            response,
            f"{reverse('login')}?next={reverse('dashboard')}",
            fetch_redirect_response=False,
        )

    def test_api_session_status_requires_authentication(self):
        response = self.client.get("/api/session/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"authenticated": False})

    def test_api_data_endpoints_require_authentication(self):
        for endpoint in ("/api/order-meta/", "/api/order-data/"):
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, 302)

    def test_dashboard_logout_post_ends_authenticated_session(self):
        user = get_user_model().objects.create_user(
            username="logoutuser",
            password="Safe-test-password-9021",
        )
        client = Client(enforce_csrf_checks=True)
        client.force_login(user)

        csrf_response = client.get("/api/csrf/")
        csrf_token = csrf_response.cookies["csrftoken"].value
        response = client.post(
            reverse("logout"),
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 302)
        self.assertNotIn("_auth_user_id", client.session)

    def test_api_session_status_allows_authenticated_user(self):
        user = get_user_model().objects.create_user(
            username="sessionuser",
            password="Safe-test-password-9021",
        )
        self.client.force_login(user)

        response = self.client.get("/api/session/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"authenticated": True})

    def test_login_redirects_to_dashboard(self):
        get_user_model().objects.create_user(
            username="dashboarduser",
            password="Safe-test-password-9021",
        )

        response = self.client.post(
            reverse("login"),
            {
                "username": "dashboarduser",
                "password": "Safe-test-password-9021",
            },
        )

        self.assertRedirects(response, reverse("dashboard"), fetch_redirect_response=False)

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

    def test_signup_does_not_require_email_address(self):
        response = self.client.post(
            reverse("signup"),
            {
                "username": "noemailuser",
                "password1": "Safe-test-password-9021",
                "password2": "Safe-test-password-9021",
            },
        )

        self.assertRedirects(response, reverse("login"))
        user = get_user_model().objects.get(username="noemailuser")
        self.assertEqual(user.email, "")

    def test_signup_page_does_not_render_email_field(self):
        response = self.client.get(reverse("signup"))

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'name="email"')

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
