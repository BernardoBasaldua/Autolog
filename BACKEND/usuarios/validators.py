import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class MayusculaValidator:
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("La contraseña debe contener al menos una letra mayúscula."),
                code='password_no_upper',
            )

    def get_help_text(self):
        return _("Tu contraseña debe contener al menos una letra mayúscula.")