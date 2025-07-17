from django.contrib import admin
from .models import Patient, Room, Inventory, Cost, RiskAssessmentHistory, InventoryUsage

# Register your models here.
admin.site.register(Patient)
admin.site.register(Room)
admin.site.register(Inventory)
admin.site.register(Cost)
admin.site.register(RiskAssessmentHistory)
admin.site.register(InventoryUsage)
