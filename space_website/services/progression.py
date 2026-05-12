from django.db import transaction
from ..models import Profile, Rank


def get_rank_by_xp(xp: int):
    return (
        Rank.objects
        .filter(required_xp__lte=xp)
        .order_by("-required_xp")
        .first()
    )


@transaction.atomic
def add_xp(user, amount: int):
    profile = Profile.objects.select_for_update().get(user=user)

    profile.xp += amount

    new_rank = get_rank_by_xp(profile.xp)

    if new_rank != profile.rank:
        profile.rank = new_rank

    profile.save(update_fields=["xp", "rank"])

    return profile


def get_progress_data(profile):
    current_rank = profile.rank

    next_rank = (
        Rank.objects
        .filter(required_xp__gt=profile.xp)
        .order_by("required_xp")
        .first()
    )

    if not current_rank:
        return {
            "progress_percent": 0,
            "current_rank": None,
            "next_rank": next_rank,
            "current_xp": profile.xp,
        }

    if not next_rank:
        return {
            "progress_percent": 100,
            "current_rank": current_rank,
            "next_rank": None,
            "current_xp": profile.xp,
        }

    current_rank_xp = current_rank.required_xp
    next_rank_xp = next_rank.required_xp

    current_level_xp = profile.xp - current_rank_xp
    needed_xp = next_rank_xp - current_rank_xp

    progress_percent = int(
        (current_level_xp / needed_xp) * 100
    )

    return {
        "progress_percent": progress_percent,
        "current_rank": current_rank,
        "next_rank": next_rank,
        "current_xp": profile.xp,
        "needed_xp": next_rank.required_xp,
    }