from __future__ import annotations

import operator
from typing import Any, Sequence
from uuid import uuid4

from django.db.models import F, Field, Model
from django.db.models.expressions import BaseExpression, CombinedExpression, Value
from django.utils.crypto import get_random_string
from django.utils.text import slugify

from sentry.db.exceptions import CannotResolveExpression

COMBINED_EXPRESSION_CALLBACKS = {
    CombinedExpression.ADD: operator.add,
    CombinedExpression.SUB: operator.sub,
    CombinedExpression.MUL: operator.mul,
    CombinedExpression.DIV: operator.floordiv,
    CombinedExpression.MOD: operator.mod,
    CombinedExpression.BITAND: operator.and_,
    CombinedExpression.BITOR: operator.or_,
}


def resolve_combined_expression(instance: Model, node: BaseExpression) -> BaseExpression:
    def _resolve(instance: Model, node: BaseExpression | F) -> BaseExpression:
        if isinstance(node, Value):
            return node.value
        if isinstance(node, F):
            return getattr(instance, node.name)
        if isinstance(node, CombinedExpression):
            return resolve_combined_expression(instance, node)
        return node

    if isinstance(node, Value):
        return node.value
    if not hasattr(node, "connector"):
        raise CannotResolveExpression
    op = COMBINED_EXPRESSION_CALLBACKS.get(node.connector, None)
    if not op:
        raise CannotResolveExpression
    if hasattr(node, "children"):
        children = node.children
    else:
        children = [node.lhs, node.rhs]
    runner = _resolve(instance, children[0])
    for n in children[1:]:
        runner = op(runner, _resolve(instance, n))
    return runner


def slugify_instance(
    inst: Model,
    label: str,
    reserved: Sequence[str] = (),
    max_length: int = 30,
    field_name: str = "slug",
    *args: Any,
    **kwargs: Any,
) -> None:
    base_value = slugify(label)[:max_length]
    base_value = base_value.strip("-")

    if base_value is not None:
        base_value = base_value.strip()
        if base_value in reserved:
            base_value = None

    if not base_value:
        base_value = uuid4().hex[:12]

    base_qs = type(inst).objects.all()
    if inst.id:
        base_qs = base_qs.exclude(id=inst.id)
    if args or kwargs:
        base_qs = base_qs.filter(*args, **kwargs)

    setattr(inst, field_name, base_value)

    # We don't need to further mutate if we're unique at this point
    if not base_qs.filter(**{f"{field_name}__iexact": base_value}).exists():
        return

    # We want to sanely generate the shortest unique slug possible, so
    # we try different length endings until we get one that works, or bail.

    # At most, we have 27 attempts here to derive a unique slug
    sizes = (
        (1, 2),  # (36^2) possibilities, 2 attempts
        (5, 3),  # (36^3) possibilities, 3 attempts
        (20, 5),  # (36^5) possibilities, 20 attempts
        (1, 12),  # (36^12) possibilities, 1 final attempt
    )
    for attempts, size in sizes:
        for i in range(attempts):
            end = get_random_string(size, allowed_chars="abcdefghijklmnopqrstuvwxyz0123456790")
            value = base_value[: max_length - size - 1] + "-" + end
            setattr(inst, field_name, value)
            if not base_qs.filter(**{f"{field_name}__iexact": value}).exists():
                return

    # If at this point, we've exhausted all possibilities, we'll just end up hitting
    # an IntegrityError from database, which is ok, and unlikely to happen


class Creator:
    """
    A descriptor that invokes `to_python` when attributes are set.
    This provides backwards compatibility for fields that used to use
    SubfieldBase which will be removed in Django1.10
    """

    def __init__(self, field: Field):
        self.field = field

    def __get__(self, obj: Model, type: Any = None) -> Any:
        if obj is None:
            return self
        return obj.__dict__[self.field.name]

    def __set__(self, obj: Model, value: Any) -> None:
        obj.__dict__[self.field.name] = self.field.to_python(value)
