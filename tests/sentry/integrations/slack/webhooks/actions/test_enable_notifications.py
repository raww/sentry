from sentry.integrations.slack.webhooks.action import (
    ENABLE_SLACK_SUCCESS_MESSAGE,
    NO_IDENTITY_MESSAGE,
)
from sentry.models import Identity, NotificationSetting
from sentry.models.user import User
from sentry.notifications.types import NotificationSettingOptionValues, NotificationSettingTypes
from sentry.types.integrations import ExternalProviders

from . import BaseEventTest


class EnableNotificationsActionTest(BaseEventTest):
    def setUp(self):
        super().setUp()
        self.slack_id = "UXXXXXXX1"
        self.team_id = "TXXXXXXX1"

    def test_enable_all_slack_no_identity(self):
        Identity.objects.delete_identity(user=self.user, idp=self.idp, external_id=self.external_id)
        response = self.post_webhook(
            action_data=[{"name": "enable_notifications", "value": "all_slack"}]
        )

        assert response.status_code == 200, response.content
        assert response.data["text"] == NO_IDENTITY_MESSAGE

    def test_enable_all_slack_already_enabled(self):
        NotificationSetting.objects.update_settings(
            ExternalProviders.EMAIL,
            NotificationSettingTypes.ISSUE_ALERTS,
            NotificationSettingOptionValues.NEVER,
            user_id=self.user.id,
        )

        response = self.post_webhook(
            action_data=[{"name": "enable_notifications", "value": "all_slack"}]
        )
        self.user = User.objects.get(id=self.user.id)  # Reload to fetch actor
        assert response.status_code == 200, response.content
        assert response.data["text"] == ENABLE_SLACK_SUCCESS_MESSAGE

        assert NotificationSetting.objects.has_any_provider_settings(
            self.user, ExternalProviders.SLACK
        )

    def test_enable_all_slack(self):
        assert not NotificationSetting.objects.has_any_provider_settings(
            self.user, ExternalProviders.SLACK
        )

        response = self.post_webhook(
            action_data=[{"name": "enable_notifications", "value": "all_slack"}]
        )
        self.user = User.objects.get(id=self.user.id)  # Reload to fetch actor
        assert response.status_code == 200, response.content
        assert response.data["text"] == ENABLE_SLACK_SUCCESS_MESSAGE

        assert NotificationSetting.objects.has_any_provider_settings(
            self.user, ExternalProviders.SLACK
        )
