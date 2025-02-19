from typing import Optional, Sequence, Set

from sentry.services.hybrid_cloud import ValueEqualityEnum


class ExternalProviders(ValueEqualityEnum):
    UNUSED_GH = 0
    UNUSED_GL = 1

    EMAIL = 100
    SLACK = 110
    MSTEAMS = 120
    PAGERDUTY = 130
    DISCORD = 140
    GITHUB = 200
    GITLAB = 210

    # TODO: do migration to delete this from database
    CUSTOM = 700

    @property
    def name(self) -> Optional[str]:
        return get_provider_name(self.value)


EXTERNAL_PROVIDERS = {
    ExternalProviders.EMAIL: "email",
    ExternalProviders.SLACK: "slack",
    ExternalProviders.MSTEAMS: "msteams",
    ExternalProviders.PAGERDUTY: "pagerduty",
    ExternalProviders.DISCORD: "discord",
    ExternalProviders.GITHUB: "github",
    ExternalProviders.GITLAB: "gitlab",
    ExternalProviders.CUSTOM: "custom_scm",
}


def get_provider_name(value: int) -> Optional[str]:
    return EXTERNAL_PROVIDERS.get(ExternalProviders(value))


def get_provider_string(provider_int: int) -> str:
    return get_provider_name(provider_int) or "unknown"


def get_provider_enum(value: Optional[str]) -> Optional[ExternalProviders]:
    return {v: k for k, v in EXTERNAL_PROVIDERS.items()}.get(value)


def get_provider_choices(providers: Set[ExternalProviders]) -> Sequence[str]:
    return list(EXTERNAL_PROVIDERS.get(i) for i in providers)


def get_provider_enum_from_string(provider: str) -> ExternalProviders:
    for k, v in EXTERNAL_PROVIDERS.items():
        if v == provider:
            return k
    raise InvalidProviderException("Invalid provider ${provider}")


class InvalidProviderException(Exception):
    pass
