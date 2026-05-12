from django import forms
from django.contrib.auth.models import User

class RegisterForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput(attrs={"class":"style_field","placeholder":"ПАРОЛЬ"}))

    class Meta:
        model = User
        fields = ["username","email","password"]

        widgets = {
            "username":forms.TextInput(attrs={"class":"style_field","placeholder":"ЛОГИН"}),
            "email":forms.EmailInput(attrs={"class":"style_field","placeholder":"ПОЧТА"})
        }

        error_messages = {
            "username": {
                "unique": "Пользователь с таким логином уже существует",
            },
        }

    def clean_username(self):
        username = self.cleaned_data["username"]
        if User.objects.filter(username__iexact=username).exists():
            raise forms.ValidationError("Пользователь с таким логином уже существует")
        return username

    def clean_email(self):
        email = self.cleaned_data["email"]
        if email and User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("Пользователь с такой почтой уже существует")
        return email
    
    def save(self,commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user

class LoginForm(forms.Form):
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            "class":"style_field",
            "placeholder":"ЛОГИН"
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class":"style_field",
                "placeholder":"ПАРОЛЬ"
            }
        )
    )
