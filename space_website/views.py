import json
from itertools import batched
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import render,redirect, get_object_or_404
from django.contrib.auth import login,authenticate
from .forms import RegisterForm, LoginForm
from .services.progression import add_xp,get_progress_data
from .services.achievements import complete_achievement

from .models import *



def register_view(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request,user)
            return redirect("space:main")
    else:
        form = RegisterForm()

    return render(request,"space_website/auth/registration.html",{"form":form,"mode":"register"})


def login_view(request):
    form = LoginForm()

    if request.method == "POST":
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]

            user = authenticate(request,username=username,password=password)

            if user is not None:
                login(request,user)
                return redirect("space:main")
            else:
                form.add_error(None,"Неверный логин или пароль")
        
    return render(request,'space_website/auth/login.html',{"form":form,"mode":"login"})



def space(request):

    # --- Solar System ---
    planet_slugs = list(
        SolarSystemObject.objects.values_list("slug", flat=True)
    )

    if request.user.is_authenticated:
        visited_planets = set(
            VisitedSolarObject.objects.filter(user=request.user)
            .values_list("solar_object__slug", flat=True)
        )
    else:
        visited_planets = set()

    solar_completed = set(planet_slugs).issubset(visited_planets)


    # --- Universe ---
    structure_slugs = list(
        UniverseSystemObject.objects.values_list("slug", flat=True)
    )

    if request.user.is_authenticated:
        visited_structure = set(
            VisitedUniverseObject.objects.filter(user=request.user)
            .values_list("universe_object__slug", flat=True)
        )
    else:
        visited_structure = set()

    universe_completed = set(structure_slugs).issubset(visited_structure)


    # --- Myths ---
    myth_slugs = list(
        MythObject.objects.values_list("slug", flat=True)
    )

    if request.user.is_authenticated:
        visited_myths = set(
            VisitedMythObject.objects.filter(user=request.user)
            .values_list("myth_object__slug", flat=True)
        )
    else:
        visited_myths = set()

    myths_completed = set(myth_slugs).issubset(visited_myths)


    progress = {
        "solar_system": solar_completed,
        "universe": universe_completed,
        "myths": myths_completed,
    }

    return render(request, "space_website/space/main_page/main.html", {
        "progress": progress
    })

def solar_system(request):
    planet_slugs = list(
        SolarSystemObject.objects
        .order_by("order", "id")
        .values_list("slug", flat=True)
    )

    if request.user.is_authenticated:
        visited_slugs = list(
            VisitedSolarObject.objects
            .filter(user=request.user)
            .values_list("solar_object__slug", flat=True)
        )
    else:
        visited_slugs = []

    all_planets_visited = set(planet_slugs).issubset(set(visited_slugs))

    return render(
        request,
        'space_website/space/solar_system/main.html',
        {
            "visited_slugs": visited_slugs,
            "all_planets_visited": all_planets_visited,
        }
    )

def planet_detail(request, planet):
    planet_obj = get_object_or_404(SolarSystemObject, slug=planet)

    planet_slugs = list(
        SolarSystemObject.objects
        .order_by("order", "id")
        .values_list("slug", flat=True)
    )

    current_index = planet_slugs.index(planet_obj.slug)
    prev_slug = planet_slugs[current_index - 1]
    next_slug = planet_slugs[(current_index + 1) % len(planet_slugs)]

    if request.user.is_authenticated:
        VisitedSolarObject.objects.get_or_create(
            user=request.user,
            solar_object=planet_obj,
        )

        visited_slugs = list(
            VisitedSolarObject.objects
            .filter(user=request.user)
            .values_list("solar_object__slug", flat=True)
        )

        all_planets_visited = set(planet_slugs).issubset(set(visited_slugs))

        if all_planets_visited:
            achievement_exists = UserAchievement.objects.filter(
                user=request.user,
                achievement_id=1
            ).exists()

            if not achievement_exists:
                complete_achievement(request.user, 1)

    else:
        visited_slugs = [planet_obj.slug]
        all_planets_visited = False

    return render(
        request,
        'space_website/space/planets/planet.html',
        {
            "planet": planet_obj,
            "prev_planet_slug": prev_slug,
            "next_planet_slug": next_slug,
            "visited_slugs": visited_slugs,
            "all_planets_visited": all_planets_visited,
        }
    )


def structure_universe(request):
    structure_slugs = list(
        UniverseSystemObject.objects.order_by('order', 'id')
        .values_list("slug", flat=True)
    )

    if request.user.is_authenticated:
        visited_slugs = list(
            VisitedUniverseObject.objects.filter(user=request.user)
            .values_list("universe_object__slug", flat=True)
        )
    else:
        visited_slugs = []

    return render(
        request,
        'space_website/space/structure_universe/main.html',
        {
            "visited_slugs": visited_slugs,
            "all_structure_visited": set(structure_slugs).issubset(set(visited_slugs)),
        }
    )


def structure_detail(request, structure):
    structure_obj = get_object_or_404(
        UniverseSystemObject,
        slug=structure
    )

    structure_slugs = list(
        UniverseSystemObject.objects.order_by('order', 'id')
        .values_list("slug", flat=True)
    )

    current_index = structure_slugs.index(structure_obj.slug)

    prev_slug = structure_slugs[current_index - 1]
    next_slug = structure_slugs[(current_index + 1) % len(structure_slugs)]

    if request.user.is_authenticated:

        VisitedUniverseObject.objects.get_or_create(
            user=request.user,
            universe_object=structure_obj,
        )

        visited_slugs = list(
            VisitedUniverseObject.objects.filter(user=request.user)
            .values_list("universe_object__slug", flat=True)
        )

        all_structure_visited = set(structure_slugs).issubset(set(visited_slugs))

        if all_structure_visited:
            complete_achievement(request.user, 2)

    else:
        visited_slugs = [structure_obj.slug]
        all_structure_visited = False

    return render(
        request,
        'space_website/space/structure_detail/structure.html',
        {
            "structure": structure_obj,
            "prev_structure": prev_slug,
            "next_structure": next_slug,
            "visited_slugs": visited_slugs,
            "all_structure_visited": all_structure_visited
        }
    )


def myths_ab_space(request):
    myth_obj = MythObject.objects.values('name', 'slug')

    myth_slug = list(
        MythObject.objects.order_by('order', 'id')
        .values_list("slug", flat=True)
    )

    if request.user.is_authenticated:
        visited_slugs = list(
            VisitedMythObject.objects.filter(user=request.user)
            .values_list("myth_object__slug", flat=True)
        )
    else:
        visited_slugs = []

    return render(
        request,
        'space_website/space/myths_ab_space/main.html',
        {
            "myth_data": myth_obj,
            "visited_slugs": visited_slugs,
            "all_myth_visited": set(myth_slug).issubset(set(visited_slugs))
        }
    )


def myths_details(request, myth):
    myth_obj = get_object_or_404(MythObject, slug=myth)

    myth_slug = list(
        MythObject.objects.order_by('order', 'id')
        .values_list("slug", flat=True)
    )

    current_index = myth_slug.index(myth_obj.slug)

    prev_slug = myth_slug[current_index - 1]
    next_slug = myth_slug[(current_index + 1) % len(myth_slug)]

    if request.user.is_authenticated:

        VisitedMythObject.objects.get_or_create(
            user=request.user,
            myth_object=myth_obj,
        )

        visited_slugs = list(
            VisitedMythObject.objects.filter(user=request.user)
            .values_list("myth_object__slug", flat=True)
        )

        all_myth_visited = set(myth_slug).issubset(set(visited_slugs))

        if all_myth_visited:
            complete_achievement(request.user, 3)

    else:
        visited_slugs = [myth_obj.slug]
        all_myth_visited = False

    return render(
        request,
        'space_website/space/myths_ab_space/myth_details/myths.html',
        {
            "myth": myth_obj,
            "prev_myth": prev_slug,
            "next_myth": next_slug,
            "visited_slugs": visited_slugs,
            "all_myth_visited": all_myth_visited
        }
    )

@login_required
def quiz(request, slug):
    topic = get_object_or_404(Topic,slug=slug)

    questions_data = []
    for q in topic.questions.prefetch_related("answers").all():
        answers = list(q.answers.all())

        correct_index = 0

        for i,a in enumerate(answers):
            if a.is_correct:
                correct_index = i
                break
        
        questions_data.append({
            "id":q.id,
            "question":q.text,
            "answers":[a.text for a in answers],
            "correct_index":correct_index,
        })
    return render(request,'space_website/space/quiz/main.html',{
        "topic":topic,
        "questions_data":questions_data
    })

@login_required
@require_POST
def quiz_complete(request):
    data = json.loads(request.body)

    score = int(data.get("score", 0))
    topic_slug = data.get("topic_slug")

    topic = get_object_or_404(
        Topic,
        slug=topic_slug
    )

    profile = request.user.profile

    xp_earned = 0

    already_completed = CompletedQuiz.objects.filter(
        user=request.user,
        topic=topic
    ).exists()

    if score >= topic.passing_score:

        # обычная награда за прохождение
        xp_earned = topic.reward_coins

        add_xp(
            request.user,
            xp_earned
        )

        # первое прохождение
        if not already_completed:

            CompletedQuiz.objects.create(
                user=request.user,
                topic=topic
            )

            if topic_slug == "solar-system":
                complete_achievement(request.user, 4)
            if topic_slug == "myths-about-space":
                complete_achievement(request.user, 6)
            if topic_slug == "structure-of-universe":
                complete_achievement(request.user, 5)

    profile.refresh_from_db()

    return JsonResponse({
        "success": True,
        "earned_xp": xp_earned,
        "total_xp": profile.xp,
        "rank": profile.rank.name if profile.rank else None
    })


def format_time(seconds):
    minutes = seconds//60
    sec = seconds % 60
    return f"{minutes}:{sec:02d}"


@login_required
def profile(request):
    top_record = Record.objects.select_related('user').order_by('-score','-time')[:3]

    achiev = batched(Achievement.objects.all(),3)

    space_ships = SpaceShips.objects.all()

    user = request.user

    profile,coins = Profile.objects.get_or_create(user=user)

    top_players = []

    progress_data = get_progress_data(profile)

    completed_achievements = set(
        UserAchievement.objects
        .filter(user=request.user)
        .values_list('achievement_id', flat=True)
    )

    for r in top_record:
        top_players.append({
            "username":r.user.username,
            "score":r.score,
            "time":format_time(r.time)
            })
    
    return render(request,'space_website/space/profile/main.html',
        {"top_players":top_players,
         "username":user,"joined":user.date_joined,
         "achiev":achiev,
         "models_ship":space_ships,
         "profile":profile,
         "progress_data":progress_data,
         "complete":completed_achievements
         })


@csrf_exempt
def save_record(request):
    if request.method == "POST":
        data = json.loads(request.body)
        score = int(data.get("score",0))
        time = int(data.get("time",0))

        record, _ = Record.objects.get_or_create(user=request.user)

        first_game = UserAchievement.objects.filter(
            user=request.user,
            achievement_id=7
        ).exists()

        if not first_game:
            complete_achievement(request.user, 7)

        if score > record.score:
            record.score = score
        
        if time > record.time:
            record.time = time
        
        if score >= 5000:
            complete_achievement(request.user,9)

        if time >= 60:
            complete_achievement(request.user,8)

        record.save()

        return JsonResponse({"best_score":record.score,"best_time":record.time})
    
    return JsonResponse({"error":"invalid"})


def get_record(request):
    if not request.user.is_authenticated:
        return JsonResponse({"score":0,"time":0})
    
    record, _ = Record.objects.get_or_create(user=request.user)

    return JsonResponse({
        "score":record.score,
        "time": record.time
    })
