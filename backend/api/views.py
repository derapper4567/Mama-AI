from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import joblib
import os
from django.conf import settings
import numpy as np
from .models import Patient, Room, Inventory, Cost, RiskAssessmentHistory
from .serializers import PatientSerializer, RoomSerializer, UserRegistrationSerializer, InventorySerializer, CostSerializer, RiskAssessmentHistorySerializer
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
import pandas as pd
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Sum
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

MODEL_PATH = os.path.join(settings.BASE_DIR, '../src/Code Her Care Datasets /random_forest_model.pkl')
 
# Load the model once at startup
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    model = None
    print(f"Error loading model: {e}")

class PredictView(APIView):
    def post(self, request):
        # Expecting JSON with patient features as a list or dict
        data = request.data.get('features')
        if not data:
            return Response({'error': 'No features provided.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Convert to numpy array and reshape for single prediction
            features = np.array(data).reshape(1, -1)
            prediction = model.predict(features)
            risk_level = int(prediction[0])
            # Map risk level to recommended action (customize as needed)
            if risk_level == 2:
                recommended_action = "HPV DNA"
            elif risk_level == 1:
                recommended_action = "PAP SMEAR"
            else:
                recommended_action = "Routine Follow-up"
            return Response({
                'prediction': risk_level,
                'recommended_action': recommended_action
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PatientListCreateView(ListCreateAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

class PatientRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        self.calculate_and_save_risk_score(instance)

    def calculate_and_save_risk_score(self, patient):
        global model
        if model is None:
            return
        features = self.get_patient_features(patient)
        try:
            risk_score = float(model.predict_proba(np.array(features).reshape(1, -1))[0][1])
            patient.risk_score = risk_score
            patient.save(update_fields=["risk_score"])
        except Exception as e:
            print(f"Risk score calculation error: {e}")

    def get_patient_features(self, patient):
        return [
            patient.age or 0,
            patient.sexual_partners or 0,
            patient.first_sexual_age or 0,
            (patient.age or 0) - (patient.first_sexual_age or 0),
            int(patient.hpv_positive) if patient.hpv_positive is not None else 0,
            int(patient.abnormal_pap) if patient.abnormal_pap is not None else 0,
            int(patient.smoking) if patient.smoking is not None else 0,
            int(patient.stds_history) if patient.stds_history is not None else 0,
            int(patient.insurance) if patient.insurance is not None else 0,
        ]

class DashboardStatsView(APIView):
    def get(self, request):
        total_patients = Patient.objects.count()
        # High risk cases: count risk assessments with risk_score > 0.7
        high_risk_cases = RiskAssessmentHistory.objects.filter(risk_score__gt=0.7).count()
        # Appointments Today: count patients whose appointment is today
        today = timezone.now().date()
        appointments_today = Patient.objects.filter(
            appointment__startswith=today.strftime('%Y-%m-%d')
        ).count()
        # Resource Efficiency: percent of inventory used (simple example)
        total_inventory = Inventory.objects.count()
        used_inventory = Inventory.objects.filter(available_stock=0).count()
        resource_efficiency = f"{int((used_inventory/total_inventory)*100) if total_inventory else 0}%"
        stats = [
            {
                "title": "Total Patients",
                "value": total_patients,
                "change": "+0%",  # Placeholder
                "changeType": "positive",
                "icon": "Users",
                "color": "blue",
                "description": "Active in system"
            },
            {
                "title": "High Risk Cases",
                "value": high_risk_cases,
                "change": "+0%",  # Placeholder
                "changeType": "positive",
                "icon": "AlertTriangle",
                "color": "red",
                "description": "Requiring immediate attention"
            },
            {
                "title": "Appointments Today",
                "value": appointments_today,
                "change": "+0%",
                "changeType": "positive",
                "icon": "Calendar",
                "color": "green",
                "description": "Scheduled consultations"
            },
            {
                "title": "Resource Efficiency",
                "value": resource_efficiency,
                "change": "+0%",
                "changeType": "positive",
                "icon": "TrendingUp",
                "color": "purple",
                "description": "Overall utilization"
            }
        ]
        return Response(stats)

class RiskDistributionView(APIView):
    def get(self, request):
        # Count risk assessments in history by risk_score
        high = RiskAssessmentHistory.objects.filter(risk_score__gt=0.7).count()
        medium = RiskAssessmentHistory.objects.filter(risk_score__gt=0.4, risk_score__lte=0.7).count()
        low = RiskAssessmentHistory.objects.filter(risk_score__lte=0.4).count()
        data = {'high': high, 'medium': medium, 'low': low}
        return Response(data)

class ResourceUtilizationView(APIView):
    def get(self, request):
        # Demo data, in real use, load from DB or Excel
        resources = [
            {"region": "Nairobi", "category": "Medications", "item": "Ibuprofen 400mg", "available_stock": 94},
            {"region": "Mombasa", "category": "Consumables", "item": "Pelvic Ultrasound Gel", "available_stock": 100},
            {"region": "Kakamega", "category": "Medications", "item": "Combined Oral Contraceptives", "available_stock": 28},
            {"region": "Machakos", "category": "Medications", "item": "Paracetamol 500mg", "available_stock": 86},
        ]
        return Response(resources)

class ResourceUtilizationAnalyticsView(APIView):
    def get(self, request):
        resources = []
        days = 7  # trend window
        today = timezone.now().date()
        for inv in Inventory.objects.all():
            total = inv.total_stock or inv.available_stock or 1
            used = total - inv.available_stock
            percent_used = (used / total) * 100 if total else 0
            status = 'adequate'
            if percent_used > 80:
                status = 'critical'
            elif percent_used > 50:
                status = 'low'
            # Build daily usage trend for the last N days
            trend = []
            for i in range(days):
                day = today - timedelta(days=days - i - 1)
                day_usages = inv.usages.filter(timestamp__date=day)
                used_today = sum([u.used for u in day_usages if u.used > 0])
                trend.append({'date': str(day), 'used': used_today})
            resources.append({
                'id': inv.id,
                'name': inv.name,
                'category': inv.category,
                'region': inv.region,
                'available': inv.available_stock,
                'total': total,
                'status': status,
                'percent_used': percent_used,
                'cost': float(inv.cost) if inv.cost else None,
                'unit': inv.unit,
                'trend': trend,
            })
        return Response(resources)

class UserRegistrationView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username
            })
        return Response(serializer.errors, status=400)

class RoomListCreateView(ListCreateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class RoomRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class InventoryListCreateView(ListCreateAPIView):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer

class InventoryRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer

class CostListCreateView(ListCreateAPIView):
    queryset = Cost.objects.all()
    serializer_class = CostSerializer

class CostRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = Cost.objects.all()
    serializer_class = CostSerializer

class RiskAssessmentHistoryListCreateView(ListCreateAPIView):
    queryset = RiskAssessmentHistory.objects.all().order_by('-timestamp')
    serializer_class = RiskAssessmentHistorySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

class RiskAssessmentHistoryRetrieveView(RetrieveUpdateDestroyAPIView):
    queryset = RiskAssessmentHistory.objects.all()
    serializer_class = RiskAssessmentHistorySerializer

@api_view(['POST'])
def fill_inventory(request):
    # Path to the Excel file
    excel_path = os.path.join(settings.BASE_DIR, '../src/Code Her Care Datasets /Resources Inventory Cost Sheet.xlsx')
    df = pd.read_excel(excel_path)
    # Clear existing inventory
    Inventory.objects.all().delete()
    # Create new inventory items
    items = []
    for _, row in df.iterrows():
        items.append(Inventory(
            name=row.get('name') or row.get('Name'),
            category=row.get('category') or row.get('Category'),
            region=row.get('region') or row.get('Region'),
            available_stock=row.get('available_stock') or row.get('Available Stock'),
            unit=row.get('unit') or row.get('Unit')
        ))
    Inventory.objects.bulk_create(items)
    return Response({'status': 'success', 'count': len(items)})

@api_view(['POST'])
@permission_classes([AllowAny])
def risk_assessment(request):
    """
    Expects JSON: {
        "patient_id": int,
        "features": [list of risk factor values in model order],
        "region": str (optional),
        "screening_type": str (optional)
    }
    """
    global model
    patient_id = request.data.get('patient_id')
    features = request.data.get('features')
    region = request.data.get('region')
    screening_type = request.data.get('screening_type')
    if not patient_id or features is None:
        return Response({'error': 'patient_id and features are required.'}, status=400)
    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found.'}, status=404)
    try:
        risk_score = float(model.predict_proba(np.array(features).reshape(1, -1))[0][1])
        inverted_risk_score = 1.0 - risk_score

        if inverted_risk_score  > 0.7:
            recommended_action = "Immediate follow-up and HPV DNA test"
            risk_level = 'high'
        elif inverted_risk_score  > 0.4:
            recommended_action = "Pap smear and close monitoring"
            risk_level = 'medium'
        else:
            recommended_action = "Routine screening"
            risk_level = 'low'
        patient.risk_score  = inverted_risk_score 
        patient.risk_level = risk_level
        patient.save(update_fields=["risk_score", "risk_level"])
        # Save assessment history
        history = RiskAssessmentHistory.objects.create(
            patient=patient,
            age=features[0],
            sexual_partners=features[1],
            first_sexual_age=features[2],
            years_sexually_active=features[3],
            hpv_positive=features[4],
            abnormal_pap=features[5],
            smoking=features[6],
            stds_history=features[7],
            insurance=features[8],
            total_risk_score=features[9],
            region=region,
            screening_type=screening_type,
            risk_score=inverted_risk_score,
            recommended_action=recommended_action
        )
        return Response(RiskAssessmentHistorySerializer(history).data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def import_resources(request):
    # Path to your Excel file
    excel_path = '/home/asha/Desktop/codeher/Mama-AI/src/Code Her Care Datasets /Resources Inventory Cost Sheet.xlsx'
    if not os.path.exists(excel_path):
        return Response({'error': 'File not found'}, status=404)
    df = pd.read_excel(excel_path)
    from .models import Inventory
    created, updated = 0, 0
    for _, row in df.iterrows():
        name = row.get('Item')
        if not name or str(name).strip() == '':
            continue  # Skip rows with no item name
        inv, was_created = Inventory.objects.update_or_create(
            name=name,
            defaults={
                'category': row.get('Category', ''),
                'region': row.get('Region', ''),
                'available_stock': row.get('Available Stock', 0),
                'total_stock': row.get('Available Stock', 0),
                'unit': '',
                'status': '',
                'cost': row.get('Cost (KES)', 0),
            }
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return Response({'created': created, 'updated': updated, 'message': 'Import complete.'})

@api_view(['POST'])
def import_costs(request):
    excel_path = '/home/asha/Desktop/codeher/Mama-AI/src/Code Her Care Datasets /Treatment Costs Sheet.xlsx'
    if not os.path.exists(excel_path):
        return Response({'error': 'File not found'}, status=404)
    df = pd.read_excel(excel_path)
    from .models import Cost
    created, updated = 0, 0
    for _, row in df.iterrows():
        treatment = row.get('Service') or row.get('Treatment')
        if not treatment or str(treatment).strip() == '':
            continue
        obj, was_created = Cost.objects.update_or_create(
            treatment=treatment,
            defaults={
                'cost': row.get('Base Cost (KES)', 0),
                'facility': row.get('Facility', ''),
                'region': row.get('Region', ''),
                'category': row.get('Category', ''),
                'nhif_covered': row.get('NHIF Covered', ''),
                'insurance_copay': row.get('Insurance Copay (KES)', 0),
                'out_of_pocket': row.get('Out-of-Pocket (KES)', 0),
                'notes': '',
            }
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return Response({'created': created, 'updated': updated, 'message': 'Import complete.'})

class CostTrendsView(APIView):
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        today = timezone.now().date()
        trend = []
        for i in range(days):
            day = today - timedelta(days=days - i - 1)
            day_costs = Cost.objects.filter(created_at__date=day)
            total = day_costs.aggregate(total=Sum('cost'))['total'] or 0
            trend.append({'date': str(day), 'total': float(total)})
        return Response(trend)

@api_view(['POST'])
def chatbot(request):
    message = request.data.get('message', '').lower().strip()
    today = timezone.now().date()

    # Number of patients
    if "number of patients" in message or "how many patients" in message:
        count = Patient.objects.count()
        return Response({'response': f'There are {count} patients in the system.'})

    # Risk level distribution
    if "risk level" in message or "risk distribution" in message:
        high = RiskAssessmentHistory.objects.filter(risk_score__gt=0.7).count()
        medium = RiskAssessmentHistory.objects.filter(risk_score__gt=0.4, risk_score__lte=0.7).count()
        low = RiskAssessmentHistory.objects.filter(risk_score__lte=0.4).count()
        return Response({'response': f'Risk distribution: {high} high, {medium} medium, {low} low risk patients.'})

    # Available rooms
    if "rooms available" in message or "available rooms" in message or "free rooms" in message:
        # If Room model has is_available field, use it; else, return total count
        available_rooms = Room.objects.filter(is_available=True).count() if hasattr(Room, 'is_available') else Room.objects.count()
        return Response({'response': f'There are {available_rooms} rooms available.'})

    # Risk assessment stats
    if "risk assessment" in message or "assessment stats" in message:
        total = RiskAssessmentHistory.objects.count()
        today_count = RiskAssessmentHistory.objects.filter(timestamp__date=today).count()
        return Response({'response': f'Total risk assessments: {total}. Assessments today: {today_count}.'})

    # Existing logic for high risk patients
    if 'high risk' in message or ('risk' in message and 'patient' in message):
        high_risk = RiskAssessmentHistory.objects.filter(risk_score__gt=0.7).select_related('patient')[:5]
        if not high_risk:
            return Response({'response': 'There are currently no high risk patients.'})
        lines = [f"• {h.patient.name} (Risk Score: {int(h.risk_score * 100)})" for h in high_risk]
        return Response({'response': 'High risk patients:\n' + '\n'.join(lines)})

    # Today's schedule
    if 'today' in message and ('schedule' in message or 'appointment' in message):
        patients = Patient.objects.filter(appointment__startswith=today.strftime('%Y-%m-%d'))
        if not patients:
            return Response({'response': 'There are no appointments scheduled for today.'})
        lines = [f"• {p.name} ({p.condition}) at {p.appointment}" for p in patients]
        return Response({'response': f"Today's appointments:\n" + '\n'.join(lines)})

    # Resource utilization
    if 'resource' in message or 'inventory' in message:
        resources = Inventory.objects.all()[:5]
        if not resources:
            return Response({'response': 'No resource data available.'})
        lines = [f"• {r.name}: {r.available_stock}/{r.total_stock or r.available_stock} available" for r in resources]
        return Response({'response': 'Resource utilization summary:\n' + '\n'.join(lines)})

    # Fallback
    return Response({'response': "I'm sorry, I couldn't understand your request. Please try asking about the number of patients, risk levels, available rooms, or risk assessments."})



###*************************
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder
from pulp import LpMinimize, LpProblem, LpVariable, lpSum, LpStatus, value



@api_view(['POST'])
def predict_demand(request):
    model2 = joblib.load('../src/Code Her Care Datasets /Demand_Forecasting.pkl')

    items = request.data.get('Item', [])

    # Collect unique labels for encoders
    regions = list(set(item['region'] for item in items))
    categories = list(set(item['category'] for item in items))
    item_names = list(set(item['id'] for item in items))  # Assuming 'id' or change accordingly

    # Fit encoders once
    from sklearn.preprocessing import LabelEncoder
    region_le = LabelEncoder()
    category_le = LabelEncoder()
    item_le = LabelEncoder()

    region_le.fit(regions)
    category_le.fit(categories)
    item_le.fit(item_names)

    predictions = []

    for item in items:
        input_data = pd.DataFrame([{
            'Region_Encoded': region_le.transform([item['region']])[0],
            'Category_Encoded': category_le.transform([item['category']])[0],
            'Item_Encoded': item_le.transform([item['id']])[0],  # or item['Item'] if you meant that
            'Cost (KES)': float(item['cost']),
            'Avg_Stock_Last3Months': float(item.get('avg_stock', item.get('available_stock', 0)))  # fallback
        }])

        input_data = input_data.astype({
            'Region_Encoded': 'int',
            'Category_Encoded': 'int',
            'Item_Encoded': 'int',
            'Cost (KES)': 'float',
            'Avg_Stock_Last3Months': 'float'
        })

        prediction = model2.predict(input_data)[0]
        predictions.append(prediction)

    return Response({'predictions': predictions})

@api_view(['POST'])
def optimize_orders(request):
    items = request.data.get('Item', [])
    
    # Create optimization problem
    prob = LpProblem("Inventory_Optimization", LpMinimize)
    
    # Decision variables
    order_vars = LpVariable.dicts("Order", 
                                [item['id'] for item in items], 
                                lowBound=0, 
                                cat='Integer')
    
    # Objective function (minimize total cost)
    prob += lpSum([order_vars[item['id']] * float(item['cost']) for item in items])

    
    # Constraints (meet predicted demand)
    for item in items:
        if item.get('predicted_demand'):
            prob += (order_vars[item['id']] >= 
                   item['predicted_demand'] - item['available_stock'])
    
    # Solve
    prob.solve()
    
    # Prepare results
    results = []
    for item in items:
        results.append({
            'item_id': item['id'],
            'order_quantity': int(value(order_vars[item['id']])),
            'status': LpStatus[prob.status]
        })
    
    return Response({'orders': results})

@api_view(['POST'])
@permission_classes([AllowAny])
def patient_login(request):
    email = request.data.get('email')
    phone = request.data.get('phone')
    if not email or not phone:
        return Response({'error': 'Email and phone are required.'}, status=400)
    try:
        patient = Patient.objects.get(email=email)
        if patient.contact != phone:
            return Response({'error': 'Invalid credentials.'}, status=401)
        # Use patient id as identity in token
        refresh = RefreshToken()
        refresh['patient_id'] = patient.id
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'patient_id': patient.id,
        })
    except Patient.DoesNotExist:
        return Response({'error': 'Invalid credentials.'}, status=401)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Patient, RiskAssessmentHistory
from .serializers import PatientSerializer, RiskAssessmentHistorySerializer
from utils.geocoding import geocode_address, find_nearby_hospitals, get_consultation_groups

@api_view(['GET'])
@permission_classes([AllowAny])
def patient_dashboard(request):
    # Accepts ?email=... or ?patient_id=...
    email = request.query_params.get('email')
    patient_id = request.query_params.get('patient_id')
    
    try:
        if patient_id:
            patient = Patient.objects.get(id=patient_id)
        elif email:
            patient = Patient.objects.get(email=email)
        else:
            return Response({'error': 'Email or patient_id required.'}, status=400)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found.'}, status=404)
    
    # Get existing data
    assessments = RiskAssessmentHistory.objects.filter(patient=patient).order_by('-timestamp')
    patient_data = PatientSerializer(patient).data
    assessments_data = RiskAssessmentHistorySerializer(assessments, many=True).data
    
    # Initialize response data
    response_data = {
        'patient': patient_data,
        'results': assessments_data,
        'nearby_hospitals': [],
        'consultation_groups': get_consultation_groups(),
        'location_status': 'address_not_found'
    }
    
    # Get patient address from patient data
    patient_address = patient.address if hasattr(patient, 'address') and patient.address else None
    
    if patient_address:
        # Geocode patient address
        coordinates = geocode_address(patient_address)
        
        if coordinates:
            response_data['location_status'] = 'found'
            response_data['patient_coordinates'] = coordinates
            
            # Find nearby hospitals
            nearby_hospitals = find_nearby_hospitals(
                coordinates['lat'], 
                coordinates['lon'], 
                radius_km=15  # 15km radius
            )
            
            if nearby_hospitals:
                response_data['nearby_hospitals'] = nearby_hospitals
                response_data['hospitals_count'] = len(nearby_hospitals)
            else:
                response_data['location_status'] = 'no_hospitals_found'
        else:
            response_data['location_status'] = 'geocoding_failed'
    else:
        response_data['location_status'] = 'no_address_provided'
    
    return Response(response_data)