from flask import Blueprint, jsonify

bp = Blueprint("docs", __name__, url_prefix="/docs")

_SWAGGER_UI_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TTP Tracker — API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #1a1a2e; }
    .swagger-ui .topbar { background: #0f172a; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/docs/api/openapi.json",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
      deepLinking: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
    });
  </script>
</body>
</html>"""


@bp.get("/api")
def swagger_ui():
    from flask import Response
    return Response(_SWAGGER_UI_HTML, mimetype="text/html")


@bp.get("/api/openapi.json")
def openapi_spec():
    from app.api_spec import SPEC
    return jsonify(SPEC)
