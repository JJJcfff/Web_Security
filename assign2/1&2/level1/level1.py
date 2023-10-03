from flask import Flask, render_template_string, request

app = Flask(__name__)

page_header = """
<!doctype html>
<html>
  <head>
    <!-- Internal game scripts/styles, mostly boring stuff -->
    <link rel="stylesheet" href="/static/game-frame-styles.css" />
  </head>

  <body id="level1">
    <img src="/static/logos/level1.png">
    <div>
"""

page_footer = """
    </div>
  </body>
</html>
"""

main_page_markup = """
<form action="" method="GET">
  <input id="query" name="query" value="Enter query here..."
    onfocus="this.value=''">
  <input id="button" type="submit" value="Search">
</form>
"""


@app.route('/')
def index():
    if not request.args.get("query"):
        return render_template_string(page_header + main_page_markup + page_footer)
    else:
        query = request.args.get("query", "[empty]")

        message = "Sorry, no results were found for <b>" + query + "</b>."
        message += " <a href='?'>Try again</a>."

        return render_template_string(page_header + message + page_footer)


if __name__ == "__main__":
    app.run()
