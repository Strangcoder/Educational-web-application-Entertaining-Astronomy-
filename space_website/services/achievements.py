from ..models import (
    Achievement,
    UserAchievement,
    Profile
)

from .progression import add_xp


def complete_achievement(user, achievement_id):
    achievement = Achievement.objects.filter(
        id=achievement_id
    ).first()

    if not achievement:
        return False

    already_completed = UserAchievement.objects.filter(
        user=user,
        achievement=achievement
    ).exists()

    if already_completed:
        return False

    UserAchievement.objects.create(
        user=user,
        achievement=achievement
    )

    profile = Profile.objects.get(user=user)

    profile.coins += achievement.reward_xp
    profile.save()

    add_xp(user, achievement.reward_xp)

    return True