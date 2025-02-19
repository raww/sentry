from typing import TYPE_CHECKING

from sentry.services.hybrid_cloud.usersocialauth.model import RpcUserSocialAuth

if TYPE_CHECKING:
    from social_auth.models import UserSocialAuth


def serialize_usersocialauth(auth: "UserSocialAuth") -> RpcUserSocialAuth:
    return RpcUserSocialAuth(
        id=auth.id, user_id=auth.user.id, provider=auth.id, uid=auth.uid, extra_data=auth.extra_data
    )
