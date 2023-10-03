from flask import Flask, render_template_string, request, make_response

app = Flask(__name__)

page_header = """
<!doctype html>
<html>
  <head>
    
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'nonce-3a743205186cf10852df61f70ee7065d'">
    <!-- Internal game scripts/styles, mostly boring stuff -->
    <link rel="stylesheet" href="/static/game-frame-styles.css" />
  </head>

  <body id="level1">
    <img src="/static/logos/level1.png">
      <div>
"""

page_footer = """
    </div>
    <script nonce="3a743205186cf10852df61f70ee7065d">
      document.getElementById("query").onfocus = function() {
        this.value = "";
      }
    </script>
  </body>
</html>
"""

main_page_markup = """
<form action="" method="GET">
  <input id="query" name="query" value="Enter query here...">
  <input id="button" type="submit" value="Search">
</form>
"""


@app.route('/')
def index():
    if not request.args.get("query"):
        response = make_response(render_template_string(page_header + main_page_markup + page_footer))
    else:
        query = request.args.get("query", "[empty]")

        message = "Sorry, no results were found for <b>" + query + "</b>."
        message += " <a href='?'>Try again</a>."

        content = page_header + message + page_footer
        response = make_response(render_template_string(content))
    return response


if __name__ == "__main__":
    app.run()
