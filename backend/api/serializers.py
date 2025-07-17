from rest_framework import serializers
from .models import Patient, Room, Inventory, Cost, RiskAssessmentHistory
from django.contrib.auth.models import User

class PatientSerializer(serializers.ModelSerializer):
    risk_score = serializers.FloatField(read_only=True)
    class Meta:
        model = Patient
        fields = '__all__'
        extra_kwargs = {
            'risk_level': {'required': False, 'allow_null': True},
            'sexual_partners': {'required': False, 'allow_null': True},
            'first_sexual_age': {'required': False, 'allow_null': True},
            'hpv_positive': {'required': False, 'allow_null': True},
            'abnormal_pap': {'required': False, 'allow_null': True},
            'smoking': {'required': False, 'allow_null': True},
            'stds_history': {'required': False, 'allow_null': True},
            'insurance': {'required': False, 'allow_null': True},
        }

class RoomSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(), source='patient', write_only=True, required=False
    )
    class Meta:
        model = Room
        fields = '__all__'
        extra_fields = ['patient_id']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = '__all__'

class CostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cost
        fields = '__all__'

class RiskAssessmentHistorySerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    class Meta:
        model = RiskAssessmentHistory
        fields = '__all__' 