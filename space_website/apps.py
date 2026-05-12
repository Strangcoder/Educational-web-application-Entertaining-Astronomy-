from django.apps import AppConfig


class SpaceWebsiteConfig(AppConfig):
    name = 'space_website'

    def ready(self):
        import space_website.signals
