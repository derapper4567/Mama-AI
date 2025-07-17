from django.urls import path
from .views import PredictView, PatientListCreateView, DashboardStatsView, PatientRetrieveUpdateDestroyView, RiskDistributionView, ResourceUtilizationView, ResourceUtilizationAnalyticsView, UserRegistrationView, RoomListCreateView, RoomRetrieveUpdateDestroyView, InventoryListCreateView, InventoryRetrieveUpdateDestroyView, CostListCreateView, CostRetrieveUpdateDestroyView, RiskAssessmentHistoryListCreateView, RiskAssessmentHistoryRetrieveView, fill_inventory, risk_assessment, import_resources, import_costs, CostTrendsView, optimize_orders, predict_demand, chatbot, patient_login, patient_dashboard
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('predict/', PredictView.as_view(), name='predict'),
    path('patients/', PatientListCreateView.as_view(), name='patients'),
    path('patients/<int:pk>/', PatientRetrieveUpdateDestroyView.as_view(), name='patient-detail'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('risk-distribution/', RiskDistributionView.as_view(), name='risk-distribution'),
    path('resource-utilization/', ResourceUtilizationView.as_view(), name='resource-utilization'),
    path('resource-utilization-analytics/', ResourceUtilizationAnalyticsView.as_view(), name='resource-utilization-analytics'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', obtain_auth_token, name='login'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('rooms/', RoomListCreateView.as_view(), name='rooms'),
    path('rooms/<int:pk>/', RoomRetrieveUpdateDestroyView.as_view(), name='room-detail'),
    path('inventory/', InventoryListCreateView.as_view(), name='inventory-list-create'),
    path('inventory/<int:pk>/', InventoryRetrieveUpdateDestroyView.as_view(), name='inventory-detail'),
    path('costs/', CostListCreateView.as_view(), name='cost-list-create'),
    path('costs/<int:pk>/', CostRetrieveUpdateDestroyView.as_view(), name='cost-detail'),
    path('risk-assessment-history/', RiskAssessmentHistoryListCreateView.as_view(), name='risk-assessment-history-list-create'),
    path('risk-assessment-history/<int:pk>/', RiskAssessmentHistoryRetrieveView.as_view(), name='risk-assessment-history-detail'),
    path('inventory/fill/', fill_inventory, name='inventory-fill'),
    path('risk_assessment/', risk_assessment, name='risk_assessment'),
    path('import-resources/', import_resources, name='import-resources'),
    path('import-costs/', import_costs, name='import-costs'),
    path('cost-trends/', CostTrendsView.as_view(), name='cost-trends'),
    path('predict-demand/', predict_demand, name='predict_demand'),
    path('optimize_orders/', optimize_orders, name='optimize_orders'),
    path('chatbot/', chatbot, name='chatbot'),
    path('patient-login/', patient_login, name='patient-login'),
    path('patient-dashboard/', patient_dashboard, name='patient-dashboard'),
] 