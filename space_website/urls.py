from django.urls import path
from space_website import views

app_name = 'space'

urlpatterns = [
    path('',views.register_view),
    path('login/',views.login_view,name='login'),
    path('space/',views.space,name='main'),
    path('space/solar_system/',views.solar_system,name='solar_system'),
    path('space/solar_system/<slug:planet>/',views.planet_detail,name='planet_detail'),
    path('space/structure_universe/',views.structure_universe,name='structure_universe'),
    path('space/structure_universe/<slug:structure>/',views.structure_detail,name='structure_detail'),
    path('space/myths_about_space/',views.myths_ab_space,name='myths_ab_space'),
    path('space/myths_about_space/<slug:myth>',views.myths_details,name='myths_ab_space_detail'),
    path('space/quiz/<slug:slug>/',views.quiz,name='quiz'),
    path('space/quiz_complete/',views.quiz_complete,name='quiz_complete'),
    path('space/profile/',views.profile,name="profile"),
    path('space/save-record/',views.save_record,name="save_record"),
    path("space/get-record/",views.get_record,name="get_record")    
]