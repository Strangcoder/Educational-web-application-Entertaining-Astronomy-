from django.contrib import admin
from .models import Topic, Question, Answer, SolarSystemObject, UniverseSystemObject, MythObject, Achievement, SpaceShips, Rank


# -----------------------
# ANSWER INLINE
# -----------------------
class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 1


# -----------------------
# QUESTION INLINE (внутри Topic)
# -----------------------
class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    show_change_link = True  # 🔥 важно: можно открыть вопрос отдельно


# -----------------------
# TOPIC ADMIN
# -----------------------
@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "reward_coins", "passing_score")
    inlines = [QuestionInline]


# -----------------------
# QUESTION ADMIN (с ответами)
# -----------------------
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("text", "topic", "order")
    list_filter = ("topic",)
    ordering = ("topic", "order")
    inlines = [AnswerInline]


# -----------------------
# ANSWER ADMIN
# -----------------------
@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ("text", "question", "is_correct")
    list_filter = ("question",)


# -----------------------
# остальные модели (как было)
# -----------------------
admin.site.register(SolarSystemObject)
admin.site.register(UniverseSystemObject)
admin.site.register(MythObject)
admin.site.register(Achievement)
admin.site.register(SpaceShips)
admin.site.register(Rank)