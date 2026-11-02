from django.contrib import admin
from django.urls import path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts.views import (
    LoginView,
    LogoutView,
    MeView,
    StaffDetailUpdateView,
    StaffListCreateView,
    csrf_cookie,
)
from apps.checkin.views import (
    AdminDashboardStatsView,
    StaffCheckInHistoryView,
    StaffCheckInView,
)
from apps.core.views import (
    AdminAuditLogListView,
    AdminSettingsView,
    PublicSettingsView,
    health,
)
from apps.orders.views import (
    AdminOrderDetailView,
    AdminOrderListView,
    CreateOrderView,
    OrderStatusView,
)
from apps.payments.views import (
    AdminPaymentListView,
    AdminRetryVerificationView,
    ZarinPalCallbackView,
)
from apps.tickets.views import (
    AdminTicketCancelView,
    AdminTicketListView,
    OrderTicketsView,
    TicketQrImageView,
)

urlpatterns = [
    re_path(r"^api/v1/health/?$", health, name="health"),
    path("admin/", admin.site.urls),
    # OpenAPI Schema & Interactive Documentation
    re_path(r"^api/schema/?$", SpectacularAPIView.as_view(), name="schema"),
    re_path(r"^api/docs/?$", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    # Public Endpoints (Accepting both with and without trailing slash)
    re_path(r"^api/v1/public/settings/?$", PublicSettingsView.as_view(), name="public-settings"),
    re_path(r"^api/v1/orders/?$", CreateOrderView.as_view(), name="create-order"),
    re_path(r"^api/v1/orders/(?P<public_id>[0-9a-f-]+)/status/?$", OrderStatusView.as_view(), name="order-status"),
    re_path(r"^api/v1/orders/(?P<public_id>[0-9a-f-]+)/tickets/?$", OrderTicketsView.as_view(), name="order-tickets"),
    re_path(r"^api/v1/tickets/(?P<public_id>[0-9a-f-]+)/qr(\.png)?/?$", TicketQrImageView.as_view(), name="ticket-qr-png"),
    re_path(r"^api/v1/payments/zarinpal/callback/?$", ZarinPalCallbackView.as_view(), name="zarinpal-callback"),

    # Authentication Endpoints
    re_path(r"^api/v1/auth/csrf/?$", csrf_cookie, name="auth-csrf"),
    re_path(r"^api/v1/auth/login/?$", LoginView.as_view(), name="auth-login"),
    re_path(r"^api/v1/auth/logout/?$", LogoutView.as_view(), name="auth-logout"),
    re_path(r"^api/v1/auth/me/?$", MeView.as_view(), name="auth-me"),

    # Staff Check-In Endpoints
    re_path(r"^api/v1/staff/check-in/?$", StaffCheckInView.as_view(), name="staff-checkin"),
    re_path(r"^api/v1/staff/check-in/history/?$", StaffCheckInHistoryView.as_view(), name="staff-checkin-history"),

    # Admin Management Endpoints
    re_path(r"^api/v1/admin/dashboard/?$", AdminDashboardStatsView.as_view(), name="admin-dashboard"),
    re_path(r"^api/v1/admin/orders/?$", AdminOrderListView.as_view(), name="admin-orders-list"),
    re_path(r"^api/v1/admin/orders/(?P<public_id>[0-9a-f-]+)/?$", AdminOrderDetailView.as_view(), name="admin-orders-detail"),
    re_path(r"^api/v1/admin/tickets/?$", AdminTicketListView.as_view(), name="admin-tickets-list"),
    re_path(r"^api/v1/admin/tickets/(?P<pk>[0-9]+)/cancel/?$", AdminTicketCancelView.as_view(), name="admin-tickets-cancel"),
    re_path(r"^api/v1/admin/payments/?$", AdminPaymentListView.as_view(), name="admin-payments-list"),
    re_path(r"^api/v1/admin/payments/(?P<pk>[0-9]+)/retry-verification/?$", AdminRetryVerificationView.as_view(), name="admin-payments-retry"),
    re_path(r"^api/v1/admin/settings/?$", AdminSettingsView.as_view(), name="admin-settings"),
    re_path(r"^api/v1/admin/staff/?$", StaffListCreateView.as_view(), name="admin-staff-list"),
    re_path(r"^api/v1/admin/staff/(?P<pk>[0-9]+)/?$", StaffDetailUpdateView.as_view(), name="admin-staff-detail"),
    re_path(r"^api/v1/admin/audit-logs/?$", AdminAuditLogListView.as_view(), name="admin-audit-logs"),
]
