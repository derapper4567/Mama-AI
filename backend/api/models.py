from django.db import models

# Create your models here.

class Patient(models.Model):
    name = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    condition = models.CharField(max_length=100)
    appointment = models.CharField(max_length=20)
    contact = models.CharField(max_length=50)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    wait_time = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=50, blank=True, null=True)
    risk_level = models.CharField(max_length=20, blank=True, null=True)
    risk_factors = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    risk_score = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.risk_level})"

class Room(models.Model):
    STATUS_CHOICES = [
        ("available", "Available"),
        ("occupied", "Occupied"),
        ("cleaning", "Cleaning"),
    ]
    name = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    type = models.CharField(max_length=50, blank=True, null=True)
    patient = models.ForeignKey('Patient', null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_rooms')

    def __str__(self):
        return f"{self.name} ({self.status})"

class Inventory(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    region = models.CharField(max_length=50)
    available_stock = models.PositiveIntegerField()
    total_stock = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.region})"

class Cost(models.Model):
    treatment = models.CharField(max_length=100)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    # New fields for advanced cost analytics
    facility = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    nhif_covered = models.CharField(max_length=10, blank=True, null=True)  # Yes/No
    insurance_copay = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    out_of_pocket = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Added for cost trends

    def __str__(self):
        return self.treatment

class RiskAssessmentHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='risk_assessments')
    age = models.PositiveIntegerField(null=True, blank=True)
    sexual_partners = models.PositiveIntegerField(null=True, blank=True)
    first_sexual_age = models.PositiveIntegerField(null=True, blank=True)
    years_sexually_active = models.PositiveIntegerField(null=True, blank=True)
    hpv_positive = models.BooleanField(null=True, blank=True)
    abnormal_pap = models.BooleanField(null=True, blank=True)
    smoking = models.BooleanField(null=True, blank=True)
    stds_history = models.BooleanField(null=True, blank=True)
    insurance = models.BooleanField(null=True, blank=True)
    total_risk_score = models.FloatField(null=True, blank=True)
    region = models.CharField(max_length=100, null=True, blank=True)
    screening_type = models.CharField(max_length=100, null=True, blank=True)
    risk_score = models.FloatField()
    recommended_action = models.CharField(max_length=100)
    resource = models.CharField(max_length=100, blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.name} - {self.recommended_action} ({self.timestamp})"

# New model for usage/restock events
class InventoryUsage(models.Model):
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='usages')
    used = models.IntegerField()  # negative for restock, positive for usage
    timestamp = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=100, blank=True, null=True)  # e.g., 'treatment', 'restock'

    def __str__(self):
        return f"{self.inventory.name} usage: {self.used} on {self.timestamp}"
