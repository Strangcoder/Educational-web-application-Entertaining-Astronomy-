from django.contrib.auth.models import User
from django.db import models




class Rank(models.Model):
    name = models.CharField(max_length=100)
    required_xp = models.PositiveIntegerField()
    description = models.TextField(default="")

    class Meta:
        ordering = ["required_xp"]

    def __str__(self):
        return f'{self.name} ({self.required_xp})'
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    coins = models.IntegerField(default=0)

    xp = models.PositiveIntegerField(default=0)

    rank = models.ForeignKey(Rank,on_delete=models.SET_NULL,null=True,blank=True)

    def __str__(self):
        return self.user.username

class Topic(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    intro_text = models.TextField(blank=True, default="")
    reward_coins = models.PositiveIntegerField(default=50)
    passing_score = models.PositiveIntegerField(default=3)

    def __str__(self):
        return self.name


class Question(models.Model):
    topic = models.ForeignKey(Topic,on_delete=models.CASCADE,related_name="questions")
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
    
    def __str__(self):
        return self.text

class Answer(models.Model):
    question = models.ForeignKey(Question,on_delete=models.CASCADE,related_name="answers")
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text


class CompletedQuiz(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="completed_quizzes"
    )

    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="completed_users"
    )

    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "topic")

    def __str__(self):
        return f"{self.user.username} - {self.topic.name}"


class Record(models.Model):
    user = models.OneToOneField(User,on_delete=models.CASCADE, related_name="record")
    score = models.IntegerField(default=0)
    time = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}: {self.score}"

class SolarSystemObject(models.Model):
    slug = models.SlugField(unique=True)
    model_name = models.CharField(max_length=100)
    name = models.CharField(max_length=150)
    type_object = models.CharField(max_length=100)

    diametr = models.CharField(max_length=100)
    distance = models.CharField(max_length=100)
    structure = models.TextField()
    temp = models.CharField(max_length=150)
    features = models.TextField()
    desc = models.TextField()

    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
    
    def __str__(self):
        return self.name


class UniverseSystemObject(models.Model):
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to="structure_universe/")
    name = models.CharField(max_length=150)

    parameters = models.TextField()
    description = models.TextField()

    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class MythObject(models.Model):
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to="myth_ab_space/",blank=True,null=True)
    name = models.CharField(max_length=150)

    parameters = models.TextField()
    description = models.TextField()

    model_url = models.URLField(blank=True, null=True)

    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
    
    def __str__(self):
        return self.name


class VisitedMythObject(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name="visited_myth_objects")
    myth_object = models.ForeignKey(MythObject,on_delete=models.CASCADE,related_name="visits")
    visited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user","myth_object"],
                name="unique_user_myth_object_visit"
            )
        ]
        ordering = ["visited_at"]

    def __str__(self):
        return f"{self.user.username}: {self.myth_object.name}"


class VisitedUniverseObject(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="visited_universe_objects")
    universe_object = models.ForeignKey(UniverseSystemObject, on_delete=models.CASCADE, related_name="visits")
    visited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "universe_object"],
                name="unique_user_universe_object_visit",
            )
        ]
        ordering = ["visited_at"]

    def __str__(self):
        return f"{self.user.username}: {self.universe_object.name}"

class VisitedSolarObject(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="visited_solar_objects")
    solar_object = models.ForeignKey(SolarSystemObject, on_delete=models.CASCADE, related_name="visits")
    visited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "solar_object"],
                name="unique_user_solar_object_visit",
            )
        ]
        ordering = ["visited_at"]

    def __str__(self):
        return f"{self.user.username}: {self.solar_object.name}"



class Achievement(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    reward_xp = models.PositiveIntegerField()

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f'{self.id} - {self.title}'


class UserAchievement(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_achievements"
    )

    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name="completed_users"
    )

    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "achievement")

    def __str__(self):
        return f"{self.user.username} | {self.achievement.title}"

class SpaceShips(models.Model):
    name = models.CharField(max_length=100)
    price = models.PositiveIntegerField()

    image = models.ImageField(upload_to='skin_ship/')

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f'{self.name} | {self.price}'



class UserShip(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE, 
        related_name='ships'
    )

    ship = models.ForeignKey(
        SpaceShips,
        on_delete=models.CASCADE,
        related_name='owners'
    )

    is_active = models.BooleanField(default=False)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'ship')




    