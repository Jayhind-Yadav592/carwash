import os
import mimetypes
import django
import rest_framework
from django.conf import settings
from django.http import HttpResponse, JsonResponse, FileResponse, Http404, HttpResponseRedirect
from django.utils import timezone


def api_home_page(request):
    """
    Renders an attractive, professional API Home & Documentation Page using Bootstrap 5.
    Shows server status, Django & DRF versions, current server time, documentation,
    and a list of all available API endpoints with clickable links.
    """
    if request.headers.get('Accept') == 'application/json':
        return JsonResponse({
            "name": "Rudra Car Wash API",
            "version": "v1",
            "status": "Running ✅",
            "server_time": timezone.now().isoformat(),
            "django_version": django.get_version(),
            "drf_version": rest_framework.__version__,
            "endpoints": {
                "admin": "/admin/",
                "auth_token": "/api/v1/auth/token/",
                "auth_refresh": "/api/v1/auth/token/refresh/",
                "accounts": "/api/v1/accounts/",
                "services": "/api/v1/services/",
                "bookings": "/api/v1/bookings/",
                "contact": "/api/v1/contact/submit/",
                "reviews": "/api/v1/reviews/",
                "gallery": "/api/v1/gallery/",
                "dashboard": "/api/v1/dashboard/",
            }
        })

    current_time = timezone.now().strftime("%B %d, %Y - %H:%M:%S %Z")
    django_ver = django.get_version()
    drf_ver = rest_framework.__version__

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rudra Car Wash API | Portal</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body {{
            background-color: #0f172a;
            color: #f8fafc;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }}
        .card-custom {{
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }}
        .endpoint-card {{
            background: #0f172a;
            border: 1px solid #334155;
            transition: all 0.2s ease-in-out;
        }}
        .endpoint-card:hover {{
            transform: translateY(-3px);
            border-color: #f59e0b;
            box-shadow: 0 8px 16px rgba(245, 158, 11, 0.15);
        }}
        .btn-yellow {{
            background-color: #f59e0b;
            color: #0f172a;
            font-weight: 700;
            border: none;
        }}
        .btn-yellow:hover {{
            background-color: #d97706;
            color: #ffffff;
        }}
        .method-badge {{
            font-size: 0.72rem;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark border-bottom border-secondary py-3" style="background-color: #1e293b;">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center fw-bold text-warning" href="/api/v1/">
                <i class="fa-solid fa-car-wash me-2 fs-4"></i> RUDRA CAR WASH API
            </a>
            <div class="d-flex align-items-center gap-2">
                <span class="badge bg-success text-white px-3 py-2 rounded-pill"><i class="fa-solid fa-circle-check me-1"></i> Running ✅</span>
                <a href="/" class="btn btn-yellow btn-sm px-3"><i class="fa-solid fa-desktop me-1"></i> Open Frontend App</a>
            </div>
        </div>
    </nav>

    <!-- Main Hero -->
    <div class="container my-5 flex-grow-1">
        <div class="row justify-content-center">
            <div class="col-lg-10">

                <!-- Header Banner -->
                <div class="card-custom p-4 p-md-5 mb-4 text-center">
                    <div class="d-inline-block bg-warning text-dark px-3 py-1 rounded-pill mb-3 fw-bold small">
                        <i class="fa-solid fa-code me-1"></i> DRF BACKEND ENGINE
                    </div>
                    <h1 class="display-5 fw-extrabold text-white mb-3">Rudra Car Wash REST API</h1>
                    <p class="lead mb-4" style="color: #94a3b8;">
                        Complete, secure, role-based backend API platform serving the Rudra Doorstep Express Car Wash service.
                    </p>

                    <div class="row g-3 justify-content-center text-center mt-2">
                        <div class="col-6 col-md-3">
                            <div class="p-3 rounded border border-secondary" style="background: #0f172a;">
                                <div class="text-muted small">API Version</div>
                                <div class="fs-5 fw-bold text-warning">v1</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="p-3 rounded border border-secondary" style="background: #0f172a;">
                                <div class="text-muted small">Django Version</div>
                                <div class="fs-5 fw-bold text-info">{django_ver}</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="p-3 rounded border border-secondary" style="background: #0f172a;">
                                <div class="text-muted small">DRF Version</div>
                                <div class="fs-5 fw-bold text-success">{drf_ver}</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="p-3 rounded border border-secondary" style="background: #0f172a;">
                                <div class="text-muted small">Server Time</div>
                                <div class="small fw-bold text-light mt-1">{current_time}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Documentation Section -->
                <div class="card-custom p-4 mb-4">
                    <h4 class="text-warning mb-3"><i class="fa-solid fa-book-bookmark me-2"></i> Documentation & Overview</h4>
                    <p class="mb-3" style="color: #cbd5e1;">
                        The API provides full JSON REST endpoints for User Authentication, Doorstep Wash Service Packages, Appointment Slot Bookings, Contact Messages, Customer Reviews, Gallery Media, and Admin Analytics.
                    </p>
                    <div class="alert alert-dark border border-secondary d-flex align-items-center mb-0" role="alert" style="background-color: #0f172a; color: #94a3b8;">
                        <i class="fa-solid fa-key text-warning me-3 fs-4"></i>
                        <div>
                            <strong class="text-white">Authentication Note:</strong> Protected endpoints require a valid JWT Access Token passed via HTTP Header: <code>Authorization: Bearer &lt;your_token&gt;</code>. Obtain tokens via the Auth Token Endpoint below.
                        </div>
                    </div>
                </div>

                <!-- Endpoints List -->
                <div class="card-custom p-4">
                    <h4 class="text-white mb-4"><i class="fa-solid fa-network-wired me-2 text-warning"></i> Available API Endpoints</h4>

                    <div class="row g-3">

                        <!-- Accounts -->
                        <div class="col-md-6">
                            <div class="endpoint-card p-3 rounded h-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-primary method-badge">POST / GET</span>
                                    <span class="small text-muted">Authentication & Users</span>
                                </div>
                                <h5 class="mb-1"><a href="/api/v1/accounts/" class="text-decoration-none text-warning">Accounts & Auth API</a></h5>
                                <p class="small text-muted mb-2">Registration, Login, JWT Token obtain/refresh, User Profile & Admin User Management.</p>
                                <a href="/api/v1/accounts/" class="btn btn-outline-light btn-sm w-100"><i class="fa-solid fa-arrow-right me-1"></i> Explore Endpoint</a>
                            </div>
                        </div>

                        <!-- Services -->
                        <div class="col-md-6">
                            <div class="endpoint-card p-3 rounded h-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-success method-badge">GET / POST / PUT</span>
                                    <span class="small text-muted">Doorstep Packages</span>
                                </div>
                                <h5 class="mb-1"><a href="/api/v1/services/" class="text-decoration-none text-warning">Services API</a></h5>
                                <p class="small text-muted mb-2">List doorstep wash packages, pricing, durations, and manage service offerings.</p>
                                <a href="/api/v1/services/" class="btn btn-outline-light btn-sm w-100"><i class="fa-solid fa-arrow-right me-1"></i> Explore Endpoint</a>
                            </div>
                        </div>

                        <!-- Bookings -->
                        <div class="col-md-6">
                            <div class="endpoint-card p-3 rounded h-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-info text-dark method-badge">GET / POST / PATCH</span>
                                    <span class="small text-muted">Slot Management</span>
                                </div>
                                <h5 class="mb-1"><a href="/api/v1/bookings/" class="text-decoration-none text-warning">Bookings API</a></h5>
                                <p class="small text-muted mb-2">Create doorstep wash appointments, check 1.5-hour slot availability, and update status.</p>
                                <a href="/api/v1/bookings/" class="btn btn-outline-light btn-sm w-100"><i class="fa-solid fa-arrow-right me-1"></i> Explore Endpoint</a>
                            </div>
                        </div>

                        <!-- Contact -->
                        <div class="col-md-6">
                            <div class="endpoint-card p-3 rounded h-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-warning text-dark method-badge">POST / GET</span>
                                    <span class="small text-muted">Customer Inquiries</span>
                                </div>
                                <h5 class="mb-1"><a href="/api/v1/contact/submit/" class="text-decoration-none text-warning">Contact API</a></h5>
                                <p class="small text-muted mb-2">Submit contact requests and view customer messages in the admin portal.</p>
                                <a href="/api/v1/contact/submit/" class="btn btn-outline-light btn-sm w-100"><i class="fa-solid fa-arrow-right me-1"></i> Explore Endpoint</a>
                            </div>
                        </div>

                        <!-- Reviews -->
                        <div class="col-md-6">
                            <div class="endpoint-card p-3 rounded h-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-secondary method-badge">GET / POST / PATCH</span>
                                    <span class="small text-muted">Ratings & Reviews</span>
                                </div>
                                <h5 class="mb-1"><a href="/api/v1/reviews/" class="text-decoration-none text-warning">Reviews API</a></h5>
                                <p class="small text-muted mb-2">Customer rating submission, list approved wash feedback, and admin approval.</p>
                                <a href="/api/v1/reviews/" class="btn btn-outline-light btn-sm w-100"><i class="fa-solid fa-arrow-right me-1"></i> Explore Endpoint</a>
                            </div>
                        </div>

                        <!-- Gallery -->
                        <div class="col-md-6">
                            <div class="endpoint-card p-3 rounded h-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-danger method-badge">GET / POST / DELETE</span>
                                    <span class="small text-muted">Media Showcase</span>
                                </div>
                                <h5 class="mb-1"><a href="/api/v1/gallery/" class="text-decoration-none text-warning">Gallery API</a></h5>
                                <p class="small text-muted mb-2">Showcase images of car wash transformations and before/after media items.</p>
                                <a href="/api/v1/gallery/" class="btn btn-outline-light btn-sm w-100"><i class="fa-solid fa-arrow-right me-1"></i> Explore Endpoint</a>
                            </div>
                        </div>

                        <!-- Dashboard -->
                        <div class="col-md-6">
                            <div class="endpoint-card p-3 rounded h-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-dark border border-warning text-warning method-badge">GET (Admin)</span>
                                    <span class="small text-muted">Analytics</span>
                                </div>
                                <h5 class="mb-1"><a href="/api/v1/dashboard/" class="text-decoration-none text-warning">Dashboard API</a></h5>
                                <p class="small text-muted mb-2">Real-time metrics: total users, bookings status breakdown, services & reviews.</p>
                                <a href="/api/v1/dashboard/" class="btn btn-outline-light btn-sm w-100"><i class="fa-solid fa-arrow-right me-1"></i> Explore Endpoint</a>
                            </div>
                        </div>

                        <!-- Django Admin -->
                        <div class="col-md-6">
                            <div class="endpoint-card p-3 rounded h-100">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-light text-dark method-badge">GUI Portal</span>
                                    <span class="small text-muted">Management Interface</span>
                                </div>
                                <h5 class="mb-1"><a href="/admin/" class="text-decoration-none text-warning">Django Admin Portal</a></h5>
                                <p class="small text-muted mb-2">Full database administration interface for managing models and permissions.</p>
                                <a href="/admin/" class="btn btn-outline-light btn-sm w-100"><i class="fa-solid fa-arrow-right me-1"></i> Open Django Admin</a>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="py-4 text-center border-top border-secondary mt-5" style="background-color: #1e293b; color: #64748b;">
        <div class="container">
            <p class="mb-1 small">© 2026 Rudra Doorstep Express Car Wash - All Rights Reserved.</p>
            <p class="mb-0 small text-muted">Powered by Django REST Framework & Python 3</p>
        </div>
    </footer>
</body>
</html>
"""
    return HttpResponse(html_content)


import urllib.parse

def frontend_serve_file(request, path=""):
    """
    Serves Frontend static assets, media files, or pages cleanly with exact MIME types and URL decoding.
    """
    path = urllib.parse.unquote(path)
    frontend_dir = settings.BASE_DIR.parent / 'Frontend'
    media_dir = settings.MEDIA_ROOT

    # 1. Handle media requests (/media/...)
    if path.startswith('media/'):
        rel_media = path[6:]
        target_media = media_dir / rel_media
        if target_media.exists() and target_media.is_file():
            content_type, _ = mimetypes.guess_type(str(target_media))
            return FileResponse(open(target_media, 'rb'), content_type=content_type or 'image/jpeg')
        img_filename = os.path.basename(rel_media)
        alt_target = frontend_dir / 'images' / img_filename
        if alt_target.exists() and alt_target.is_file():
            content_type, _ = mimetypes.guess_type(str(alt_target))
            return FileResponse(open(alt_target, 'rb'), content_type=content_type or 'image/jpeg')

    # 2. Direct path matching in Frontend
    if not path or path == '/':
        target = frontend_dir / 'index.html'
    else:
        target = frontend_dir / path

    if target.exists() and target.is_file():
        content_type, _ = mimetypes.guess_type(str(target))
        if target.suffix == '.css':
            content_type = 'text/css'
        elif target.suffix == '.js':
            content_type = 'application/javascript'
        elif target.suffix == '.html':
            content_type = 'text/html'
        return FileResponse(open(target, 'rb'), content_type=content_type)

    # 3. Check filename fallback in Frontend/images or Frontend/pages/images
    if 'images/' in path or path.endswith(('.jpeg', '.jpg', '.png', '.webp')):
        img_name = os.path.basename(path)
        img_target = frontend_dir / 'images' / img_name
        if img_target.exists() and img_target.is_file():
            content_type, _ = mimetypes.guess_type(str(img_target))
            return FileResponse(open(img_target, 'rb'), content_type=content_type or 'image/jpeg')

    if not target.suffix:
        html_target = frontend_dir / f"{path}.html"
        page_target = frontend_dir / 'pages' / f"{path}.html"
        admin_target = frontend_dir / 'admin' / f"{path}.html"
        
        if html_target.exists() and html_target.is_file():
            return FileResponse(open(html_target, 'rb'), content_type='text/html')
        if page_target.exists() and page_target.is_file():
            return FileResponse(open(page_target, 'rb'), content_type='text/html')
        if admin_target.exists() and admin_target.is_file():
            return FileResponse(open(admin_target, 'rb'), content_type='text/html')

    if not path or path == '/':
        return api_home_page(request)

    raise Http404("File not found")
